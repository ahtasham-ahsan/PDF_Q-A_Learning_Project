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

  // Run first query
  const sfState = await agent.invoke(
    { messages: [new HumanMessage("what is the current weather in Pakistan")] },
    { configurable: { thread_id: "42" } }
  );
  console.log(sfState.messages.slice(-1)[0].content);

  // Continue conversation
  const nyState = await agent.invoke(
    { messages: [new HumanMessage("what about Sweden")] },
    { configurable: { thread_id: "42" } }
  );
  console.log(nyState.messages.slice(-1)[0].content);
}

main().catch(console.error);
