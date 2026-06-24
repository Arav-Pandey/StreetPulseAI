import { useState } from "react";
import Home from "./Home";
import BikeSpeedHeatmap from "./BikeSpeedHeatmap";
import CarSpeedHeatmap from "./CarSpeedHeatmap";
import FootpathHeatmap from "./FootpathHeatmap";
import HelmetHeatmap from "./HelmetHeatmap";
import Logo from "./assets/Street_Pulse_AI_Logo.png";
import HoverSettings from "./HoverSettings";
import Live from "./Live";
import Image from "./Image.tsx";

export default function App() {
  const [active, setActive] = useState("Home");

  return (
    <div>
      <div
        className="min-h-screen w-full text-white pb-32 sm:pb-40"
        style={{
          paddingBottom: "calc(14rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <main className="w-full px-4 sm:px-0">
          {active === "BikeSpeedHeatmap" ? (
            <BikeSpeedHeatmap />
          ) : active === "Home" ? (
            <Home setActive={setActive} />
          ) : active === "CarSpeedHeatmap" ? (
            <CarSpeedHeatmap />
          ) : active === "FootpathHeatmap" ? (
            <FootpathHeatmap />
          ) : active === "HelmetHeatmap" ? (
            <HelmetHeatmap />
          ) : active === "Live" ? (
            <Live />
          ) : active === "Image" ? (
            <Image />
          ) : null}
        </main>
      </div>

      {/* 1. Put the positioning classes HERE on an outer wrapper */}
      <div className="fixed top-2 left-2 z-50">
        <HoverSettings name="Home">
          {/* 2. REMOVE absolute, top, left, and z-50 from this inner div */}
          <div onClick={() => setActive("Home")} className="cursor-pointer">
            <img src={Logo} alt="Home Button" className="w-18 h-15" />
          </div>
        </HoverSettings>
      </div>
    </div>
  );
}
