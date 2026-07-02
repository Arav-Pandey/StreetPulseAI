import { useEffect, useRef, useState } from "react";
import Home from "./Home";
import BikeSpeedHeatmap from "./BikeSpeedHeatmap";
import FootpathHeatmap from "./FootpathHeatmap";
import HelmetHeatmap from "./Helmet/Frontend/HelmetHeatmap.tsx";
import Logo from "./assets/Street_Pulse_AI_Logo.png";
import LiveBike from "./LiveBike.tsx";
import Helmet from "./Helmet/Backend/Helmet.tsx";
import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import {
  Bike,
  Footprints,
  Gauge,
  HardHat,
  House,
  ScanLine,
} from "lucide-react";

const navigationItems = [
  {
    label: "Home",
    accessibleLabel: "Home",
    mobileLabel: "Home",
    path: "/",
    icon: House,
  },
  {
    label: "Footpaths",
    accessibleLabel: "Footpath Heatmap",
    mobileLabel: "Footpath",
    path: "/footpath-heatmap",
    icon: Footprints,
  },
  {
    label: "Helmets",
    accessibleLabel: "Helmet Heatmap",
    mobileLabel: "Helmets",
    path: "/helmet-heatmap",
    icon: HardHat,
  },
  {
    label: "Bike Speed",
    accessibleLabel: "Bike Speed Heatmap",
    mobileLabel: "Speed",
    path: "/bike-speed-heatmap",
    icon: Gauge,
  },
  {
    label: "Live Bike",
    accessibleLabel: "Live Bike Speed",
    mobileLabel: "Live Bike",
    path: "/live-bike",
    icon: Bike,
  },
  {
    label: "Live Helmet",
    accessibleLabel: "Live Helmet Detection",
    mobileLabel: "Live Helmet",
    path: "/live-helmet",
    icon: ScanLine,
  },
];

export default function App() {
  const location = useLocation();
  const [hiddenAtLocation, setHiddenAtLocation] = useState<string | null>(null);
  const topBarVisible = hiddenAtLocation !== location.key;
  const previousScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDifference = currentScrollY - previousScrollY.current;

      if (currentScrollY <= 8 || scrollDifference < -5) {
        setHiddenAtLocation(null);
      } else if (scrollDifference > 5) {
        setHiddenAtLocation(location.key);
      }

      previousScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.key]);

  useEffect(() => {
    window.scrollTo(0, 0);
    previousScrollY.current = window.scrollY;
  }, [location.key]);

  return (
    <div>
      <header
        onFocusCapture={() => setHiddenAtLocation(null)}
        className={`fixed inset-x-0 top-0 z-[100] border-b border-[#33363D] bg-[#1B1E23]/95 shadow-[0_8px_24px_rgba(0,0,0,0.28)] backdrop-blur-md transition-transform duration-300 ${
          topBarVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="relative mx-auto flex h-16 max-w-[1400px] items-center px-3 sm:px-6">
          <NavLink
            to="/"
            end
            aria-label="StreetPulse AI home"
            className="hidden shrink-0 items-center gap-2 lg:flex"
          >
            <img
              src={Logo}
              alt=""
              className="h-9 w-9 rounded-sm object-contain"
            />
            <span className="hidden whitespace-nowrap font-sans text-sm font-bold tracking-[0.08em] xl:inline">
              STREETPULSE <span className="text-[#FFC93C]">AI</span>
            </span>
          </NavLink>

          <nav
            aria-label="Primary navigation"
            className="absolute left-1/2 flex h-full w-[calc(100%-1.5rem)] -translate-x-1/2 items-stretch justify-start overflow-x-auto sm:w-[calc(100%-3rem)] sm:justify-center"
            style={{ scrollbarWidth: "none" }}
          >
            {navigationItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                aria-label={item.accessibleLabel}
                className={({ isActive }) =>
                  `group relative flex shrink-0 items-center gap-1.5 px-1.5 font-sans text-xs font-semibold uppercase tracking-[0.045em] transition-colors sm:gap-2 sm:px-2 sm:text-[13px] sm:tracking-[0.06em] ${
                    isActive
                      ? "text-[#EDEDE7]"
                      : "text-[#9A9DA6] hover:text-[#EDEDE7]"
                  }`
                }
              >
                {({ isActive }) => (
                  <span className="relative inline-flex items-center gap-1.5 sm:gap-2">
                    <item.icon
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0"
                      strokeWidth={2}
                    />
                    <span className="md:hidden">{item.mobileLabel}</span>
                    <span className="hidden md:inline">{item.label}</span>
                    <span
                      aria-hidden="true"
                      className={`absolute inset-x-0 -bottom-1 h-[2px] origin-left rounded-full shadow-[0_0_8px_rgba(255,201,60,0.65)] transition-all duration-200 ${
                        isActive
                          ? "scale-x-100"
                          : "scale-x-0 group-hover:scale-x-100 group-focus-visible:scale-x-100"
                      } bg-[#FFC93C]`}
                    />
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <div
        className="min-h-screen w-full text-white pb-32 sm:pb-40"
        style={{
          paddingBottom: "calc(14rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <main
          className={`w-full px-4 sm:px-0 ${
            location.pathname === "/" ? "" : "pt-16"
          }`}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/footpath-heatmap" element={<FootpathHeatmap />} />
            <Route path="/helmet-heatmap" element={<HelmetHeatmap />} />
            <Route path="/bike-speed-heatmap" element={<BikeSpeedHeatmap />} />
            <Route path="/live-bike" element={<LiveBike />} />
            <Route path="/live-helmet" element={<Helmet />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
