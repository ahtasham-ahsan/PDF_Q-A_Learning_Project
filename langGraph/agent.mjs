// DML5UK86RAKZCZCZ46HWUGAD
import dotenv from "dotenv";
dotenv.config();
process.env.OPENAI_API_KEY;
process.env.TAVILY_API_KEY;
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { ChatOpenAI } from "@langchain/openai";
import { MemorySaver } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { LangChainTracer } from "@langchain/core/tracers/tracer_langchain";

async function main() {
  // Define tools and model
  const tools = [new TavilySearchResults({ maxResults: 3 })];
  const llm = new ChatOpenAI({ temperature: 0 });
  const memory = new MemorySaver();

  // Create the agent
  const agent = createReactAgent({
    llm,
    tools,
    checkpointSaver: memory,
  });

  // Advanced LangSmith tracing: set up a tracer for a custom project
  const tracer = new LangChainTracer({
    projectName: process.env.LANGSMITH_PROJECT || "default",
  });

  // Run first query with tracer
  const pakState = await agent.invoke(
    { messages: [new HumanMessage("what is the current weather in Pakistan")] },
    { configurable: { thread_id: "42" }, callbacks: [tracer] }
  );
  console.log(pakState.messages.slice(-1)[0].content);

  // Continue conversation with tracer
  const swState = await agent.invoke(
    { messages: [new HumanMessage("what about Sweden")] },
    { configurable: { thread_id: "42" }, callbacks: [tracer] }
  );
  console.log(swState.messages.slice(-1)[0].content);
}

main().catch(console.error);
