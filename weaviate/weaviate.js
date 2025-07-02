import weaviate from "weaviate-ts-client";
import OpenAI from "openai";
import * as dotenv from "dotenv";
dotenv.config();

const client = weaviate.client({
  scheme: "https",
  host: process.env.WEAVIATE_URL.replace(/^https?:\/\//, ""),
  headers: {
    "X-OpenAI-Api-Key": process.env.OPENAI_API_KEY,
    "Authorization": `Bearer ${process.env.WEAVIATE_API_KEY}`,
  },
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function embed(text) {
  const res = await openai.embeddings.create({
    input: text,
    model: "text-embedding-ada-002",
  });
  return res.data[0].embedding;
}

async function setupSchema() {
  try {
    await client.schema.classDeleter().withClassName("Document").do();
  } catch (e) {
    // ignore if doesn't exist
  }

  await client.schema
    .classCreator()
    .withClass({
      class: "Document",
      vectorizer: "none", // because we embed manually
      properties: [
        {
          name: "text",
          dataType: ["text"],
        },
      ],
    })
    .do();
}

async function insertDocuments() {
  const texts = [
    "Weaviate is a vector database for semantic search.",
    "OpenAI provides powerful language models like GPT-4.",
    "JavaScript is widely used for web development.",
  ];

  for (const text of texts) {
    const vector = await embed(text);
    await client.data
      .creator()
      .withClassName("Document")
      .withProperties({ text })
      .withVector(vector)
      .do();
  }
}

async function semanticSearch(query) {
  const queryVector = await embed(query);
  const res = await client.graphql
    .get()
    .withClassName("Document")
    .withFields("text")
    .withNearVector({ vector: queryVector, certainty: 0.7 })
    .withLimit(2)
    .do();

  console.log("\n🔍 Semantic Search Results:");
  res.data.Get.Document.forEach((doc, i) => {
    console.log(`${i + 1}. ${doc.text}`);
  });
}

async function main() {
  await setupSchema();
  await insertDocuments();
  await semanticSearch("Tell me about OpenAI.");
}

main();
