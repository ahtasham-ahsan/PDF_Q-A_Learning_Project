import { StateGraph, Annotation } from "@langchain/langgraph";
import { z } from "zod";
import { ChatAnthropic } from "@langchain/anthropic";
import * as dotenv from "dotenv";
dotenv.config();
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const LANGSMITH_PROJECT = process.env.LANGSMITH_PROJECT || "routing-graph";
if (!ANTHROPIC_API_KEY)
    throw new Error("❌ Missing ANTHROPIC_API_KEY");
const llm = new ChatAnthropic({
    model: "claude-3-5-sonnet-latest",
});
// Define structured schema for routing decision
const routeSchema = z.object({
    step: z
        .enum(["poem", "story", "joke"])
        .describe("The next step in the routing process"),
});
// Augment LLM with structured output
const router = llm.withStructuredOutput(routeSchema, {
    name: "Router",
});
// Define LangGraph state annotations
const StateAnnotation = Annotation.Root({
    input: Annotation(),
    decision: Annotation(),
    output: Annotation(),
});
// LLM nodes
async function generateStory(state) {
    const result = await llm.invoke([
        { role: "system", content: "You are an expert storyteller." },
        { role: "user", content: state.input },
    ], {
        runName: "GenerateStory",
    });
    return { output: result.content };
}
async function generateJoke(state) {
    const result = await llm.invoke([
        { role: "system", content: "You are an expert comedian." },
        { role: "user", content: state.input },
    ], {
        runName: "GenerateJoke",
    });
    return { output: result.content };
}
async function generatePoem(state) {
    const result = await llm.invoke([
        { role: "system", content: "You are an expert poet." },
        { role: "user", content: state.input },
    ], {
        runName: "GeneratePoem",
    });
    return { output: result.content };
}
// Routing node
async function routeInput(state) {
    const decision = await router.invoke([
        {
            role: "system",
            content: "Route the input to story, joke, or poem based on the user's request.",
        },
        {
            role: "user",
            content: state.input,
        },
    ]);
    return { decision: decision.step };
}
// Conditional logic for routing
function routeDecision(state) {
    switch (state.decision) {
        case "story":
            return "generateStory";
        case "joke":
            return "generateJoke";
        case "poem":
            return "generatePoem";
        default:
            throw new Error(`❌ Unknown routing decision: ${state.decision}`);
    }
}
// Build LangGraph workflow
const routerWorkflow = new StateGraph(StateAnnotation)
    .addNode("generateStory", generateStory)
    .addNode("generateJoke", generateJoke)
    .addNode("generatePoem", generatePoem)
    .addNode("routeInput", routeInput)
    .addEdge("__start__", "routeInput")
    .addConditionalEdges("routeInput", routeDecision, [
    "generateStory",
    "generateJoke",
    "generatePoem",
])
    .addEdge("generateStory", "__end__")
    .addEdge("generateJoke", "__end__")
    .addEdge("generatePoem", "__end__")
    .compile();
// Invoke the graph
const inputText = "Write me a joke about cats";
console.log(`\n🧠 Invoking LangGraph with input: "${inputText}"\n`);
const finalState = await routerWorkflow.invoke({ input: inputText }, {
    runName: "DynamicRoutingGraph",
});
console.log("\n🎯 Final Output:\n", finalState.output);
