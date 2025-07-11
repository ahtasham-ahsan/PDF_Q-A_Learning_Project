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

export async function createRAGChain(rawPages) {
  const className = "PDFDocs";
  await ensurePDFSchemaExists(className);

  // Delete all existing documents in PDFDocs before uploading new ones
  try {
    await client.data.deleter().withClassName(className).do();
    console.log("🗑️ Cleared old documents from Weaviate PDFDocs class.");
  } catch (err) {
    console.error("❌ Error clearing old documents:", err.message);
  }

  // Upload new PDF chunks with page numbers
  console.log("📝 Uploading new PDF...");
  for (const page of rawPages) {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const docs = await splitter.createDocuments([page.pageContent]);
    for (const doc of docs) {
      const vector = await embed(doc.pageContent);
      await client.data
        .creator()
        .withClassName(className)
        .withProperties({ text: doc.pageContent, pageNumber: page.pageNumber })
        .withVector(vector)
        .do();
      console.log(
        `Uploaded chunk (page ${page.pageNumber}):`,
        doc.pageContent.slice(0, 100)
      );
    }
  }
  console.log("✅ Documents uploaded to Weaviate.");

  // Retriever function using Weaviate legacy API
  async function retrieveRelevantDocs(query) {
    const queryVector = await embed(query);
    const res = await client.graphql
      .get()
      .withClassName(className)
      .withFields("text pageNumber")
      .withNearVector({ vector: queryVector, certainty: 0.8 })
      .withLimit(8)
      .do();
    const docs =
      res.data.Get[className]?.map((doc) => ({
        text: doc.text,
        pageNumber: doc.pageNumber,
      })) || [];
    console.log(
      "Retrieved docs for query:",
      query,
      "\n",
      docs.map((d) => `p${d.pageNumber}: ${d.text.slice(0, 100)}`)
    );
    return docs;
  }

  const prompt = PromptTemplate.fromTemplate(
    `You are a helpful assistant. Use the following context to answer the question. Cite the page numbers in your answer using [page X] notation when relevant.\n\nContext:\n{context}\n\nQuestion:\n{question}`
  );

  const llm = new ChatOpenAI({
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const chain = RunnableSequence.from([
    {
      context: async (input) => {
        const docs = await retrieveRelevantDocs(input.question);
        // Format context with citations
        const context = docs
          .map((d) => `Page ${d.pageNumber}:\n${d.text}`)
          .join("\n\n");
        console.log("Context passed to LLM:", context.slice(0, 500)); // Log first 500 chars
        return context;
      },
      question: (input) => input.question,
    },
    prompt,
    llm,
  ]);

  return chain;
}
