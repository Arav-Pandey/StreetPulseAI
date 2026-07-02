import { useNavigate } from "react-router-dom";
import YellowCyclist from "./assets/Yellow-Cyclist-Icon.png";

const workspaceAccent = "#FFC93C";
const workspaceTint = "rgba(255, 201, 60, 0.11)";

const workspaces = [
  {
    status: "PLANNED FEATURE",
    title: "Footpath heatmap",
    description:
      "Planned: map bike detections on pedestrian footpaths by location.",
    path: "/footpath-heatmap",
    action: "View map",
  },
  {
    status: "SAVED RESULTS",
    title: "Helmet detection map",
    description:
      "Saved detections by location; marker color shows the no-helmet share.",
    path: "/helmet-heatmap",
    action: "View map",
  },
  {
    status: "PLANNED FEATURE",
    title: "Bike speed heatmap",
    description:
      "Planned: show speeding-bike counts and total detections by road.",
    path: "/bike-speed-heatmap",
    action: "View map",
  },
  {
    status: "UPLOAD PLANNED",
    title: "Bike Speed analysis",
    description:
      "Planned: analyze uploaded footage for bike detections and speed estimates; this page currently runs a sample.",
    path: "/live-bike",
    action: "Open sample",
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="relative isolate min-h-screen px-5 pb-10 pt-20 font-sans text-[#EDEDE7] sm:px-8 lg:px-12">
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 bg-[#16181C]"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at 82% 8%, rgba(255, 201, 60, 0.1), transparent 32%), repeating-linear-gradient(0deg, transparent, transparent 47px, rgba(255, 255, 255, 0.018) 48px), repeating-linear-gradient(90deg, transparent, transparent 47px, rgba(255, 255, 255, 0.018) 48px)",
        }}
      />
      <div className="relative z-10 mx-auto max-w-6xl">
        <header className="mb-14 flex items-center justify-between border-b border-[#33363D] pb-5">
          <div className="font-sans text-2xl font-bold uppercase tracking-[0.04em] sm:text-3xl">
            <span className="text-[#EDEDE7]">STREETPULSE</span>{" "}
            <span className="text-[#FFC93C]">AI</span>
          </div>
        </header>

        <section className="mb-12 max-w-3xl">
          <h1 className="mb-5 text-left font-sans text-5xl uppercase leading-[0.98] tracking-[0.015em] text-[#EDEDE7] sm:text-6xl lg:text-7xl">
            See the streets.
            <br />
            <span className="text-[#FFC93C]">Make them safer.</span>
          </h1>
          <p className="max-w-xl text-left text-[15px] leading-7 text-[#9A9DA6] sm:text-base">
            View saved helmet detections, try sample-video demos, or browse
            heatmaps in development.
          </p>
        </section>

        <section aria-labelledby="workspace-heading">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2
                id="workspace-heading"
                className="text-left font-sans text-2xl uppercase tracking-[0.04em] text-[#EDEDE7]"
              >
                Select a workspace
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/live-helmet")}
            className="group mb-3 flex w-full cursor-pointer flex-col justify-between gap-8 rounded border border-[#5B4B20] bg-[#22252B] p-5 text-left transition-colors hover:border-[#FFC93C] hover:bg-[#282A2E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFC93C] sm:flex-row sm:items-center sm:p-7"
          >
            <div className="max-w-xl">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-sm bg-[#FFC93C] px-2 py-1 font-mono text-[10px] font-semibold tracking-[0.1em] text-[#16181C]">
                  LIVE DETECTION
                </span>
              </div>
              <h3 className="mb-2 font-sans text-3xl uppercase tracking-[0.03em] text-[#EDEDE7] sm:text-4xl">
                Helmet detection
              </h3>
              <p className="max-w-lg text-sm leading-6 text-[#9A9DA6]">
                Analyze the sample biker video at a chosen location; detection
                totals are saved to the helmet map.
              </p>
              <span className="mt-6 inline-flex items-center gap-2 font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-[#FFC93C]">
                Run analysis
                <span
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-1"
                >
                  →
                </span>
              </span>
            </div>

            <div
              aria-hidden="true"
              className="hidden h-32 w-32 shrink-0 items-center justify-center rounded-full border border-[#5B4B20] bg-[#16181C] sm:flex"
            >
              <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full">
                <img
                  src={YellowCyclist}
                  alt=""
                  className="h-28 w-28 max-w-none object-contain"
                />
              </div>
            </div>
          </button>

          <div className="grid gap-3 sm:grid-cols-2">
            {workspaces.map((workspace) => (
              <button
                key={workspace.path}
                type="button"
                onClick={() => navigate(workspace.path)}
                className="group flex min-h-40 w-full cursor-pointer flex-col items-start justify-between rounded border border-t-2 border-[#33363D] bg-[#22252B] p-5 text-left transition-colors hover:border-[#666A73] hover:bg-[#282A2E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFC93C]"
                style={{
                  borderTopColor: workspaceAccent,
                  backgroundImage: `linear-gradient(115deg, ${workspaceTint}, transparent 64%)`,
                }}
              >
                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] text-[#9A9DA6]">
                      <span
                        aria-hidden="true"
                        className="h-1.5 w-1.5 rounded-full bg-[#FFC93C]"
                      />
                      {workspace.status}
                    </span>
                  </div>
                  <h3 className="mb-1 font-sans text-xl uppercase tracking-[0.03em] text-[#EDEDE7]">
                    {workspace.title}
                  </h3>
                  <p className="text-[13px] leading-5 text-[#9A9DA6]">
                    {workspace.description}
                  </p>
                </div>
                <span className="mt-5 inline-flex items-center gap-2 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-[#C6C8CE] transition-colors group-hover:text-[#FFC93C]">
                  {workspace.action}
                  <span
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-[#33363D] pt-4 font-mono text-[10px] uppercase tracking-[0.1em] text-[#686C75]">
          <span>STREETPULSE AI · URBAN MOBILITY MONITORING</span>
          <span>BUILT FOR SAFER STREETS</span>
        </footer>
      </div>
    </div>
  );
}
