import { useEffect, useState } from "react";
import type { LocationSettingProps } from "../interfaces";
import { lookupRoadName } from "../Backend/reverseGeocode";

function RecentLocations({
  locations,
  onSelect,
  open,
}: {
  locations: LocationSettingProps["recentLocations"];
  onSelect: LocationSettingProps["onSelectRecentLocation"];
  open: boolean;
}) {
  if (!open || locations.length === 0) return null;

  return (
    <div className="absolute z-10 mt-1 w-full overflow-hidden rounded border border-[#33363D] bg-[#22252B] shadow-lg">
      <div className="px-3 py-2 font-['JetBrains_Mono'] text-[10px] uppercase tracking-widest text-[#9A9DA6]">
        Recent locations
      </div>
      {locations.map((location) => (
        <button
          key={`${location.latitude},${location.longitude}`}
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onSelect(location)}
          className="block w-full cursor-pointer px-3 py-2 text-left hover:bg-[#33363D]"
        >
          <span className="block font-['JetBrains_Mono'] text-[13px] text-[#EDEDE7]">
            {location.roadName === undefined
              ? "Looking up road name…"
              : location.roadName || "Road name unavailable"}
          </span>
          <span className="block font-['JetBrains_Mono'] text-[11px] text-[#9A9DA6]">
            {location.latitude}, {location.longitude}
          </span>
        </button>
      ))}
      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noreferrer"
        className="block border-t border-[#33363D] px-3 py-2 text-[10px] text-[#9A9DA6] underline"
      >
        Road names © OpenStreetMap contributors
      </a>
    </div>
  );
}

export default function LocationSetting({
  latitude,
  longitude,
  setLatitude,
  setLongitude,
  recentLocations,
  onSelectRecentLocation,
  onRoadNameLookupResult,
  onConfirmLocation,
}: LocationSettingProps) {
  const [focusedField, setFocusedField] = useState<
    "latitude" | "longitude" | null
  >(null);

  useEffect(() => {
    if (!focusedField) return;

    recentLocations
      .filter((location) => location.roadName === undefined)
      .forEach((location) => {
        void lookupRoadName(location.latitude, location.longitude)
          .then((roadName) => onRoadNameLookupResult(location, roadName))
          .catch((err: unknown) => {
            console.error("Could not look up recent location road name:", err);
            onRoadNameLookupResult(location, null);
          });
      });
  }, [focusedField, recentLocations, onRoadNameLookupResult]);

  const confirmLocation = () => {
    onConfirmLocation(Number.parseFloat(latitude), Number.parseFloat(longitude));
  };
  const selectRecentLocation = (location: (typeof recentLocations)[number]) => {
    onSelectRecentLocation(location);
    setFocusedField(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#16181C] font-sans">
      <div className="w-full max-w-md rounded-lg border border-[#33363D] bg-[#22252B] p-8">
        <div className="mb-1 font-['JetBrains_Mono'] text-[12px] tracking-[0.15em] text-[#FFC93C]">
          SETUP — 01 / 01
        </div>

        <h2 className="mb-2 font-['Oswald'] text-[26px] uppercase tracking-[0.03em] text-[#EDEDE7]">
          Camera Location
        </h2>

        <p className="mb-6 text-[14px] text-[#9A9DA6]">
          Enter the exact coordinates of this camera before starting detection.
        </p>

        <div className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-1.5 block text-[11px] uppercase tracking-widest text-[#9A9DA6]">
              Latitude
            </span>

            <div
              className="relative"
              onBlur={(event) => {
                if (
                  !(event.relatedTarget instanceof Node) ||
                  !event.currentTarget.contains(event.relatedTarget)
                ) {
                  setFocusedField(null);
                }
              }}
            >
              <input
                type="number"
                step="any"
                min={-90}
                max={90}
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                onFocus={() => setFocusedField("latitude")}
                placeholder="e.g. 32.9371"
                className="w-full rounded border border-[#33363D] bg-[#16181C] p-2 font-['JetBrains_Mono'] text-[14px] text-[#EDEDE7] outline-none"
              />
              <RecentLocations
                locations={recentLocations}
                onSelect={selectRecentLocation}
                open={focusedField === "latitude"}
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[11px] uppercase tracking-widest text-[#9A9DA6]">
              Longitude
            </span>

            <div
              className="relative"
              onBlur={(event) => {
                if (
                  !(event.relatedTarget instanceof Node) ||
                  !event.currentTarget.contains(event.relatedTarget)
                ) {
                  setFocusedField(null);
                }
              }}
            >
              <input
                type="number"
                step="any"
                min={-180}
                max={180}
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                onFocus={() => setFocusedField("longitude")}
                placeholder="e.g. -117.2458"
                className="w-full rounded border border-[#33363D] bg-[#16181C] p-2 font-['JetBrains_Mono'] text-[14px] text-[#EDEDE7] outline-none"
              />
              <RecentLocations
                locations={recentLocations}
                onSelect={selectRecentLocation}
                open={focusedField === "longitude"}
              />
            </div>
          </label>

          <button
            onClick={confirmLocation}
            className="mt-2 cursor-pointer rounded bg-[#FFC93C] p-3 font-['Oswald'] font-semibold uppercase tracking-wider text-[#16181C]"
          >
            Start Detection
          </button>
        </div>
      </div>
    </div>
  );
}
