import type { RefObject } from "react";

interface Props {
  loading: boolean;
  error: string | null;
  timerActive: boolean;
  speedResult: { mph: number; elapsedSeconds: number } | null;
  SPEED_LIMIT_MPH: number;
  TRAP_DISTANCE_FEET: number;
  videoRef: RefObject<HTMLVideoElement | null>;
  captureCanvasRef: RefObject<HTMLCanvasElement | null>;
  currentFrame: string;
  data: any;
  resetCrossingState: () => void;
  handleImageLoad: () => void;
  imgRef: RefObject<HTMLImageElement | null>;
  imgSize: {
    naturalWidth: number;
    naturalHeight: number;
    renderedWidth: number;
    renderedHeight: number;
  } | null;
  scaleX: number;
  scaleY: number;
  LINE_START_Y: number;
  LINE_STOP_Y: number;
  tracksRef: RefObject<
    Array<{
      id: number;
      x: number;
      y: number;
      width: number;
      height: number;
      speed: number | null;
    }>
  >;
}

export default function Display({
  loading,
  error,
  timerActive,
  speedResult,
  SPEED_LIMIT_MPH,
  TRAP_DISTANCE_FEET,
  videoRef,
  captureCanvasRef,
  currentFrame,
  data,
  resetCrossingState,
  handleImageLoad,
  imgRef,
  imgSize,
  scaleX,
  scaleY,
  LINE_START_Y,
  LINE_STOP_Y,
  tracksRef,
}: Props) {
  return (
    <div style={{ padding: 20 }}>
      {loading && <p>Detecting...</p>}

      {error && (
        <div
          style={{
            color: "red",
            background: "#fdf2f2",
            border: "1px solid red",
            padding: 10,
            marginBottom: 12,
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {timerActive && (
        <div
          style={{
            padding: "8px 12px",
            background: "#585FAA",
            border: "1px solid orange",
            borderRadius: 6,
            marginBottom: 12,
          }}
        >
          ⏱ Timing...
        </div>
      )}

      {speedResult && (
        <div
          style={{
            padding: "12px 16px",
            background:
              speedResult.mph > SPEED_LIMIT_MPH ? "#fff0f0" : "#f0fff4",

            border: `2px solid ${
              speedResult.mph > SPEED_LIMIT_MPH ? "red" : "green"
            }`,

            borderRadius: 6,
            marginBottom: 12,
            fontFamily: "monospace",
          }}
        >
          <span
            style={{
              fontSize: 22,
              fontWeight: "bold",
            }}
          >
            {speedResult.mph.toFixed(1)} MPH
          </span>

          {speedResult.mph > SPEED_LIMIT_MPH && (
            <span
              style={{
                marginLeft: 10,
                color: "red",
                fontWeight: "bold",
              }}
            >
              ⚠ SPEEDING
            </span>
          )}

          <span
            style={{
              marginLeft: 14,
              color: "#666",
              fontSize: 12,
            }}
          >
            {TRAP_DISTANCE_FEET} ft ÷ {speedResult.elapsedSeconds.toFixed(4)}s
          </span>
        </div>
      )}

      <video ref={videoRef} muted playsInline style={{ display: "none" }} />

      <canvas ref={captureCanvasRef} style={{ display: "none" }} />

      <button
        style={{
          marginBottom: 12,
          display: "block",
        }}
        onClick={() => {
          if (videoRef.current) videoRef.current.currentTime = 0;

          resetCrossingState();
        }}
      >
        Rewatch Video
      </button>

      {data && (
        <div
          style={{
            position: "relative",
            display: "inline-block",
          }}
        >
          <img
            ref={imgRef}
            src={currentFrame}
            alt="Frame"
            onLoad={handleImageLoad}
          />

          {imgSize && (
            <>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: LINE_START_Y * scaleY,
                  width: "100%",
                  height: 2,
                  background: "#ffeb3b",
                }}
              />

              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: LINE_STOP_Y * scaleY,
                  width: "100%",
                  height: 2,
                  background: "#f44336",
                }}
              />
            </>
          )}

          {imgSize &&
            tracksRef.current.map((track) => (
              <div
                key={track.id}
                style={{
                  position: "absolute",
                  left: (track.x - track.width / 2) * scaleX,

                  top: (track.y - track.height / 2) * scaleY,

                  width: track.width * scaleX,

                  height: track.height * scaleY,

                  border: "2px solid red",
                  pointerEvents: "none",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    background: "rgba(0,0,0,.7)",
                    color: "white",
                    fontSize: 11,
                    padding: "2px 5px",
                  }}
                >
                  {track.speed !== null ? `${track.speed.toFixed(1)} MPH` : ""}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
