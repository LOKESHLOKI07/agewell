import type { CameraFollowMode, MapCoordinate } from '../live';

export interface LiveMapViewProps {
  associate: MapCoordinate | null;
  associateName: string;
  live: boolean;
  heading?: number;
  senior: MapCoordinate | null;
  seniorLive?: boolean;
  home: MapCoordinate | null;
  traveledPath?: MapCoordinate[];
  remainingPath?: MapCoordinate[];
  showDeviceLocation: boolean;
  followMode: CameraFollowMode;
  onUserGesture: () => void;
  mapReady: boolean;
  onMapReady: () => void;
  /** Increment to refit the camera on the current pins. */
  fitToken?: number;
}
