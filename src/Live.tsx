import { useEffect, useRef, useState } from "react";
import Car from "./assets/Cars.jpg";

// Tracks both the natural (original) and rendered (displayed) image size
interface ImgSize {
  naturalWidth: number;
  naturalHeight: number;
  renderedWidth: number;
  renderedHeight: number;
}

export default function Live() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState<ImgSize | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const prevRef = useRef<{ preds: any[]; time: number } | null>(null);

  const captureFrame = () => {
    const video = videoRef.current!;
    const canvas = captureCanvasRef.current!;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
  };

  // Capture natural vs rendered dimensions once the image has loaded
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

    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      videoRef.current.play();

      interval = setInterval(async () => {
        try {
          // Replace:  const imageBase64 = await toBase64(Car);
          const imageBase64 = captureFrame();

          const response = await fetch("/.netlify/functions/roboflow", {
            /* same as before */
          });
          if (!response.ok) return;
          const result = await response.json();

          // ── Speed calc: add these 10 lines right before setData ──
          const now = Date.now();
          const preds = result.outputs[0].predictions.predictions;
          if (prevRef.current) {
            const dt = (now - prevRef.current.time) / 1000; // seconds
            preds.forEach((p: any) => {
              const closest = prevRef.current!.preds.reduce(
                (best: any, pp: any) =>
                  Math.hypot(p.x - pp.x, p.y - pp.y) <
                  Math.hypot(p.x - best.x, p.y - best.y)
                    ? pp
                    : best,
              );
              p.speed = Math.hypot(p.x - closest.x, p.y - closest.y) / dt;
            });
          }
          prevRef.current = { preds, time: now };
          // ─────────────────────────────────────────────────────────

          setData(result);
        } catch (err) {
          /* same error handling */
        }
      }, 800); // call Roboflow every 800ms
    });

    return () => clearInterval(interval);
  }, []);

  // Recompute scale if the window is resized
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

  // Derive scale factors (fall back to 1 until image has loaded)
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

      <video ref={videoRef} autoPlay muted playsInline />
      <canvas ref={captureCanvasRef} />
      {data && (
        <div>
          <h3>Prediction</h3>

          <div style={{ position: "relative", display: "inline-block" }}>
            <img
              ref={imgRef}
              src={Car}
              alt="Car"
              className="mb-0 mt-0 p-0"
              onLoad={handleImageLoad} // ← fires once browser knows rendered size
            />

            {imgSize &&
              data.outputs[0].predictions.predictions.map(
                (p: any, i: number) => (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      // Apply scale factors to map original coords → rendered coords
                      left: (p.x - p.width / 2) * scaleX,
                      top: (p.y - p.height / 2) * scaleY,
                      width: p.width * scaleX,
                      height: p.height * scaleY,
                      border: "2px solid red",
                      pointerEvents: "none", // boxes shouldn't intercept mouse events
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
                      {p.speed != null ? `${Math.round(p.speed)} px/s` : "–"}
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
