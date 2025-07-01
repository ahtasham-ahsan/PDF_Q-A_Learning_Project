import weaviate from "weaviate-ts-client";
import dotenv from "dotenv";
dotenv.config();

const client = weaviate.client({
  scheme: "http",
  host: process.env.WEAVIATE_URL.replace("http://", ""),
});

export async function ensurePDFSchemaExists(indexName = "PDFDocs") {
  try {
    const classes = await client.schema.getter().do();
    const exists = classes.classes.find((cls) => cls.class === indexName);
    if (!exists) {
      await client.schema
        .classCreator()
        .withClass({
          class: indexName,
          vectorizer: "none",
          properties: [
            {
              name: "text",
              dataType: ["text"],
            },
          ],
        })
        .do();
      console.log(`✅ Created schema for ${indexName}`);
    } else {
      console.log(`✅ Schema ${indexName} already exists`);
    }
  } catch (err) {
    console.error("Failed to ensure schema:", err.message);
  }
}

export default client;

// import weaviate from "weaviate-ts-client";
// import dotenv from "dotenv";
// dotenv.config();

// const client = weaviate.client({
//   scheme: "http",
//   host: process.env.WEAVIATE_URL.replace("http://", ""),
// });

// export default client;
