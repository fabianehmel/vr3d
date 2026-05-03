import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useControls } from 'leva';
import { generatePositions, type Distribution } from './distributions';

// Soft circular sprite — drawn once at module load and reused for all particles.
const SOFT_CIRCLE = makeSoftCircleTexture();

export function ParticleCloud() {
  const {
    count,
    size,
    distribution,
    radius,
    shellThickness,
    length,
    lineThickness,
    noiseScale,
    noiseAmount,
    seed,
    opacity,
    color,
    blending,
  } = useControls('Cloud', {
    distribution: {
      label: 'shape',
      options: {
        Sphere: 'sphere',
        'Gaussian blob': 'gaussian',
        Shell: 'shell',
        Line: 'line',
        'Noise-warped': 'noise',
      } as const,
      value: 'sphere',
    },
    count: { value: 20000, min: 100, max: 200000, step: 100 },
    size: { value: 0.025, min: 0.002, max: 0.2, step: 0.001 },
    seed: { value: 12345, min: 0, max: 99999, step: 1 },

    radius: {
      value: 1.5,
      min: 0.1,
      max: 5,
      step: 0.05,
      render: (get) => get('Cloud.distribution') !== 'line',
    },
    shellThickness: {
      label: 'thickness',
      value: 0.1,
      min: 0,
      max: 2,
      step: 0.01,
      render: (get) => get('Cloud.distribution') === 'shell',
    },
    length: {
      value: 3,
      min: 0.5,
      max: 10,
      step: 0.1,
      render: (get) => get('Cloud.distribution') === 'line',
    },
    lineThickness: {
      label: 'thickness',
      value: 0.1,
      min: 0,
      max: 2,
      step: 0.01,
      render: (get) => get('Cloud.distribution') === 'line',
    },
    noiseScale: {
      label: 'noise scale',
      value: 1.5,
      min: 0.1,
      max: 8,
      step: 0.05,
      render: (get) => get('Cloud.distribution') === 'noise',
    },
    noiseAmount: {
      label: 'noise amount',
      value: 0.6,
      min: 0,
      max: 3,
      step: 0.05,
      render: (get) => get('Cloud.distribution') === 'noise',
    },

    opacity: { value: 0.7, min: 0, max: 1, step: 0.01 },
    color: '#88aaff',
    blending: {
      options: { Normal: 'normal', Additive: 'additive' } as const,
      value: 'normal',
    },
  });

  const positions = useMemo(
    () =>
      generatePositions({
        count,
        distribution: distribution as Distribution,
        radius,
        shellThickness,
        length,
        lineThickness,
        noiseScale,
        noiseAmount,
        seed,
      }),
    [
      count,
      distribution,
      radius,
      shellThickness,
      length,
      lineThickness,
      noiseScale,
      noiseAmount,
      seed,
    ],
  );

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <points geometry={geometry}>
      <pointsMaterial
        size={size}
        color={color}
        map={SOFT_CIRCLE}
        transparent
        opacity={opacity}
        depthWrite={false}
        sizeAttenuation
        alphaTest={0.001}
        blending={
          blending === 'additive' ? THREE.AdditiveBlending : THREE.NormalBlending
        }
      />
    </points>
  );
}

function makeSoftCircleTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
