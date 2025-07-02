import { ChatOpenAI } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { RunnableSequence } from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";
import OpenAI from "openai";
import client, { ensurePDFSchemaExists } from "../weaviate/initClient.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function embed(text) {
  const res = await openai.embeddings.create({
    input: text,
    model: "text-embedding-ada-002",
  });
  return res.data[0].embedding;
}

export async function createRAGChain(rawText) {
  const className = "PDFDocs";
  await ensurePDFSchemaExists(className);

  // Check if documents exist
  let count = 0;
  try {
    const stats = await client.graphql
      .aggregate()
      .withClassName(className)
      .withFields("meta { count }")
      .do();
    count = stats.data.Aggregate[className][0]?.meta?.count || 0;
  } catch (err) {
    console.error("❌ Error accessing Weaviate:", err.message);
    return;
  }

  if (count === 0) {
    console.log("📝 No documents found in Weaviate. Uploading...");
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const docs = await splitter.createDocuments([rawText]);
    for (const doc of docs) {
      const vector = await embed(doc.pageContent);
      await client.data
        .creator()
        .withClassName(className)
        .withProperties({ text: doc.pageContent })
        .withVector(vector)
        .do();
    }
    console.log("✅ Documents uploaded to Weaviate.");
  } else {
    console.log("✅ Reusing existing embeddings from Weaviate...");
  }

  // Retriever function using Weaviate legacy API
  async function retrieveRelevantDocs(query) {
    const queryVector = await embed(query);
    const res = await client.graphql
      .get()
      .withClassName(className)
      .withFields("text")
      .withNearVector({ vector: queryVector, certainty: 0.7 })
      .withLimit(4)
      .do();
    return res.data.Get[className]?.map((doc) => doc.text) || [];
  }

  const prompt = PromptTemplate.fromTemplate(
    `You are a helpful assistant. Use the following context to answer the question.

Context:
{context}

Question:
{question}`
  );

  const llm = new ChatOpenAI({
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const chain = RunnableSequence.from([
    {
      context: async (input) => {
        const docs = await retrieveRelevantDocs(input.question);
        return docs.join("\n\n");
      },
      question: (input) => input.question,
    },
    prompt,
    llm,
  ]);

  return chain;
}
