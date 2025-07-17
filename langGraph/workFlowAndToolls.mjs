import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ChatAnthropic } from "@langchain/anthropic";
import dotenv from "dotenv";
dotenv.config();
process.env.ANTHROPIC_API_KEY;
const llm = new ChatAnthropic({
  model: "claude-3-5-sonnet-latest",
});

const searchQuerySchema = z.object({
  searchQuery: z.string().describe("Query that is optimized web search."),
  justification: z.string("Why this query is relevant to the user's request."),
});

// Augment the LLM with schema for structured output
const structuredLlm = llm.withStructuredOutput(searchQuerySchema, {
  name: "searchQuery",
});

// Invoke the augmented LLM
const output = await structuredLlm.invoke(
  "How does Calcium CT score relate to high cholesterol?"
);
console.log(output);
const add = tool(
  async ({ a, b }) => {
    return a + b;
  },
  {
    name: "add",
    description: "Add two numbers",
    schema: z.object({
      a: z.number("First Number"),
      b: z.number("Second Number"),
    }),
  }
);
const mathTool = tool(
  async (input) => {
    return eval(input);
  },
  {
    name: "calculator",
    description: "Performs basic math operations",
  }
);

const subtract = tool(
  async ({ a, b }) => {
    return a - b;
  },
  {
    name: "subtract",
    description: "Subtract two numbers",
    schema: z.object({
      a: z.number("First Number"),
      b: z.number("Second Number"),
    }),
  }
);

const multiply = tool(
  async ({ a, b }) => {
    return a * b;
  },
  {
    name: "multiply",
    description: "multiplies two numbers together",
    schema: z.object({
      a: z.number("the first number"),
      b: z.number("the second number"),
    }),
  }
);

const llmWithTools = llm.bindTools([add, subtract, multiply, mathTool]);

const message = await llmWithTools.invoke("What is 2+3?");

console.log(message.tool_calls);
