import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ChatAnthropic } from "@langchain/anthropic";
import { LangChainTracer } from "langchain/callbacks";
import dotenv from "dotenv";
dotenv.config();

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const LANGCHAIN_API_KEY = process.env.LANGCHAIN_API_KEY;
const LANGCHAIN_PROJECT = process.env.LANGCHAIN_PROJECT || "default";

if (!ANTHROPIC_API_KEY) throw new Error("Missing ANTHROPIC_API_KEY");
if (!LANGCHAIN_API_KEY) throw new Error("Missing LANGCHAIN_API_KEY");

const tracer = new LangChainTracer({
  projectName: LANGCHAIN_PROJECT,
});

const llm = new ChatAnthropic({
  model: "claude-3-5-sonnet-latest",
  callbacks: [tracer],
});

// Define Zod schema for structured output
const searchQuerySchema = z.object({
  searchQuery: z.string().describe("Query that is optimized for web search."),
  justification: z
    .string()
    .describe("Why this query is relevant to the user's request."),
});

// Use structured output wrapper
const structuredLlm = llm.withStructuredOutput(searchQuerySchema, {
  name: "searchQuery",
});

// Invoke LLM with structured output
const output = await structuredLlm.invoke(
  "How does Calcium CT score relate to high cholesterol?",
  {
    runName: "SearchQueryStructuredOutput",
  }
);
console.log("🔍 Structured Output:\n", output);

// Define math tools
const add = tool(async ({ a, b }) => a + b, {
  name: "add",
  description: "Add two numbers together.",
  schema: z.object({
    a: z.number().describe("The first number"),
    b: z.number().describe("The second number"),
  }),
});

const subtract = tool(async ({ a, b }) => a - b, {
  name: "subtract",
  description: "Subtract two numbers.",
  schema: z.object({
    a: z.number().describe("The number to subtract from"),
    b: z.number().describe("The number to subtract"),
  }),
});

const multiply = tool(async ({ a, b }) => a * b, {
  name: "multiply",
  description: "Multiply two numbers.",
  schema: z.object({
    a: z.number().describe("The first number"),
    b: z.number().describe("The second number"),
  }),
});

const calculator = tool(
  async (input) => {
    try {
      return eval(input);
    } catch {
      return "Invalid math expression.";
    }
  },
  {
    name: "calculator",
    description: "Evaluate a basic math expression as a string input.",
  }
);

// Bind tools to the LLM
const llmWithTools = llm.bindTools([add, subtract, multiply, calculator]);

// Invoke LLM using tools
const mathMessage = await llmWithTools.invoke("What is 2+3?", {
  runName: "SimpleMathQuestion",
});

console.log(
  "\n🧮 Tool Calls:\n",
  mathMessage.tool_calls ?? "No tools were used."
);
console.log("\n🗣️ LLM Response:\n", mathMessage.content);
