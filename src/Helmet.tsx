import { useEffect, useRef, useState } from "react";
import Car from "./assets/Cars.jpg";
import Bikers from "./assets/Bikers.mp4";
import type { RoadData } from "./HelmetHeatmap";

interface ImgSize {
  naturalWidth: number;
  naturalHeight: number;
  renderedWidth: number;
  renderedHeight: number;
}

interface HelmetProps {
  setBikersNoHelmet: React.Dispatch<React.SetStateAction<RoadData[]>>;
  road: string;
}

export default function Helmet({ setBikersNoHelmet, road }: HelmetProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [helmets, setHelmets] = useState<any[]>([]);
  const [bikes, setBikes] = useState<any[]>([]);
  const [bikerNoHelmet, setBikerNoHelmet] = useState<any[]>([]);
  const [error, setError] = useState<any>(null);
  const [imgSize, setImgSize] = useState<ImgSize | null>(null);
  const [paused, setPaused] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [currentFrame, setCurrentFrame] = useState<string>(Car);
  const [refresh, setRefresh] = useState<boolean>(false);
  const pausedRef = useRef(false);

  const captureFrame = () => {
    const video = videoRef.current!;
    const canvas = captureCanvasRef.current!;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
  };

  const handleImageLoad = () => {
    const el = imgRef.current;
    if (!el) return;
    setImgSize({
      naturalWidth: el.naturalWidth,
      naturalHeight: el.naturalHeight,
      renderedWidth: el.clientWidth,
      renderedHeight: el.clientHeight,
    });
  };

  const togglePause = () => {
    const newPaused = !pausedRef.current;
    pausedRef.current = newPaused;
    setPaused(newPaused);
    if (newPaused) {
      videoRef.current?.pause();
    } else {
      videoRef.current?.play();
    }
  };

  const runDetection = async () => {
    if (pausedRef.current) return;

    try {
      const video = videoRef.current;
      if (!video) return;

      setLoading(true);
      const imageBase64 = captureFrame();
      setCurrentFrame(`data:image/jpeg;base64,${imageBase64}`);
      const response = await fetch("/.netlify/functions/roboflowBike", {
        method: "POST",
        body: JSON.stringify({ imageBase64 }),
      });
      const text = await response.text();
      console.log("Function status:", response.status);
      console.log("Function body:", text);
      if (!response.ok) return;
      const result = JSON.parse(text);

      const helmetsArr = result.outputs[0].predictions.predictions.filter(
        (p: any) => p.class === "with-helmet",
      );
      const bikesArr = result.outputs[0].predictions.predictions.filter(
        (p: any) => p.class === "bicycle",
      );
      const noHelmetArr = result.outputs[0].predictions.predictions.filter(
        (p: any) => p.class === "without-helmet",
      );

      const bikerNoHelmetArr = noHelmetArr.filter((nh: any) => {
        const nhTop = nh.y - nh.height / 2;
        const nhBottom = nh.y + nh.height / 2;
        return bikesArr.some((bike: any) => {
          const bikeTop = bike.y - bike.height / 2;
          const bikeBottom = bike.y + bike.height / 2;
          return nhTop < bikeBottom && bikeTop < nhBottom;
        });
      });

      setHelmets(helmetsArr);
      setBikes(bikesArr);
      setBikerNoHelmet(bikerNoHelmetArr);

      // per-road update on the RoadData[] array
      setBikersNoHelmet((prev) => {
        const existing = prev.find((r) => r.road === road);
        if (existing) {
          return prev.map((r) =>
            r.road === road
              ? {
                  ...r,
                  noHelmet: r.noHelmet + bikerNoHelmetArr.length,
                  total: r.total + bikesArr.length,
                }
              : r,
          );
        }
        return [
          ...prev,
          { road, noHelmet: bikerNoHelmetArr.length, total: bikesArr.length },
        ];
      });

      setData(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unknown network error occurred";
      console.error("Fetch failure:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    let stream: MediaStream;
    navigator.mediaDevices.getUserMedia({ video: true }).then((s) => {
      stream = s;
      if (!videoRef.current) return;
      videoRef.current.src = Bikers;

      // Run immediately on the first frame, then every 2000ms after
      videoRef.current.oncanplay = () => {
        runDetection();
        interval = setInterval(runDetection, 2000);
      };
    });
    return () => {
      clearInterval(interval);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (refresh) {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
      }
      setRefresh(false);
    }
  }, [refresh]);

  useEffect(() => {
    const onResize = () => {
      const el = imgRef.current;
      if (!el) return;
      setImgSize((prev) =>
        prev
          ? {
              ...prev,
              renderedWidth: el.clientWidth,
              renderedHeight: el.clientHeight,
            }
          : null,
      );
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const scaleX = imgSize ? imgSize.renderedWidth / imgSize.naturalWidth : 1;
  const scaleY = imgSize ? imgSize.renderedHeight / imgSize.naturalHeight : 1;

  return (
    <div style={{ padding: "20px" }}>
      {loading && <p>Processing segmentation request...</p>}
      {error && (
        <div
          style={{
            color: "red",
            padding: "10px",
            background: "#fdf2f2",
            border: "1px solid red",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        style={{ maxWidth: "100%" }}
      />
      <canvas ref={captureCanvasRef} style={{ display: "none" }} />
      <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
        <button onClick={() => setRefresh(true)}>Rewatch Video</button>
        <button onClick={togglePause}>{paused ? "▶ Resume" : "⏸ Pause"}</button>
      </div>
      {data && (
        <div>
          <h3>Prediction</h3>
          <div style={{ position: "relative", display: "inline-block" }}>
            <img
              ref={imgRef}
              src={currentFrame}
              alt="Car"
              className="mb-0 mt-0 p-0"
              onLoad={handleImageLoad}
            />
            {/* Green boxes: helmets */}
            {imgSize &&
              helmets.map((p: any, i: number) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: (p.x - p.width / 2) * scaleX,
                    top: (p.y - p.height / 2) * scaleY,
                    width: p.width * scaleX,
                    height: p.height * scaleY,
                    border: "2px solid green",
                    pointerEvents: "none",
                  }}
                />
              ))}

            {/* Yellow boxes: bicycles */}
            {imgSize &&
              bikes.map((p: any, i: number) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: (p.x - p.width / 2) * scaleX,
                    top: (p.y - p.height / 2) * scaleY,
                    width: p.width * scaleX,
                    height: p.height * scaleY,
                    border: "2px solid yellow",
                    pointerEvents: "none",
                  }}
                />
              ))}

            {/* Red boxes: without-helmet detections confirmed above a bicycle */}
            {imgSize &&
              bikerNoHelmet.map((p: any, i: number) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: (p.x - p.width / 2) * scaleX,
                    top: (p.y - p.height / 2) * scaleY,
                    width: p.width * scaleX,
                    height: p.height * scaleY,
                    border: "2px solid red",
                    pointerEvents: "none",
                  }}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
