import weaviate from "weaviate-ts-client";
import dotenv from "dotenv";
dotenv.config();

const client = weaviate.client({
  scheme: "http",
  host: process.env.WEAVIATE_URL.replace("http://", ""),
});

export default client;
