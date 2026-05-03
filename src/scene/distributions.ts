export type Distribution = 'sphere' | 'gaussian' | 'shell' | 'line' | 'noise';

export type DistributionOpts = {
  count: number;
  distribution: Distribution;
  radius: number;
  shellThickness: number;
  length: number;
  lineThickness: number;
  noiseScale: number;
  noiseAmount: number;
  seed: number;
};

export function generatePositions(opts: DistributionOpts): Float32Array {
  const { count, distribution, seed } = opts;
  const arr = new Float32Array(count * 3);
  const rand = mulberry32(seed);

  for (let i = 0; i < count; i++) {
    const [x, y, z] = sampleOne(distribution, rand, opts);
    arr[i * 3] = x;
    arr[i * 3 + 1] = y;
    arr[i * 3 + 2] = z;
  }
  return arr;
}

function sampleOne(
  dist: Distribution,
  rand: () => number,
  opts: DistributionOpts,
): [number, number, number] {
  switch (dist) {
    case 'sphere': {
      // Uniform sample inside a sphere of `radius`.
      const r = opts.radius * Math.cbrt(rand());
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      return [
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      ];
    }
    case 'gaussian': {
      // 3 independent normal samples; sigma chosen so ~95% of mass falls
      // inside the visual `radius`.
      const sigma = opts.radius / 2;
      return [gauss(rand) * sigma, gauss(rand) * sigma, gauss(rand) * sigma];
    }
    case 'shell': {
      // Uniform direction × radius jittered by ±thickness/2.
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      const r = opts.radius + (rand() - 0.5) * opts.shellThickness;
      return [
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      ];
    }
    case 'line': {
      // Filament along Y, uniform disk cross-section of radius lineThickness.
      const y = (rand() - 0.5) * opts.length;
      const phi = rand() * Math.PI * 2;
      const r = opts.lineThickness * Math.sqrt(rand());
      return [r * Math.cos(phi), y, r * Math.sin(phi)];
    }
    case 'noise': {
      // Sphere distribution warped by a curl-like sin field. Not true curl
      // noise, but cheap and dependency-free; produces organic filaments.
      const r = opts.radius * Math.cbrt(rand());
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      let x = r * Math.sin(phi) * Math.cos(theta);
      let y = r * Math.sin(phi) * Math.sin(theta);
      let z = r * Math.cos(phi);
      const s = opts.noiseScale;
      const a = opts.noiseAmount;
      const dx = a * (Math.sin(s * y) + 0.5 * Math.sin(2 * s * z));
      const dy = a * (Math.sin(s * z) + 0.5 * Math.sin(2 * s * x));
      const dz = a * (Math.sin(s * x) + 0.5 * Math.sin(2 * s * y));
      return [x + dx, y + dy, z + dz];
    }
  }
}

// Box-Muller — one standard-normal sample per call.
function gauss(rand: () => number): number {
  const u1 = Math.max(rand(), 1e-9);
  const u2 = rand();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
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
