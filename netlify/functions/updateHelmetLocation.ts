import { MongoClient } from "mongodb";
import type { Handler } from "@netlify/functions";

const uri = process.env.MONGODB_URI as string;

// Cache the client across warm invocations (serverless best practice)
let cachedClient: MongoClient | null = null;

async function getClient() {
  if (cachedClient) return cachedClient;
  if (!uri) {
    throw new Error("MONGODB_URI is not configured for this Netlify site");
  }
  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  return client;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { longitude, latitude, noHelmet, total } = JSON.parse(
      event.body || "{}",
    );

    if (
      typeof longitude !== "number" ||
      typeof latitude !== "number" ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(latitude) ||
      longitude < -180 ||
      longitude > 180 ||
      latitude < -90 ||
      latitude > 90
    ) {
      return {
        statusCode: 400,
        body: "longitude/latitude required as numbers",
      };
    }

    if (
      typeof noHelmet !== "number" ||
      typeof total !== "number" ||
      !Number.isSafeInteger(noHelmet) ||
      !Number.isSafeInteger(total) ||
      noHelmet < 0 ||
      total <= 0 ||
      noHelmet > total
    ) {
      return {
        statusCode: 400,
        body: "noHelmet must be a non-negative integer no greater than total; total must be a positive integer",
      };
    }

    const client = await getClient();
    const db = client.db("streetpulse");
    const collection = db.collection("helmetLocations");

    // Round coordinates so nearby detections bucket into the same point
    // instead of creating a near-infinite number of unique points.
    const roundedLng = Math.round(longitude * 10000) / 10000; // ~11m precision
    const roundedLat = Math.round(latitude * 10000) / 10000;

    const result = await collection.findOneAndUpdate(
      {
        "location.coordinates": [roundedLng, roundedLat],
      },
      {
        $inc: {
          total: total,
          noHelmet: noHelmet,
        },
        $set: { lastUpdated: new Date() },
        $setOnInsert: {
          location: { type: "Point", coordinates: [roundedLng, roundedLat] },
        },
      },
      { upsert: true, returnDocument: "after" },
    );

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: err instanceof Error ? err.message : "Server error",
    };
  }
};
