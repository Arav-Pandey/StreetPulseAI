import { FRAME_DT } from "./LiveCar";

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  captureCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  tracksRef: React.RefObject<Track[]>;
  setTimerActive: React.Dispatch<React.SetStateAction<boolean>>;
  setSpeedResult: React.Dispatch<React.SetStateAction<SpeedResult | null>>;
}

export interface SpeedResult {
  mph: number;
  elapsedSeconds: number;
}

export interface Track {
  id: number;

  x: number;
  y: number;
  width: number;
  height: number;

  age: number;
  missed: number;

  crossedStart: boolean;
  startTime: number | null;

  speed: number | null;

  detection: Detection;
}

export interface Detection {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  class: string;
}

export const captureFrame = ({ videoRef, captureCanvasRef }: Props): string => {
  const video = videoRef.current!;
  const canvas = captureCanvasRef.current!;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  canvas.getContext("2d")!.drawImage(video, 0, 0);

  return canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
};

export const seekTo = (time: number, { videoRef }: Props): Promise<void> =>
  new Promise((resolve) => {
    const video = videoRef.current!;

    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      resolve();
    };

    video.addEventListener("seeked", onSeeked);

    video.currentTime = time;
  });

export const waitForMetadata = ({ videoRef }: Props): Promise<void> =>
  new Promise((resolve) => {
    const video = videoRef.current!;

    if (video.readyState >= 1) {
      resolve();
      return;
    }

    video.addEventListener("loadedmetadata", () => resolve(), { once: true });
  });

export const detectCars = async (imageBase64: string): Promise<Detection[]> => {
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

export const iou = (a: Detection, b: Track) => {
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

export const interpolateCrossing = (
  prevY: number,
  currY: number,
  lineY: number,
  frameTime: number,
) => {
  const fraction = (lineY - prevY) / (currY - prevY);

  return frameTime - FRAME_DT + fraction * FRAME_DT;
};

export const resetCrossingState = ({
  tracksRef,
  setTimerActive,
  setSpeedResult,
}: Props) => {
  tracksRef.current = [];

  setTimerActive(false);
  setSpeedResult(null);
};
