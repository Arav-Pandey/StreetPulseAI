import { useEffect, useRef, useState } from "react";
import Car from "./assets/Cars.jpg";
import Cars from "./assets/Cars.mp4";
import type { CarSpeedData } from "./CarSpeedHeatmap";

interface ImgSize {
  naturalWidth: number;
  naturalHeight: number;
  renderedWidth: number;
  renderedHeight: number;
}

interface BikeProps {
  setBikersSpeeding: React.Dispatch<React.SetStateAction<CarSpeedData[]>>;
  road: string;
}

export default function LiveBike({ setBikersSpeeding, road }: BikeProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [imgSize, setImgSize] = useState<ImgSize | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const prevRef = useRef<{ preds: any[]; time: number } | null>(null);
  const [currentFrame, setCurrentFrame] = useState<string>(Car);
  const [refresh, setRefresh] = useState<boolean>(false);

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

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    let stream: MediaStream;

    navigator.mediaDevices.getUserMedia({ video: true }).then((s) => {
      stream = s;
      if (!videoRef.current) return;

      videoRef.current.src = Cars;

      interval = setInterval(async () => {
        try {
          const video = videoRef.current;
          if (!video) return;

          // Advance video by 1 frame (1/30th of a second)
          video.currentTime += 1 / 30;

          // Wait for the video element to complete seeking
          await new Promise((resolve) => {
            video.onseeked = resolve;
          });

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

          // Speed calculations
          const now = Date.now();
          const preds = result.outputs[0].predictions.predictions;

          if (prevRef.current && videoRef.current) {
            const dt = 1 / 30;
            const frameHeight = videoRef.current.videoHeight || 1080;

            preds.forEach((p: any) => {
              const closest = prevRef.current!.preds.reduce(
                (best: any, pp: any) =>
                  Math.hypot(p.x - pp.x, p.y - pp.y) <
                  Math.hypot(p.x - best.x, p.y - best.y)
                    ? pp
                    : best,
              );

              // 1. Calculate how far down the screen the vehicle is (0.0 to 1.0)
              const normalizedY = p.y / frameHeight;

              // 2. Dynamic Scale Factor:
              // Far away (Top of screen, Y near 0): Fewer pixels per foot (e.g., 4)
              // Close up (Bottom of screen, Y near 1): More pixels per foot (e.g., 24)
              // Adjust 4 and 20 below to fine-tune your specific street perspective!
              const pixelsPerFoot = 4 + normalizedY * 20;

              // 3. Compute distances
              const pixelDistance = Math.hypot(
                p.x - closest.x,
                p.y - closest.y,
              );
              const feetDistance = pixelDistance / pixelsPerFoot;
              const calculatedSpeedFps = feetDistance / dt;
              const calculatedMph = calculatedSpeedFps / 1.466667;

              // 4. Threshold Filter Gate:
              // If tracking jumps cleanly (ID mismatch or newborn box), ignore calculation.
              // Also ignores tiny vibrations where a car is actually fully stopped.
              if (
                calculatedMph > 110 ||
                pixelDistance > 80 ||
                pixelDistance < 1.5
              ) {
                // Fallback: Inherit previous frame's speed or hold average if it's an extreme jump
                p.speed = closest.speed || null;
              } else {
                p.speed = calculatedSpeedFps; // Stores raw FPS units matching your bottom UI rendering
              }
            });
          }

          prevRef.current = { preds, time: now };

          setData(result);
          console.log(data);
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
      }, 2000);
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

      <video ref={videoRef} muted playsInline style={{ maxWidth: "100%" }} />
      <canvas ref={captureCanvasRef} style={{ display: "none" }} />
      <button onClick={() => setRefresh(true)}>Rewatch Video</button>

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

            {imgSize &&
              data.outputs[0].predictions.predictions.map(
                (p: any, i: number) => (
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
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        background: "red",
                        color: "white",
                        fontSize: 11,
                        padding: "1px 4px",
                      }}
                    >
                      {p.speed != null
                        ? `${Math.round(p.speed / 1.466667)} MPH`
                        : "–"}
                    </span>
                  </div>
                ),
              )}
          </div>
        </div>
      )}
    </div>
  );
}
