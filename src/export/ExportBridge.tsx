import { forwardRef, useImperativeHandle } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { exportPng, type ExportBackground } from './exportPng';

export type CameraState = {
  position: [number, number, number];
  target: [number, number, number];
};

export type ExportOptions = {
  size: number;
  background?: ExportBackground;
  filename?: string;
};

export type ExportApi = {
  exportPng: (opts: ExportOptions) => Promise<void>;
  getCameraState: () => CameraState;
  setCameraState: (state: CameraState) => void;
};

// Minimal shape for OrbitControls — we only need the look-at target and
// update(). Avoids a hard type dependency on three-stdlib.
type Controls = { target: THREE.Vector3; update: () => void };

// Lives inside the R3F <Canvas> so it can access gl/scene/camera/controls
// via useThree, and exposes an imperative handle to callers outside the
// canvas.
export const ExportBridge = forwardRef<ExportApi>(function ExportBridge(_, ref) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as Controls | null;

  useImperativeHandle(
    ref,
    () => ({
      exportPng: ({ size, background, filename }) =>
        exportPng({ gl, scene, camera, size, background, filename }),
      getCameraState: () => ({
        position: camera.position.toArray() as [number, number, number],
        target: (controls?.target.toArray() ?? [0, 0, 0]) as [
          number,
          number,
          number,
        ],
      }),
      setCameraState: (state) => {
        camera.position.fromArray(state.position);
        if (controls) {
          controls.target.fromArray(state.target);
          controls.update();
        }
        camera.updateMatrixWorld();
      },
    }),
    [gl, scene, camera, controls],
  );

  return null;
});
