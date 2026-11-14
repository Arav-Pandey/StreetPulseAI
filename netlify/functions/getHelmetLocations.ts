import { MongoClient } from "mongodb";
import type { Handler } from "@netlify/functions";

const uri = process.env.MONGODB_URI as string;
let cachedClient: MongoClient | null = null;

async function getClient() {
  if (cachedClient) return cachedClient;
  if (!uri) {
    throw new Error("MONGODB_URI is not configured for this Netlify site");
  }
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });
  await client.connect();
  cachedClient = client;
  return client;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const client = await getClient();
    const db = client.db("streetpulse");
    const docs = await db
      .collection("helmetLocations")
      .find({})
      .maxTimeMS(3000)
      .toArray();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(docs),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: err instanceof Error ? err.message : "Server error",
    };
  }
};
