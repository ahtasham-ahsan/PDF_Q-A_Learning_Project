import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";
import { RetrievalQAChain } from "langchain/chains";
import { WeaviateStore } from "langchain/vectorstores/weaviate";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import client from "../weaviate/initClient.js";

export async function createRAGChain(rawText) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const docs = await splitter.createDocuments([rawText]);

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const vectorStore = await WeaviateStore.fromDocuments(docs, embeddings, {
    client,
    indexName: "PDFDocs",
    textKey: "text",
  });

  const model = new OpenAI({ temperature: 0 });

  const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());
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
