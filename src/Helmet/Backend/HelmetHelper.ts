import type { newDecectionProps } from "../interfaces";

export async function handleNewDetection({
  longitude,
  latitude,
  helmetsArr,
  bikesArr,
  bikerNoHelmetArr,
  setHelmets,
  setBikes,
  setBikerNoHelmet,
}: newDecectionProps) {
  setHelmets(helmetsArr);
  setBikes(bikesArr);
  setBikerNoHelmet(bikerNoHelmetArr);

  const lat = latitude;
  const lng = longitude;

  if (bikesArr.length === 0) return;

  const response = await fetch("/.netlify/functions/updateHelmetLocation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      longitude: lng,
      latitude: lat,
      noHelmet: bikerNoHelmetArr.length,
      total: bikesArr.length,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `Could not save helmet detection (${response.status}): ${message || "Unknown error"}`,
    );
  }
}
