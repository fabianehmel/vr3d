import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { useControls } from 'leva';
import { createBlobGeometry } from './blobGeometry';

type Kind =
  | 'mix'
  | 'blob'
  | 'sphere'
  | 'box'
  | 'torus'
  | 'torus-knot'
  | 'cone'
  | 'cylinder'
  | 'octahedron'
  | 'icosahedron';

type ConcreteKind = Exclude<Kind, 'mix'>;

type Instance = {
  kind: ConcreteKind;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  color: string;
  geometry: THREE.BufferGeometry;
};

const MIX_KINDS: ConcreteKind[] = [
  'blob',
  'sphere',
  'icosahedron',
  'octahedron',
  'torus',
];

export function AbstractShapes() {
  const params = useControls('Shapes', {
    count: { value: 30, min: 0, max: 200, step: 1 },
    kind: {
      value: 'blob' as Kind,
      options: {
        Mix: 'mix',
        Blob: 'blob',
        Sphere: 'sphere',
        Box: 'box',
        Torus: 'torus',
        'Torus knot': 'torus-knot',
        Cone: 'cone',
        Cylinder: 'cylinder',
        Octahedron: 'octahedron',
        Icosahedron: 'icosahedron',
      },
    },
    spread: { value: 1.5, min: 0.1, max: 5, step: 0.05 },
    scale: { value: 0.25, min: 0.02, max: 2, step: 0.01 },
    scaleVariation: { value: 0.6, min: 0, max: 1, step: 0.01 },
    color: '#aacfff',
    colorVariation: { value: 0.15, min: 0, max: 1, step: 0.01 },
    opacity: { value: 1, min: 0, max: 1, step: 0.01 },
    wireframe: false,
    roughness: {
      value: 0.25,
      min: 0,
      max: 1,
      step: 0.01,
      render: (get) => !get('Shapes.wireframe'),
    },
    metalness: {
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.01,
      render: (get) => !get('Shapes.wireframe'),
    },
    blobAmplitude: {
      label: 'blob amp',
      value: 0.35,
      min: 0,
      max: 1,
      step: 0.01,
      render: (get) =>
        get('Shapes.kind') === 'blob' || get('Shapes.kind') === 'mix',
    },
    blobFrequency: {
      label: 'blob freq',
      value: 2,
      min: 0.5,
      max: 8,
      step: 0.1,
      render: (get) =>
        get('Shapes.kind') === 'blob' || get('Shapes.kind') === 'mix',
    },
    blending: {
      value: 'normal' as 'normal' | 'additive',
      options: { Normal: 'normal', Additive: 'additive' },
    },
    seed: { value: 1, min: 0, max: 9999, step: 1 },
  });

  // Build instances + their geometries inside an effect so disposal under
  // StrictMode is correct (useMemo would cache disposed resources across
  // double-mounts).
  const [instances, setInstances] = useState<Instance[]>([]);

  useEffect(() => {
    const shared = createSharedGeometries();
    const arr = buildInstances(params, shared);
    setInstances(arr);
    return () => {
      for (const g of Object.values(shared)) g.dispose();
      for (const inst of arr) {
        if (inst.kind === 'blob') inst.geometry.dispose();
      }
    };
    // params is a stable object reference per render but its fields drive
    // generation. Spreading deps would be tedious; leva returns the same
    // object identity until something changes, so this is fine.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    params.count,
    params.kind,
    params.spread,
    params.scale,
    params.scaleVariation,
    params.color,
    params.colorVariation,
    params.blobAmplitude,
    params.blobFrequency,
    params.seed,
  ]);

  return (
    <>
      {instances.map((inst, i) => (
        <mesh
          key={i}
          position={inst.position}
          rotation={inst.rotation}
          scale={inst.scale}
          geometry={inst.geometry}
        >
          <meshStandardMaterial
            color={inst.color}
            transparent
            opacity={params.opacity}
            wireframe={params.wireframe}
            depthWrite={false}
            side={THREE.DoubleSide}
            roughness={params.roughness}
            metalness={params.metalness}
            blending={
              params.blending === 'additive'
                ? THREE.AdditiveBlending
                : THREE.NormalBlending
            }
          />
        </mesh>
      ))}
    </>
  );
}

type SharedGeoms = Record<Exclude<ConcreteKind, 'blob'>, THREE.BufferGeometry>;

function createSharedGeometries(): SharedGeoms {
  return {
    sphere: new THREE.SphereGeometry(1, 32, 24),
    box: new THREE.BoxGeometry(1.4, 1.4, 1.4),
    torus: new THREE.TorusGeometry(0.8, 0.25, 16, 64),
    'torus-knot': new THREE.TorusKnotGeometry(0.7, 0.22, 128, 16),
    cone: new THREE.ConeGeometry(0.8, 1.6, 32),
    cylinder: new THREE.CylinderGeometry(0.7, 0.7, 1.6, 32),
    octahedron: new THREE.OctahedronGeometry(1, 0),
    icosahedron: new THREE.IcosahedronGeometry(1, 0),
  };
}

type Params = {
  count: number;
  kind: Kind;
  spread: number;
  scale: number;
  scaleVariation: number;
  color: string;
  colorVariation: number;
  blobAmplitude: number;
  blobFrequency: number;
  seed: number;
};

function buildInstances(params: Params, shared: SharedGeoms): Instance[] {
  const arr: Instance[] = [];
  const rand = mulberry32(params.seed);
  const baseColor = new THREE.Color(params.color);

  for (let i = 0; i < params.count; i++) {
    // Position uniform inside a sphere
    const r = params.spread * Math.cbrt(rand());
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(2 * rand() - 1);
    const position: [number, number, number] = [
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi),
    ];
    const rotation: [number, number, number] = [
      rand() * Math.PI * 2,
      rand() * Math.PI * 2,
      rand() * Math.PI * 2,
    ];
    const scale =
      params.scale * (1 + (rand() - 0.5) * params.scaleVariation * 2);

    const c = baseColor.clone();
    if (params.colorVariation > 0) {
      const hsl = { h: 0, s: 0, l: 0 };
      c.getHSL(hsl);
      hsl.h = (hsl.h + (rand() - 0.5) * params.colorVariation + 1) % 1;
      c.setHSL(hsl.h, hsl.s, hsl.l);
    }

    const kind: ConcreteKind =
      params.kind === 'mix'
        ? MIX_KINDS[Math.floor(rand() * MIX_KINDS.length)]
        : (params.kind as ConcreteKind);

    const geometry =
      kind === 'blob'
        ? createBlobGeometry({
            detail: 3,
            amplitude: params.blobAmplitude,
            frequency: params.blobFrequency,
            seed: params.seed * 1000 + i + 1,
          })
        : shared[kind];

    arr.push({
      kind,
      position,
      rotation,
      scale,
      color: '#' + c.getHexString(),
      geometry,
    });
  }
  return arr;
}

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
