import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { WeaviateStore } from "@langchain/community/vectorstores/weaviate";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { RunnableSequence } from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";

import client, { ensurePDFSchemaExists } from "../weaviate/initClient.js";

export async function createRAGChain(rawText) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const docs = await splitter.createDocuments([rawText]);

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  await ensurePDFSchemaExists("PDFDocs");

  const vectorStore = await WeaviateStore.fromDocuments(docs, embeddings, {
    client,
    indexName: "PDFDocs",
    textKey: "text",
  });

  const retriever = vectorStore.asRetriever();

  const llm = new ChatOpenAI({
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const prompt = PromptTemplate.fromTemplate(
    `You are a helpful assistant. Use the following context to answer the question.

Context:
{context}

Question:
{question}`
  );

  const chain = RunnableSequence.from([
    {
      context: async (input) => {
        const docs = await retriever.getRelevantDocuments(input.question);
        return docs.map((doc) => doc.pageContent).join("\n\n");
      },
      question: (input) => input.question,
    },
    prompt,
    llm,
  ]);

  return chain;
}

// import { OpenAIEmbeddings } from "langchain/openai";
// import { OpenAI } from "langchain/llms/openai";
// import { RetrievalQAChain } from "langchain/chains";
// import { WeaviateStore } from "langchain/vectorstores/weaviate";
// import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
// import client from "../weaviate/initClient.js";
// import { VectorStores } from "openai/resources/index.mjs";

// export async function createRAGChain(rawText) {
//   const splitter = new RecursiveCharacterTextSplitter({
//     chunkSize: 1000,
//     chunkOverlap: 200,
//   });

//   const docs = await splitter.createDocuments([rawText]);

//   const embeddings = new OpenAIEmbeddings({
//     openAIApiKey: process.env.OPENAI_API_KEY,
//   });

//   const model = new OpenAI({
//     temperature: 0,
//   });

//   const chain = RetrievalQAChain.fromLLM(model, VectorStores.asRetriever());
//   return chain;
// }
