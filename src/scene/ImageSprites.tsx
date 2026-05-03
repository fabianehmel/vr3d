import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { useStore, type ImageSpriteData } from '../state/store';

export function ImageSprites() {
  const sprites = useStore((s) => s.sprites);
  return (
    <>
      {sprites.map((s) => (
        <ImageSprite key={s.id} data={s} />
      ))}
    </>
  );
}

function ImageSprite({ data }: { data: ImageSpriteData }) {
  const texture = useTexture(data.url);

  if (!texture) return null;

  const img = texture.image as HTMLImageElement;
  const aspect = img && img.width ? img.width / img.height : 1;

  return (
    <mesh
      position={data.position}
      rotation={data.rotation}
      scale={[aspect * data.scale, data.scale, 1]}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={data.opacity}
        depthWrite={false}
        side={THREE.DoubleSide}
        alphaTest={0.001}
        toneMapped={false}
        blending={
          data.blending === 'additive'
            ? THREE.AdditiveBlending
            : THREE.NormalBlending
        }
      />
    </mesh>
  );
}

// Imperative texture loader so we can handle errors without Suspense.
// Two effects so the texture isn't disposed before the new one is ready:
// the load effect tracks `url`; the disposal effect tracks the loaded
// instance and runs only when that instance is replaced or the component
// unmounts.
function useTexture(url: string): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      url,
      (tex) => {
        if (cancelled) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        setTexture(tex);
      },
      undefined,
      (err) => {
        // Most common cause: CORS denial. The image may still appear in
        // the canvas, but readback (toBlob) fails with SecurityError.
        console.error('[vr3d] Failed to load image', url, err);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [url]);

  useEffect(() => {
    return () => {
      texture?.dispose();
    };
  }, [texture]);

  return texture;
}
