interface Props {
  setActive: React.Dispatch<React.SetStateAction<string>>;
}

export default function Home({ setActive }: Props) {
  return (
    <div>
      <h1>StreetPulse AI</h1>

      {/* Added mx-auto to center the 1/3 layout on the page, and items-center to center internal items */}
      <div className="flex flex-col gap-4 w-1/3 mx-auto items-center justify-center">
        <div className="bg-blue-200 p-2 w-full text-center text-gray-600">
          <button
            className="text-xl"
            onClick={() => setActive("FootpathHeatmap")}
          >
            Bikers On Footpath Heatmap
          </button>
        </div>
        <div className="bg-blue-300 p-2 w-full text-center text-gray-600">
          <button
            className="text-xl"
            onClick={() => setActive("HelmetHeatmap")}
          >
            Bikers Without Helmets Heatmap
          </button>
        </div>
        <div className="bg-blue-400 p-2 w-full text-center text-gray-600">
          <button
            className="text-xl"
            onClick={() => setActive("BikeSpeedHeatmap")}
          >
            Bike Speed Heatmap
          </button>
        </div>
        <div className="bg-blue-500 p-2 w-full text-center text-gray-600">
          <button
            className="text-xl"
            onClick={() => setActive("CarSpeedHeatmap")}
          >
            Car Over Speed Limit Heatmap
          </button>
        </div>
        <div className="bg-blue-600 p-2 w-full text-center text-black">
          <button className="text-xl" onClick={() => setActive("LiveCar")}>
            Live Car Speed
          </button>
        </div>
        <div className="bg-blue-600 p-2 w-full text-center text-black">
          <button className="text-xl" onClick={() => setActive("LiveBike")}>
            Live Bike Speed
          </button>
        </div>
        <div className="bg-blue-600 p-2 w-full text-center text-black">
          <button className="text-xl" onClick={() => setActive("LiveHelmet")}>
            Live Biker Helmet Detection
          </button>
        </div>
        <div className="bg-blue-600 p-2 w-full text-center text-black">
          <button className="text-xl" onClick={() => setActive("Image")}>
            Image Upload Analysis (PRODUCTION USE ONLY)
          </button>
        </div>
      </div>
    </div>
  );
}
