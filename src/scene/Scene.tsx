import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { RefObject } from 'react';
import { ExportBridge, type ExportApi } from '../export/ExportBridge';
import { ParticleCloud } from './ParticleCloud';
import { ImageSprites } from './ImageSprites';
import { AbstractShapes } from './AbstractShapes';
import { Lighting } from './Lighting';

type Props = {
  exportRef: RefObject<ExportApi>;
};

export function Scene({ exportRef }: Props) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ position: [0, 0, 5], fov: 45 }}
      gl={{
        alpha: true,
        premultipliedAlpha: false,
        preserveDrawingBuffer: true,
        antialias: true,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
      }}
    >
      <ExportBridge ref={exportRef} />
      <Lighting />
      <ParticleCloud />
      <AbstractShapes />
      <ImageSprites />
      <OrbitControls makeDefault enableDamping dampingFactor={0.1} />
    </Canvas>
  );
}
