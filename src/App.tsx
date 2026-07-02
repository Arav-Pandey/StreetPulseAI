import { useState } from "react";
import Home from "./Home";
import BikeSpeedHeatmap from "./BikeSpeedHeatmap";
import CarSpeedHeatmap, { type CarSpeedData } from "./CarSpeedHeatmap";
import FootpathHeatmap from "./FootpathHeatmap";
import HelmetHeatmap, { type RoadData } from "./HelmetHeatmap";
import Logo from "./assets/Street_Pulse_AI_Logo.png";
import HoverSettings from "./HoverSettings";
import LiveCar from "./Car Speeding/LiveCar.tsx";
import Image from "./Image.tsx";
import LiveBike from "./LiveBike.tsx";
import Helmet from "./Helmet.tsx";
export default function App() {
  const [active, setActive] = useState("Home");
  const [bikersNoHelmet, setBikersNoHelmet] = useState<RoadData[]>([
    { road: "Carmel Valley Road", noHelmet: 60, total: 80 },
  ]);
  const [carsSpeeding, setCarsSpeeding] = useState<CarSpeedData[]>([
    { road: "Carmel Valley Road", speeding: 60, total: 80 },
  ]);
  const [bikersSpeeding, setBikersSpeeding] = useState<CarSpeedData[]>([
    { road: "Carmel Valley Road", speeding: 60, total: 80 },
  ]);

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
            <CarSpeedHeatmap carsSpeeding={carsSpeeding} />
          ) : active === "FootpathHeatmap" ? (
            <FootpathHeatmap />
          ) : active === "HelmetHeatmap" ? (
            <HelmetHeatmap bikersNoHelmet={bikersNoHelmet} />
          ) : active === "LiveCar" ? (
            <LiveCar
              setCarsSpeeding={setCarsSpeeding}
              road="Carmel Valley Road"
            />
          ) : active === "Image" ? (
            <Image />
          ) : active === "LiveBike" ? (
            <LiveBike
              setBikersSpeeding={setBikersSpeeding}
              road="Carmel Valley Road"
            />
          ) : active === "LiveHelmet" ? (
            <Helmet
              setBikersNoHelmet={setBikersNoHelmet}
              road="Carmel Valley Road"
            />
          ) : null}
        </main>
      </div>

      <div className="fixed top-2 left-2 z-50">
        <HoverSettings name="Home">
          <div onClick={() => setActive("Home")} className="cursor-pointer">
            <img src={Logo} alt="Home Button" className="w-18 h-15" />
          </div>
        </HoverSettings>
      </div>
    </div>
  );
}
