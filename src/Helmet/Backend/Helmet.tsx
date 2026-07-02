import { useCallback, useEffect, useRef, useState } from "react";
import Bikers from "../../assets/Bikers.mp4";
import Display from "../Frontend/Display.tsx";
import type {
  DetectionPrediction,
  DetectionResponse,
  DetectionTotals,
  RecentCameraLocation,
} from "../interfaces.ts";
import { handleNewDetection } from "./HelmetHelper.ts";
import { lookupRoadName } from "./reverseGeocode.ts";

const RECENT_CAMERA_LOCATIONS_KEY = "streetpulse-recent-camera-locations";

function readRecentLocations(): RecentCameraLocation[] {
  try {
    const stored = localStorage.getItem(RECENT_CAMERA_LOCATIONS_KEY);
    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (location): location is RecentCameraLocation =>
        typeof location?.latitude === "number" &&
        location.latitude >= -90 &&
        location.latitude <= 90 &&
        typeof location?.longitude === "number" &&
        location.longitude >= -180 &&
        location.longitude <= 180 &&
        (location.roadName === undefined ||
          location.roadName === null ||
          typeof location.roadName === "string"),
    );
  } catch (err) {
    console.error("Could not load recent camera locations:", err);
    return [];
  }
}

export default function Helmet() {
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [locationSet, setLocationSet] = useState(false);
  const [recentLocations, setRecentLocations] =
    useState<RecentCameraLocation[]>(readRecentLocations);
  const recentLocationsRef = useRef(recentLocations);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DetectionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [helmets, setHelmets] = useState<DetectionPrediction[]>([]);
  const [bikes, setBikes] = useState<DetectionPrediction[]>([]);
  const [bikerNoHelmet, setBikerNoHelmet] = useState<DetectionPrediction[]>(
    [],
  );
  const [detectionTotals, setDetectionTotals] = useState<DetectionTotals>({
    bikes: 0,
    helmets: 0,
    noHelmet: 0,
  });

  const [paused, setPaused] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);

  const [refresh, setRefresh] = useState<boolean>(false);
  const pausedRef = useRef(false);

  const detectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isStartingRef = useRef(false);

  const saveRecentLocations = useCallback(
    (locations: RecentCameraLocation[]) => {
      recentLocationsRef.current = locations;
      setRecentLocations(locations);
      try {
        localStorage.setItem(
          RECENT_CAMERA_LOCATIONS_KEY,
          JSON.stringify(locations),
        );
      } catch (err) {
        console.error("Could not save recent camera locations:", err);
        setError("Could not save recent camera locations.");
      }
    },
    [],
  );

  const handleRoadNameLookupResult = useCallback(
    (location: RecentCameraLocation, roadName: string | null) => {
      const updatedLocations = recentLocationsRef.current.map((recent) =>
        recent.latitude === location.latitude &&
        recent.longitude === location.longitude
          ? { ...recent, roadName }
          : recent,
      );
      saveRecentLocations(updatedLocations);
    },
    [saveRecentLocations],
  );

  const captureFrame = () => {
    const video = videoRef.current!;
    const canvas = captureCanvasRef.current!;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
  };

  const runDetection = async (includePausedFrame = false) => {
    if (pausedRef.current && !includePausedFrame) return;

    try {
      const video = videoRef.current;
      if (!video) return;

      video.pause();
      setLoading(true);
      setAnalyzing(true);
      setError(null);
      setHelmets([]);
      setBikes([]);
      setBikerNoHelmet([]);
      const imageBase64 = captureFrame();
      const response = await fetch("/.netlify/functions/roboflowBike", {
        method: "POST",
        body: JSON.stringify({ imageBase64 }),
      });
      const text = await response.text();
      if (!response.ok) {
        throw new Error(
          `Helmet detection failed (${response.status}): ${text || "Unknown error"}`,
        );
      }
      const result: DetectionResponse = JSON.parse(text);

      const helmetsArr = result.outputs[0].predictions.predictions.filter(
        (p) => p.class === "with-helmet",
      );
      const bikesArr = result.outputs[0].predictions.predictions.filter(
        (p) => p.class === "bicycle",
      );
      const noHelmetArr = result.outputs[0].predictions.predictions.filter(
        (p) => p.class === "without-helmet",
      );

      const bikerNoHelmetArr = noHelmetArr.filter((nh) => {
        const nhTop = nh.y - nh.height / 2;
        const nhBottom = nh.y + nh.height / 2;
        return bikesArr.some((bike) => {
          const bikeTop = bike.y - bike.height / 2;
          const bikeBottom = bike.y + bike.height / 2;
          return nhTop < bikeBottom && bikeTop < nhBottom;
        });
      });

      await handleNewDetection({
        longitude: parseFloat(longitude),
        latitude: parseFloat(latitude),
        helmetsArr,
        bikesArr,
        bikerNoHelmetArr,
        setHelmets,
        setBikes,
        setBikerNoHelmet,
      });

      setDetectionTotals((totals) => ({
        bikes: totals.bikes + bikesArr.length,
        helmets: totals.helmets + helmetsArr.length,
        noHelmet: totals.noHelmet + bikerNoHelmetArr.length,
      }));
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
      setAnalyzing(false);
      if (!pausedRef.current) {
        resumeTimeoutRef.current = setTimeout(() => {
          const video = videoRef.current;
          if (!video || pausedRef.current || video.ended) return;
          void video.play().then(() => {
            detectionTimeoutRef.current = setTimeout(runDetection, 2000);
          }).catch((err: unknown) => {
            setError(
              err instanceof Error
                ? err.message
                : "Could not resume video playback",
            );
          });
        }, 1200);
      }
    }
  };

  const stopPolling = () => {
    if (detectionTimeoutRef.current) {
      clearTimeout(detectionTimeoutRef.current);
      detectionTimeoutRef.current = null;
    }
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
  };

  const startPolling = async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;

    try {
      stopPolling();
      pausedRef.current = false;

      await runDetection();
    } finally {
      isStartingRef.current = false;
    }
  };

  const togglePause = () => {
    if (pausedRef.current) {
      pausedRef.current = false;
      setPaused(false);
      if (analyzing) return;
      const video = videoRef.current;
      if (video) {
        void video.play().then(() => {
          detectionTimeoutRef.current = setTimeout(runDetection, 2000);
        }).catch((err: unknown) => {
          setError(
            err instanceof Error
              ? err.message
              : "Could not resume video playback",
          );
        });
      }
    } else {
      pausedRef.current = true;
      setPaused(true);
      stopPolling();
      videoRef.current?.pause();
    }
  };

  useEffect(() => {
    if (!locationSet) return;

    let stream: MediaStream;

    const handlePause = () => {
      setPaused(pausedRef.current);
    };
    const handlePlay = () => {
      setPaused(false);
    };
    const handleEnded = () => {
      pausedRef.current = true;
      setPaused(true);
      stopPolling();
      void runDetection(true);
    };

    navigator.mediaDevices.getUserMedia({ video: true }).then((s) => {
      stream = s;
      const video = videoRef.current;
      if (!video) return;
      video.src = Bikers;

      video.addEventListener("pause", handlePause);
      video.addEventListener("play", handlePlay);
      video.addEventListener("ended", handleEnded);

      video.oncanplay = () => {
        startPolling();
      };
    });

    return () => {
      stopPolling();
      const video = videoRef.current;
      if (video) {
        video.removeEventListener("pause", handlePause);
        video.removeEventListener("play", handlePlay);
        video.removeEventListener("ended", handleEnded);
      }
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [locationSet]);

  useEffect(() => {
    if (refresh) {
      const video = videoRef.current;
      if (video) {
        pausedRef.current = false;
        stopPolling();
        setDetectionTotals({ bikes: 0, helmets: 0, noHelmet: 0 });
        video.currentTime = 0;
        void video.play().then(startPolling).catch((err: unknown) => {
          setError(
            err instanceof Error
              ? err.message
              : "Could not restart video playback",
          );
        });
      }
      queueMicrotask(() => setRefresh(false));
    }
  }, [refresh]);

  const handleConfirmLocation = (lat: number, lng: number) => {
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      window.alert(
        "Please enter both Latitude and Longitude into the input boxes!",
      );
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return;

    const newLocation = { latitude: lat, longitude: lng };
    const updatedLocations = [
      newLocation,
      ...recentLocationsRef.current.filter(
        (location) =>
          location.latitude !== lat || location.longitude !== lng,
      ),
    ].slice(0, 5);
    saveRecentLocations(updatedLocations);
    void lookupRoadName(lat, lng)
      .then((roadName) =>
        handleRoadNameLookupResult(newLocation, roadName),
      )
      .catch((err: unknown) => {
        console.error("Could not look up camera road name:", err);
        handleRoadNameLookupResult(newLocation, null);
      });
    setLocationSet(true);
  };

  return (
    <Display
      loading={loading}
      error={error}
      videoRef={videoRef}
      captureCanvasRef={captureCanvasRef}
      data={data}
      analyzing={analyzing}
      setRefresh={setRefresh}
      togglePause={togglePause}
      paused={paused}
      helmets={helmets}
      bikes={bikes}
      bikerNoHelmet={bikerNoHelmet}
      detectionTotals={detectionTotals}
      latitude={latitude}
      longitude={longitude}
      setLatitude={setLatitude}
      setLongitude={setLongitude}
      locationSet={locationSet}
      recentLocations={recentLocations}
      onSelectRecentLocation={(location) => {
        setLatitude(String(location.latitude));
        setLongitude(String(location.longitude));
      }}
      onRoadNameLookupResult={handleRoadNameLookupResult}
      onConfirmLocation={handleConfirmLocation}
    />
  );
}
