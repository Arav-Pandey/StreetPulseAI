import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { HelmetData } from "../types";

function getColor(ratio: number): string {
  if (ratio >= 0.5) return "#7f0000"; // deep red
  if (ratio >= 0.25) return "#d32f2f"; // red
  if (ratio >= 0.1) return "#ff8a65"; // light/orange-red
  return "#4caf50"; // green
}

type StoredHelmetLocation = {
  location: { type: "Point"; coordinates: [number, number] };
  noHelmet: number;
  total: number;
};

export default function HelmetHeatmap() {
  const [locations, setLocations] = useState<HelmetData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadLocations() {
      try {
        const response = await fetch("/.netlify/functions/getHelmetLocations", {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(await response.text());
        }

        const records: StoredHelmetLocation[] = await response.json();
        setLocations(
          records
            .filter(
              (record) =>
                record.location?.type === "Point" &&
                Array.isArray(record.location.coordinates) &&
                Number.isFinite(record.location.coordinates[0]) &&
                Number.isFinite(record.location.coordinates[1]),
            )
            .map((record) => ({
              longitude: record.location.coordinates[0],
              latitude: record.location.coordinates[1],
              noHelmet: record.noHelmet,
              total: record.total,
            })),
        );
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(
          err instanceof Error ? err.message : "Unable to load heatmap data",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadLocations();
    return () => controller.abort();
  }, []);

  return (
    <div className="mt-10">
      <h1>Heatmap of San Diego Bikers Wearing Helmets</h1>
      <div className="mt-40 z-1">
        <MapContainer
          center={[32.7157, -117.1611]}
          zoom={4}
          style={{ height: "500px", width: "100%" }}
        >
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
            maxZoom={19}
          />
          {locations.map(({ latitude, longitude, noHelmet, total }, i) => {
            const ratio = total > 0 ? noHelmet / total : 0;
            return (
              <CircleMarker
                key={`${latitude}-${longitude}-${i}`}
                center={[latitude, longitude]}
                radius={12}
                pathOptions={{
                  color: getColor(ratio),
                  fillColor: getColor(ratio),
                  fillOpacity: 0.8,
                }}
              >
                <Tooltip sticky>
                  {noHelmet} no-helmet detections ({total} total) at (
                  {latitude.toFixed(5)}, {longitude.toFixed(5)})
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>
        {isLoading && <p>Loading saved helmet detections…</p>}
        {error && <p role="alert">Unable to load saved detections: {error}</p>}
      </div>
    </div>
  );
}
