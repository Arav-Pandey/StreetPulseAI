import { useState } from "react";
import type { DisplayProps } from "../interfaces";
import LocationSetting from "./LocationSetting";

export default function Display({
  loading,
  error,
  videoRef,
  captureCanvasRef,
  data,
  analyzing,
  setRefresh,
  togglePause,
  paused,
  helmets,
  bikes,
  bikerNoHelmet,
  detectionTotals,
  latitude,
  longitude,
  setLatitude,
  setLongitude,
  locationSet,
  recentLocations,
  onSelectRecentLocation,
  onRoadNameLookupResult,
  onConfirmLocation,
}: DisplayProps) {
  const [videoSize, setVideoSize] = useState<{ width: number; height: number } | null>(
    null,
  );
  const locationName = recentLocations.find(
    (location) =>
      location.latitude === Number(latitude) &&
      location.longitude === Number(longitude),
  )?.roadName;
  const locationNameLabel =
    locationName === undefined
      ? "Looking up location…"
      : locationName || "Location name unavailable";

  if (!locationSet) {
    return (
      <LocationSetting
        latitude={latitude}
        longitude={longitude}
        setLatitude={setLatitude}
        setLongitude={setLongitude}
        recentLocations={recentLocations}
        onSelectRecentLocation={onSelectRecentLocation}
        onRoadNameLookupResult={onRoadNameLookupResult}
        onConfirmLocation={onConfirmLocation}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#16181C] p-6 font-sans">
      <div className="mx-auto max-w-3xl">
        {/* Status Bar */}
        <div className="mb-4 flex items-center justify-between rounded border border-[#33363D] bg-[#22252B] px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`${paused ? "" : "animate-[pulse_1.5s_ease-in-out_infinite]"} inline-block h-2 w-2 rounded-full ${
                paused ? "bg-[#5A5D66]" : "bg-[#E5484D]"
              }`}
            />

            <span className="font-['JetBrains_Mono'] text-[12px] tracking-[0.08em] text-[#9A9DA6]">
              {paused ? "PAUSED" : analyzing ? "ANALYZING" : "LIVE"} ·{" "}
              {Number(latitude).toFixed(4)},{" "}
              {Number(longitude).toFixed(4)} · {locationNameLabel}
            </span>
          </div>

          {(loading || analyzing) && (
            <span className="font-['JetBrains_Mono'] text-[12px] text-[#FFC93C]">
              ANALYZING FRAME…
            </span>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded border border-[#E5484D] bg-[#2A1A1C] px-4 py-3 text-[14px] text-[#E5484D]">
            <strong>Error:</strong> {error}
          </div>
        )}

        <h1 className="mb-2.5 font-['Oswald'] text-[22px] uppercase tracking-[0.03em] text-[#EDEDE7]">
          Camera Feed
        </h1>

        {/* Video Housing */}
        <div className="mx-auto max-w-2xl rounded-lg border-2 border-[#33363D] bg-black p-3">
          <div className="relative w-full">
            <video
              key="camera-stream-video"
              ref={videoRef}
              muted
              playsInline
              autoPlay
              onLoadedMetadata={(event) =>
                setVideoSize({
                  width: event.currentTarget.videoWidth,
                  height: event.currentTarget.videoHeight,
                })
              }
              className="block w-full rounded"
            />
            {data && videoSize && videoSize.width > 0 && videoSize.height > 0 && (
              <div className="pointer-events-none absolute inset-0">
                {[
                  { items: helmets, color: "#3BB273", label: "Helmet" },
                  { items: bikes, color: "#FFC93C", label: "Bike" },
                  {
                    items: bikerNoHelmet,
                    color: "#E5484D",
                    label: "No Helmet",
                  },
                ].flatMap(({ items, color, label }) =>
                  items.map((prediction, index: number) => (
                    <div
                      key={`${label}-${index}`}
                      className="absolute border-2"
                      style={{
                        left: `${((prediction.x - prediction.width / 2) / videoSize.width) * 100}%`,
                        top: `${((prediction.y - prediction.height / 2) / videoSize.height) * 100}%`,
                        width: `${(prediction.width / videoSize.width) * 100}%`,
                        height: `${(prediction.height / videoSize.height) * 100}%`,
                        borderColor: color,
                      }}
                    >
                      <span
                        className="absolute -top-5 left-[-2px] whitespace-nowrap px-1 py-0.5 font-['JetBrains_Mono'] text-[10px] text-[#16181C]"
                        style={{ backgroundColor: color }}
                      >
                        {label}
                      </span>
                    </div>
                  )),
                )}
              </div>
            )}
          </div>
        </div>

        <canvas ref={captureCanvasRef} className="hidden" />

        {/* Controls */}
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => setRefresh(true)}
            className="cursor-pointer rounded border border-[#33363D] bg-transparent px-5 py-2 font-['Oswald'] text-[13px] uppercase tracking-wider text-[#EDEDE7]"
          >
            Rewatch Video
          </button>

          <button
            onClick={togglePause}
            className="cursor-pointer rounded bg-[#FFC93C] px-5 py-2 font-['Oswald'] text-[13px] font-semibold uppercase tracking-wider text-[#16181C]"
          >
            {paused ? "▶ Resume" : "⏸ Pause"}
          </button>
        </div>

        {data && (
          <div className="mt-10">
            {/* Data Collected */}
            <div className="mt-6">
              <h1 className="mb-3 font-['Oswald'] text-[22px] uppercase tracking-[0.03em] text-[#EDEDE7]">
                Data Collected
              </h1>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded border border-[#33363D] bg-[#22252B] px-4 py-3">
                  <div className="font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.08em] text-[#9A9DA6]">
                    Bikes
                  </div>
                  <div className="mt-1 font-['Oswald'] text-[24px] text-[#EDEDE7]">
                    {detectionTotals.bikes}
                  </div>
                </div>

                <div className="rounded border border-[#33363D] bg-[#22252B] px-4 py-3">
                  <div className="font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.08em] text-[#9A9DA6]">
                    Helmets
                  </div>
                  <div className="mt-1 font-['Oswald'] text-[24px] text-[#3BB273]">
                    {detectionTotals.helmets}
                  </div>
                </div>

                <div className="rounded border border-[#33363D] bg-[#22252B] px-4 py-3">
                  <div className="font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.08em] text-[#9A9DA6]">
                    No Helmet
                  </div>
                  <div className="mt-1 font-['Oswald'] text-[24px] text-[#E5484D]">
                    {detectionTotals.noHelmet}
                  </div>
                </div>

                <div className="rounded border border-[#33363D] bg-[#22252B] px-4 py-3">
                  <div className="font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.08em] text-[#9A9DA6]">
                    No-Helmet Rate
                  </div>
                  <div className="mt-1 font-['Oswald'] text-[24px] text-[#FFC93C]">
                    {detectionTotals.bikes > 0
                      ? `${Math.round((detectionTotals.noHelmet / detectionTotals.bikes) * 100)}%`
                      : "\u2014"}
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded border border-[#33363D] bg-[#22252B] px-4 py-3 font-['JetBrains_Mono'] text-[12px] text-[#9A9DA6]">
                <div>
                  Logged at {Number(latitude).toFixed(4)},{" "}
                  {Number(longitude).toFixed(4)} · {locationNameLabel}
                </div>
                <a
                  href="https://www.openstreetmap.org/copyright"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-[10px] underline"
                >
                  Road names © OpenStreetMap contributors
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  );
}
