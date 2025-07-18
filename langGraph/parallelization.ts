import { StateGraph, Annotation } from "@langchain/langgraph";
import { ChatAnthropic } from "@langchain/anthropic";
import * as dotenv from "dotenv";
import { traceable } from "langsmith/traceable";
import { wrapOpenAI } from "langsmith/wrappers";
dotenv.config();

process.env.ANTHROPIC_API_KEY;
const llm = new ChatAnthropic({
  model: "claude-3-5-sonnet-latest",
});

const StateAnnotation = Annotation.Root({
  topic: Annotation<string>,
  joke: Annotation<string>,
  story: Annotation<string>,
  poem: Annotation<string>,
  combinedOutput: Annotation<string>,
});

async function callLlm1(state: typeof StateAnnotation.State) {
  const msg = await llm.invoke(`Write a joke about ${state.topic}`);
  return { joke: msg.content };
}

async function callLlm2(state: typeof StateAnnotation.State) {
  const msg = await llm.invoke(`Write a story about ${state.topic}`);
  return { story: msg.content };
}

async function callLlm3(state: typeof StateAnnotation.State) {
  const msg = await llm.invoke(`Write a poem about ${state.topic}`);
  return { poem: msg.content };
}

async function aggregator(state: typeof StateAnnotation.State) {
  const combined =
    `Here's a story, joke, and poem about ${state.topic}!\n\n` +
    `STORY:\n${state.story}\n\n` +
    `JOKE:\n${state.joke}\n\n` +
    `POEM:\n${state.poem}`;
  return { combinedOutput: combined };
}

const parallelWorkflow = new StateGraph(StateAnnotation)
  .addNode("callLlm1", callLlm1)
  .addNode("callLlm2", callLlm2)
  .addNode("callLlm3", callLlm3)
  .addNode("aggregator", aggregator)
  .addEdge("__start__", "callLlm1")
  .addEdge("__start__", "callLlm2")
  .addEdge("__start__", "callLlm3")
  .addEdge("callLlm1", "aggregator")
  .addEdge("callLlm2", "aggregator")
  .addEdge("callLlm3", "aggregator")
  .addEdge("aggregator", "__end__")
  .compile();

const tracedWorkflow = traceable(
  async (input: { topic: string }) => {
    const result = await parallelWorkflow.invoke(input);
    console.log(result.combinedOutput);
    return result;
  },
  { name: "Parallel LLM Workflow" }
);

await tracedWorkflow({ topic: "cats" });
