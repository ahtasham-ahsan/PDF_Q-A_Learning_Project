import weaviate from "weaviate-ts-client";
import dotenv from "dotenv";
dotenv.config();

const client = weaviate.client({
  scheme: "https",
  host: process.env.WEAVIATE_URL,
  apiKey: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY),
});

export async function ensurePDFSchemaExists(className) {
  try {
    const schemaRes = await client.schema.getter().do();
    // const exists = schemaRes.classes.find((c) => c.class === className);
    const exists = schemaRes.classes.find((c) => c.class.toLowerCase() === className.toLowerCase());
    if (!exists) {
      console.log("🔍 Creating schema...", className);
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
            {
              name: "pageNumber",
              dataType: ["int"],
            },
          ],
        })
        .do();
      console.log(`✅ Created schema: ${className}`);
    } else {
      console.log(`✅ Schema already exists: ${className}`);
    }
  } catch (err) {
    console.error("❌ Schema setup failed:");
    console.dir(err, { depth: null });
    throw err;
  }
}

export default client;
