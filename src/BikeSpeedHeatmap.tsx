export type BikesSpeedingData = {
  road: string;
  speeders: number;
  total: number;
};

export default function BikeSpeedHeatmap() {
  return (
    <div className="min-h-screen bg-[#16181C] px-5 py-10 font-sans text-[#EDEDE7] sm:px-8">
      <section className="mx-auto max-w-3xl rounded border border-[#33363D] bg-[#22252B] p-6 sm:p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#FFC93C]">
          Planned feature · Speed analytics
        </p>
        <h1 className="mb-3 mt-3 text-left font-sans text-3xl uppercase tracking-[0.03em] text-[#EDEDE7]">
          Bike speed heatmap
        </h1>
        <p className="text-sm leading-6 text-[#C6C8CE]">
          Planned: show speeding-bike counts alongside total detections by
          road.
        </p>
        <p className="mt-4 font-mono text-[11px] text-[#9A9DA6]">
          Bike-speed location data is not available yet.
        </p>
      </section>
    </div>
  );
}
