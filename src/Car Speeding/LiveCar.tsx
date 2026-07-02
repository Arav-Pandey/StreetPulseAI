import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import Car from "../assets/Cars.jpg";
import Cars from "../assets/Cars_Highway_Bird.mp4";
import type { CarSpeedData } from "../CarSpeedHeatmap";
import Display from "./Display";
import { type Detection, type SpeedResult, type Track } from "./Helpers";

// ── CALIBRATE THIS ────────────────────────────────────────────────────────────
const TRAP_DISTANCE_FEET = 20;
const LINE_START_Y = 193;
const LINE_STOP_Y = 287;
const SPEED_LIMIT_MPH = 35;

export const FRAME_DT = 3 / 30;
const CYCLE_WAIT_MS = 1000;

// Tracker tuning
const IOU_THRESHOLD = 0.25;
const MAX_TRACK_AGE = 8;
// ───────────────────────────────────────────────────────────────────────────────

interface ImgSize {
  naturalWidth: number;
  naturalHeight: number;
  renderedWidth: number;
  renderedHeight: number;
}

interface Props {
  setCarsSpeeding: Dispatch<SetStateAction<CarSpeedData[]>>;
  road: string;
}

let nextTrackId = 0;

export default function Live({ setCarsSpeeding, road }: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [imgSize, setImgSize] = useState<ImgSize | null>(null);
  const [currentFrame, setCurrentFrame] = useState<string>(Car);

  const [speedResult, setSpeedResult] = useState<SpeedResult | null>(null);

  const [timerActive, setTimerActive] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);

  const runningRef = useRef(false);

  const tracksRef = useRef<Track[]>([]);

  // ───────────────────────────────────────────────────────────────────────────
  // Helpers
  // ───────────────────────────────────────────────────────────────────────────

  const captureFrame = (): string => {
    const video = videoRef.current!;
    const canvas = captureCanvasRef.current!;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    canvas.getContext("2d")!.drawImage(video, 0, 0);

    return canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
  };

  const seekTo = (time: number): Promise<void> =>
    new Promise((resolve) => {
      const video = videoRef.current!;

      const onSeeked = () => {
        video.removeEventListener("seeked", onSeeked);
        resolve();
      };

      video.addEventListener("seeked", onSeeked);

      video.currentTime = time;
    });

  const waitForMetadata = (): Promise<void> =>
    new Promise((resolve) => {
      const video = videoRef.current!;

      if (video.readyState >= 1) {
        resolve();
        return;
      }

      video.addEventListener("loadedmetadata", () => resolve(), { once: true });
    });

  const detectCars = async (imageBase64: string): Promise<Detection[]> => {
    const res = await fetch("/.netlify/functions/roboflowCar", {
      method: "POST",
      body: JSON.stringify({
        imageBase64,
      }),
    });

    if (!res.ok) {
      throw new Error(`API ${res.status}: ${await res.text()}`);
    }

    const json = JSON.parse(await res.text());

    return json.outputs[0].predictions.predictions;
  };

  // -------------------------------------------------------------------------
  // Tracking helpers
  // -------------------------------------------------------------------------

  const iou = (a: Detection, b: Track) => {
    const ax1 = a.x - a.width / 2;
    const ay1 = a.y - a.height / 2;
    const ax2 = a.x + a.width / 2;
    const ay2 = a.y + a.height / 2;

    const bx1 = b.x - b.width / 2;
    const by1 = b.y - b.height / 2;
    const bx2 = b.x + b.width / 2;
    const by2 = b.y + b.height / 2;

    const ix1 = Math.max(ax1, bx1);
    const iy1 = Math.max(ay1, by1);
    const ix2 = Math.min(ax2, bx2);
    const iy2 = Math.min(ay2, by2);

    const iw = Math.max(0, ix2 - ix1);
    const ih = Math.max(0, iy2 - iy1);

    const inter = iw * ih;

    const areaA = (ax2 - ax1) * (ay2 - ay1);
    const areaB = (bx2 - bx1) * (by2 - by1);

    return inter / (areaA + areaB - inter + 1e-6);
  };

  const interpolateCrossing = (
    prevY: number,
    currY: number,
    lineY: number,
    frameTime: number,
  ) => {
    const fraction = (lineY - prevY) / (currY - prevY);

    return frameTime - FRAME_DT + fraction * FRAME_DT;
  };

  const resetCrossingState = () => {
    tracksRef.current = [];

    setTimerActive(false);
    setSpeedResult(null);
  };

  // ── Main loop ─────────────────────────────────────────────────────────────

  // ── Main loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current!;
    video.src = Cars;
    runningRef.current = true;

    const loop = async () => {
      await waitForMetadata();
      await seekTo(0);

      while (runningRef.current) {
        setLoading(true);
        setError(null);

        const cycleStart = Date.now();

        try {
          const videoEl = videoRef.current!;
          const nextTime = videoEl.currentTime + FRAME_DT;

          if (nextTime >= videoEl.duration) {
            await seekTo(0);
            resetCrossingState();
          } else {
            await seekTo(nextTime);

            const frameTime = videoEl.currentTime;

            const imageBase64 = captureFrame();

            setCurrentFrame(`data:image/jpeg;base64,${imageBase64}`);

            const detections = await detectCars(imageBase64);

            setData({
              outputs: [
                {
                  predictions: {
                    predictions: detections,
                  },
                },
              ],
            });

            const tracks = tracksRef.current;

            const matchedTracks = new Set<number>();

            // ---------------------------------------------------
            // Associate detections to tracks
            // ---------------------------------------------------

            for (const det of detections) {
              let bestTrack: Track | null = null;
              let bestScore = IOU_THRESHOLD;

              for (const track of tracks) {
                if (matchedTracks.has(track.id)) continue;

                const score = iou(det, track);

                if (score > bestScore) {
                  bestScore = score;
                  bestTrack = track;
                }
              }

              if (bestTrack) {
                matchedTracks.add(bestTrack.id);

                const prevY = bestTrack.y;

                bestTrack.x = det.x;
                bestTrack.y = det.y;
                bestTrack.width = det.width;
                bestTrack.height = det.height;
                bestTrack.detection = det;
                bestTrack.age++;
                bestTrack.missed = 0;

                // ---------------- START ----------------

                if (
                  !bestTrack.crossedStart &&
                  prevY < LINE_START_Y &&
                  det.y >= LINE_START_Y
                ) {
                  bestTrack.crossedStart = true;

                  bestTrack.startTime = interpolateCrossing(
                    prevY,
                    det.y,
                    LINE_START_Y,
                    frameTime,
                  );

                  setTimerActive(true);
                }

                // ---------------- STOP ----------------

                if (
                  bestTrack.crossedStart &&
                  bestTrack.startTime !== null &&
                  prevY < LINE_STOP_Y &&
                  det.y >= LINE_STOP_Y
                ) {
                  const stopTime = interpolateCrossing(
                    prevY,
                    det.y,
                    LINE_STOP_Y,
                    frameTime,
                  );

                  const elapsed = stopTime - bestTrack.startTime;

                  const speedFps = TRAP_DISTANCE_FEET / elapsed;

                  const speedMph = speedFps / 1.46667;
                  bestTrack.speed = speedMph;

                  setSpeedResult({
                    mph: speedMph,
                    elapsedSeconds: elapsed,
                  });

                  setTimerActive(false);

                  setCarsSpeeding((prev) => {
                    const existing = prev.find((r) => r.road === road);

                    if (existing) {
                      return prev.map((r) =>
                        r.road === road
                          ? {
                              ...r,
                              speeding:
                                speedMph > SPEED_LIMIT_MPH
                                  ? r.speeding + 1
                                  : r.speeding,
                              total: r.total + 1,
                            }
                          : r,
                      );
                    }

                    return [
                      ...prev,
                      {
                        road,
                        speeding: speedMph > SPEED_LIMIT_MPH ? 1 : 0,
                        total: 1,
                      },
                    ];
                  });

                  bestTrack.crossedStart = false;
                  bestTrack.startTime = null;
                }
              } else {
                const newTrack: Track = {
                  id: nextTrackId++,

                  x: det.x,
                  y: det.y,
                  width: det.width,
                  height: det.height,

                  age: 0,
                  missed: 0,

                  crossedStart: false,
                  startTime: null,

                  speed: null,

                  detection: det,
                };

                tracks.push(newTrack);
                matchedTracks.add(newTrack.id);
              }
            }

            // ---------------------------------------------------
            // Remove stale tracks
            // ---------------------------------------------------

            for (let i = tracks.length - 1; i >= 0; i--) {
              const track = tracks[i];

              if (!matchedTracks.has(track.id)) {
                track.missed++;

                if (track.missed > MAX_TRACK_AGE) {
                  tracks.splice(i, 1);
                }
              }
            }
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";

          console.error(msg);
          setError(msg);
        } finally {
          setLoading(false);
        }

        const elapsed = Date.now() - cycleStart;

        await new Promise<void>((resolve) =>
          setTimeout(resolve, Math.max(0, CYCLE_WAIT_MS - elapsed)),
        );
      }
    };

    loop();

    return () => {
      runningRef.current = false;
    };
  }, [road, setCarsSpeeding]);

  // ── Resize bookkeeping ────────────────────────────────────────────────────
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
    <Display
      loading={loading}
      error={error}
      timerActive={timerActive}
      data={data}
      speedResult={speedResult}
      SPEED_LIMIT_MPH={SPEED_LIMIT_MPH}
      TRAP_DISTANCE_FEET={TRAP_DISTANCE_FEET}
      videoRef={videoRef}
      captureCanvasRef={captureCanvasRef}
      currentFrame={currentFrame}
      resetCrossingState={resetCrossingState}
      handleImageLoad={handleImageLoad}
      imgRef={imgRef}
      imgSize={imgSize}
      scaleX={scaleX}
      scaleY={scaleY}
      LINE_START_Y={LINE_START_Y}
      LINE_STOP_Y={LINE_STOP_Y}
      tracksRef={tracksRef}
    />
  );
}
