import { useEffect, useRef, useState } from "react";
import Car from "./assets/Cars.jpg";

// Tracks both the natural (original) and rendered (displayed) image size
interface ImgSize {
  naturalWidth: number;
  naturalHeight: number;
  renderedWidth: number;
  renderedHeight: number;
}

export default function Image() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState<ImgSize | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const toBase64 = async (img: string) => {
    const res = await fetch(img);
    const blob = await res.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
      reader.readAsDataURL(blob);
    });
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
    async function init() {
      setLoading(true);
      setError(null);
      setData(null);
      try {
        const imageBase64 = await toBase64(Car);
        const response = await fetch("/.netlify/functions/roboflow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64 }),
        });
        if (!response.ok) {
          throw new Error(
            `Server returned HTTP ${response.status}: ${response.statusText}`,
          );
        }
        const result = await response.json();
        if (result.error || (result.status && result.status !== "success")) {
          throw new Error(
            result.error?.message ||
              `Roboflow API error: ${JSON.stringify(result)}`,
          );
        }
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
    }
    init();
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
                  />
                ),
              )}
          </div>
        </div>
      )}
    </div>
  );
}
