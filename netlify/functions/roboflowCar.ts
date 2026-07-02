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

    console.log("Incoming body length:", event.body?.length);

    const { imageBase64 } = JSON.parse(event.body || "{}");

    const cleanBase64 = imageBase64?.replace(/^data:image\/\w+;base64,/, "");

    console.log("Has imageBase64:", Boolean(imageBase64));
    console.log("Clean base64 length:", cleanBase64?.length);

    if (!cleanBase64) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "imageBase64 is required" }),
      };
    }

    const response = await fetch(
      "https://serverless.roboflow.com/basketball-znuvc/workflows/car-birds-eye-view-v1-logic",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: process.env.ROBOFLOW_API_KEY,
          use_cache: false,
          inputs: {
            image: { type: "base64", value: cleanBase64 },
          },
        }),
      },
    );

    const text = await response.text();

    console.log("Roboflow status:", response.status);
    console.log("Roboflow raw response:", text);

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!response.ok) {
      console.error("Roboflow request failed:", {
        status: response.status,
        body: data,
      });
    }

    return {
      statusCode: response.status,
      body: JSON.stringify(data),
    };
  } catch (err) {
    console.error("Netlify function crashed:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err instanceof Error ? err.message : "Server error",
      }),
    };
  }
};
