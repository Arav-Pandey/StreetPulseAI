import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Polyline, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export type CarSpeedData = {
  road: string;
  speeding: number;
  total: number;
};

interface Props {
  carsSpeeding: CarSpeedData[];
}

function getColor(noHelmet: number): string {
  if (noHelmet >= 50) return "#7f0000"; // deep red
  if (noHelmet >= 25) return "#d32f2f"; // red
  if (noHelmet >= 10) return "#ff8a65"; // light/orange-red
  return "#4caf50"; // green - low/no concern
}

// Fetches road geometry from OpenStreetMap's Overpass API (free, no key)
async function fetchRoadCoordinates(
  roadName: string,
): Promise<[number, number][]> {
  const query = `
    [out:json][timeout:25];
    area["name"="San Diego"]["admin_level"="8"]->.searchArea;
    way["name"="${roadName}"](area.searchArea);
    out geom;
  `;

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: query,
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status}`);
  }

  const data = await response.json();

  // A road can be split into multiple "ways" (segments) in OSM.
  // We merge all segments' geometry into one array of points.
  const coords: [number, number][] = [];
  for (const way of data.elements) {
    if (way.geometry) {
      for (const pt of way.geometry) {
        coords.push([pt.lat, pt.lon]);
      }
    }
  }
  return coords;
}

export default function HelmetHeatmap({ carsSpeeding }: Props) {
  const [roadCoords, setRoadCoords] = useState<
    Record<string, [number, number][]>
  >({});
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadAllRoads() {
      setLoading(true);
      const results: Record<string, [number, number][]> = {};
      const failedRoads: string[] = [];

      // Sequential, not Promise.all — Overpass rate-limits aggressive parallel requests
      for (const { road } of carsSpeeding) {
        try {
          const coords = await fetchRoadCoordinates(road);
          if (coords.length === 0) {
            failedRoads.push(road);
          } else {
            results[road] = coords;
          }
        } catch (err) {
          failedRoads.push(road);
        }
      }

      if (!cancelled) {
        setRoadCoords(results);
        setErrors(failedRoads);
        setLoading(false);
      }
    }

    loadAllRoads();
    return () => {
      cancelled = true;
    };
  }, [carsSpeeding]);

  return (
    <div className="mt-10">
      <h1>Heatmap of San Diego Cars Speeding</h1>

      {loading && <p>Loading road data...</p>}
      {errors.length > 0 && (
        <p style={{ color: "orange" }}>
          Could not find geometry for: {errors.join(", ")}
        </p>
      )}

      <div className="mt-40 z-1">
        <MapContainer
          center={[32.7157, -117.1611]}
          zoom={12}
          style={{ height: "500px", width: "100%" }}
        >
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            maxZoom={19}
          />

          {carsSpeeding.map(({ road, speeding, total }) => {
            const coords = roadCoords[road];
            if (!coords) return null;

            return (
              <Polyline
                key={road}
                positions={coords}
                pathOptions={{ color: getColor(speeding / total), weight: 6 }}
              >
                <Tooltip sticky>
                  {road}: {speeding} no-helmet detections ({total} total)
                </Tooltip>
              </Polyline>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
