import type { Handler } from "@netlify/functions";

if (!process.env.ROBOFLOW_API_KEY) {
  throw new Error("ROBOFLOW_API_KEY Missing");
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    const { imageBase64 } = JSON.parse(event.body || "{}");

    const apiKey = process.env.ROBOFLOW_API_KEY;

    const response = await fetch(
      "https://serverless.roboflow.com/infer/workflows/basketball-znuvc/car-v1-logic",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: apiKey,
          use_cache: false,
          inputs: {
            image: { type: "base64", value: imageBase64 },
          },
        }),
      },
    );

    const data = await response.json();

    return {
      statusCode: response.status,
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err instanceof Error ? err.message : "Server error",
      }),
    };
  }
};
