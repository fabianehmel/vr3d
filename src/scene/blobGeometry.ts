import * as THREE from 'three';

export type BlobOpts = {
  detail?: number; // icosahedron subdivision
  amplitude?: number; // displacement strength
  frequency?: number; // noise frequency
  seed?: number; // unique per blob — shifts the noise field
};

// Vertex-displaced icosahedron — each vertex pushed along its outward normal
// by a smooth pseudo-noise function. With a per-instance `seed` the noise
// field is offset, so every blob has a different shape.
export function createBlobGeometry(opts: BlobOpts = {}): THREE.BufferGeometry {
  const { detail = 3, amplitude = 0.35, frequency = 2, seed = 0 } = opts;
  const geom = new THREE.IcosahedronGeometry(1, detail);
  const pos = geom.attributes.position as THREE.BufferAttribute;

  const offX = seed * 17.31;
  const offY = seed * 23.97;
  const offZ = seed * 11.43;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const len = Math.sqrt(x * x + y * y + z * z) || 1;
    const nx = x / len;
    const ny = y / len;
    const nz = z / len;
    const n = noise3(
      x * frequency + offX,
      y * frequency + offY,
      z * frequency + offZ,
    );
    const r = 1 + n * amplitude;
    pos.setXYZ(i, nx * r, ny * r, nz * r);
  }
  pos.needsUpdate = true;
  geom.computeVertexNormals();
  geom.computeBoundingSphere();
  return geom;
}

// Cheap dependency-free 3D noise — three sine bands at different
// frequencies and orientations. Range roughly [-1, 1].
function noise3(x: number, y: number, z: number): number {
  return (
    (Math.sin(x * 1.7 + y * 2.3 + z * 1.1) +
      Math.sin(x * 3.1 - y * 1.5 + z * 2.7) * 0.5 +
      Math.sin(x * 5.9 + y * 4.1 - z * 3.3) * 0.25) /
    1.75
  );
}
