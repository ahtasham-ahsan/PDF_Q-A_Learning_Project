import weaviate from "weaviate-ts-client";
import dotenv from "dotenv";
dotenv.config();

const client = weaviate.client({
  scheme: "https",
  host: process.env.WEAVIATE_URL.replace(/^https?:\/\//, ""),
  headers: {
    "X-OpenAI-Api-Key": process.env.OPENAI_API_KEY,
    Authorization: `Bearer ${process.env.WEAVIATE_API_KEY}`,
  },
});

export async function ensurePDFSchemaExists(className) {
  try {
    const schemaRes = await client.schema.getter().do();
    const exists = schemaRes.classes.find((c) => c.class === className);

    if (!exists) {
      await client.schema
        .classCreator()
        .withClass({
          class: className,
          vectorizer: "none",
          properties: [
            {
              name: "text",
              dataType: ["text"],
            },
          ],
        })
        .do();
      console.log(`✅ Created schema: ${className}`);
    } else {
      console.log(`✅ Schema already exists: ${className}`);
    }
  } catch (err) {
    console.error("❌ Schema setup failed:", err.message);
  }
}

export default client;
