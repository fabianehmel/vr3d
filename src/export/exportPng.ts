import * as THREE from 'three';

export type ExportBackground = 'transparent' | string; // 'transparent' or hex color

type ExportArgs = {
  gl: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
  size: number;
  background?: ExportBackground;
  filename?: string;
};

export async function exportPng({
  gl,
  scene,
  camera,
  size,
  background = 'transparent',
  filename,
}: ExportArgs): Promise<void> {
  const prevSize = new THREE.Vector2();
  gl.getSize(prevSize);
  const prevPixelRatio = gl.getPixelRatio();
  const persp = camera as THREE.PerspectiveCamera;
  const isPerspective = persp.isPerspectiveCamera === true;
  const prevAspect = isPerspective ? persp.aspect : 1;

  const prevClearColor = gl.getClearColor(new THREE.Color());
  const prevClearAlpha = gl.getClearAlpha();

  try {
    // Resize the drawing buffer only (updateStyle=false keeps CSS size intact,
    // so the displayed canvas doesn't flicker).
    gl.setPixelRatio(1);
    gl.setSize(size, size, false);
    if (isPerspective) {
      persp.aspect = 1;
      persp.updateProjectionMatrix();
    }

    if (background === 'transparent') {
      gl.setClearColor(0x000000, 0);
    } else {
      gl.setClearColor(new THREE.Color(background), 1);
    }

    gl.render(scene, camera);

    const blob = await new Promise<Blob | null>((resolve) =>
      gl.domElement.toBlob(resolve, 'image/png'),
    );
    if (!blob) throw new Error('Canvas toBlob returned null');

    downloadBlob(blob, filename ?? `vr3d-${timestamp()}.png`);
  } finally {
    gl.setPixelRatio(prevPixelRatio);
    gl.setSize(prevSize.x, prevSize.y, false);
    if (isPerspective) {
      persp.aspect = prevAspect;
      persp.updateProjectionMatrix();
    }
    gl.setClearColor(prevClearColor, prevClearAlpha);
    gl.render(scene, camera);
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after a tick so the download has registered.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}
