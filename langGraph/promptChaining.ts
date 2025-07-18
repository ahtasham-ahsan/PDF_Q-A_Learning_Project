import { StateGraph, Annotation } from "@langchain/langgraph";
import { ChatAnthropic } from "@langchain/anthropic";
import { LangChainTracer } from "langchain/callbacks";

import { Client } from "langsmith";

import * as dotenv from "dotenv";
dotenv.config();

// Ensure LangSmith env vars are set
const LANGCHAIN_API_KEY = process.env.LANGCHAIN_API_KEY;
const LANGCHAIN_PROJECT = process.env.LANGCHAIN_PROJECT || "default";

if (!LANGCHAIN_API_KEY) {
  throw new Error("LANGCHAIN_API_KEY is not set. Please check your .env file.");
}
const client = new Client({
  apiUrl: process.env.LANGSMITH_ENDPOINT,
  apiKey: process.env.LANGCHAIN_API_KEY,
});
// Set up LangSmith tracer
const tracer = new LangChainTracer({
  projectName: LANGCHAIN_PROJECT,
  client,
});

const llm = new ChatAnthropic({
  model: "claude-3-5-sonnet-latest",
  callbacks: [tracer], 
});

// Graph state
const StateAnnotation = Annotation.Root({
  topic: Annotation<string>(),
  joke: Annotation<string>(),
  improvedJoke: Annotation<string>(),
  finalJoke: Annotation<string>(),
});

// Node: Generate joke
async function generateJoke(state: typeof StateAnnotation.State) {
  const msg = await llm.invoke(`Write a short joke about ${state.topic}`);
  return { joke: msg.content };
}

// Gate: Check if joke has a punchline
function checkPunchline(state: typeof StateAnnotation.State) {
  if (state.joke?.includes("?") || state.joke?.includes("!")) {
    return "Pass";
  }
  return "Fail";
}

// Node: Improve the joke
async function improveJoke(state: typeof StateAnnotation.State) {
  const msg = await llm.invoke(
    `Make this joke funnier by adding wordplay: ${state.joke}`
  );
  return { improvedJoke: msg.content };
}

// Node: Final polish
async function polishJoke(state: typeof StateAnnotation.State) {
  const msg = await llm.invoke(
    `Add a surprising twist to this joke: ${state.improvedJoke}`
  );
  return { finalJoke: msg.content };
}

// Build LangGraph workflow
const chain = new StateGraph(StateAnnotation)
  .addNode("generateJoke", generateJoke)
  .addNode("improveJoke", improveJoke)
  .addNode("polishJoke", polishJoke)
  .addEdge("__start__", "generateJoke")
  .addConditionalEdges("generateJoke", checkPunchline, {
    Pass: "improveJoke",
    Fail: "__end__",
  })
  .addEdge("improveJoke", "polishJoke")
  .addEdge("polishJoke", "__end__")
  .compile({
    callbacks: [tracer],
  } as any);

// Execute the graph with tracing
const topic = "cats";

console.log(`\n🧠 Running LangGraph with topic: "${topic}"\n`);

const state = await chain.invoke(
  { topic },
  {
    runName: "JokeGeneratorFlow",
  }
);

console.log("\n🃏 Initial joke:\n", state.joke);
console.log("\n--- --- ---\n");

if (state.improvedJoke !== undefined) {
  console.log("🤣 Improved joke:\n", state.improvedJoke);
  console.log("\n--- --- ---\n");

  console.log("🎉 Final joke:\n", state.finalJoke);
} else {
  console.log("Joke failed quality gate - no punchline detected!");
}
