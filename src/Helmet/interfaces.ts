export interface DetectionPrediction {
  x: number;
  y: number;
  width: number;
  height: number;
  class: string;
}

export interface DetectionResponse {
  outputs: {
    predictions: {
      predictions: DetectionPrediction[];
    };
  }[];
}

export interface RecentCameraLocation {
  latitude: number;
  longitude: number;
  roadName?: string | null;
}

export interface DetectionTotals {
  bikes: number;
  helmets: number;
  noHelmet: number;
}

export interface DisplayProps {
  loading: boolean;
  error: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  captureCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  data: DetectionResponse | null;
  analyzing: boolean;
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
  togglePause: () => void;
  paused: boolean;
  helmets: DetectionPrediction[];
  bikes: DetectionPrediction[];
  bikerNoHelmet: DetectionPrediction[];
  detectionTotals: DetectionTotals;
  latitude: string;
  longitude: string;
  setLatitude: React.Dispatch<React.SetStateAction<string>>;
  setLongitude: React.Dispatch<React.SetStateAction<string>>;
  locationSet: boolean;
  recentLocations: RecentCameraLocation[];
  onSelectRecentLocation: (location: RecentCameraLocation) => void;
  onRoadNameLookupResult: (
    location: RecentCameraLocation,
    roadName: string | null,
  ) => void;
  onConfirmLocation: (latitude: number, longitude: number) => void;
}

export interface LocationSettingProps {
  latitude: string;
  longitude: string;
  setLatitude: React.Dispatch<React.SetStateAction<string>>;
  setLongitude: React.Dispatch<React.SetStateAction<string>>;
  recentLocations: RecentCameraLocation[];
  onSelectRecentLocation: (location: RecentCameraLocation) => void;
  onRoadNameLookupResult: (
    location: RecentCameraLocation,
    roadName: string | null,
  ) => void;
  onConfirmLocation: (latitude: number, longitude: number) => void;
}

export interface newDecectionProps {
  longitude: number;
  latitude: number;
  helmetsArr: DetectionPrediction[];
  bikesArr: DetectionPrediction[];
  bikerNoHelmetArr: DetectionPrediction[];
  setHelmets: React.Dispatch<React.SetStateAction<DetectionPrediction[]>>;
  setBikes: React.Dispatch<React.SetStateAction<DetectionPrediction[]>>;
  setBikerNoHelmet: React.Dispatch<
    React.SetStateAction<DetectionPrediction[]>
  >;
}
