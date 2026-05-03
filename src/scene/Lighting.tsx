import { Suspense } from 'react';
import { useControls } from 'leva';
import { Environment } from '@react-three/drei';

const PRESETS = [
  'studio',
  'city',
  'sunset',
  'dawn',
  'night',
  'forest',
  'apartment',
  'park',
  'lobby',
  'warehouse',
] as const;
type EnvPreset = (typeof PRESETS)[number];

export function Lighting() {
  const { ambient, key, keyColor, fill, fillColor, environment } = useControls(
    'Lighting',
    {
      ambient: { value: 0.5, min: 0, max: 2, step: 0.05 },
      key: { value: 1.5, min: 0, max: 5, step: 0.05 },
      keyColor: '#ffffff',
      fill: { value: 0.6, min: 0, max: 5, step: 0.05 },
      fillColor: '#7aa3ff',
      environment: {
        value: 'studio' as EnvPreset | 'none',
        options: {
          None: 'none',
          Studio: 'studio',
          City: 'city',
          Sunset: 'sunset',
          Dawn: 'dawn',
          Night: 'night',
          Forest: 'forest',
          Apartment: 'apartment',
          Park: 'park',
          Lobby: 'lobby',
          Warehouse: 'warehouse',
        },
      },
    },
  );

  return (
    <>
      <ambientLight intensity={ambient} />
      <directionalLight
        position={[3, 4, 5]}
        intensity={key}
        color={keyColor}
      />
      <directionalLight
        position={[-4, -2, -3]}
        intensity={fill}
        color={fillColor}
      />
      {environment !== 'none' && (
        <Suspense fallback={null}>
          <Environment preset={environment as EnvPreset} />
        </Suspense>
      )}
    </>
  );
}
