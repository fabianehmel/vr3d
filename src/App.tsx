import { useRef, useState } from 'react';
import { Leva } from 'leva';
import './App.css';
import { Scene } from './scene/Scene';
import type { ExportApi } from './export/ExportBridge';
import { ImagePanel } from './ui/ImagePanel';
import {
  serializeScene,
  deserializeScene,
  type SerializedScene,
} from './state/persistence';

const EXPORT_BASE = 1600;
const SCALES = [1, 2, 3, 4] as const;

const BACKGROUND_OPTIONS = {
  Transparent: 'transparent',
  White: '#ffffff',
  Black: '#000000',
} as const;
type BackgroundChoice = (typeof BACKGROUND_OPTIONS)[keyof typeof BACKGROUND_OPTIONS];

export default function App() {
  const exportRef = useRef<ExportApi>(null);
  const [scale, setScale] = useState<number>(2);
  const [background, setBackground] = useState<BackgroundChoice>('transparent');

  const handleExport = async () => {
    const api = exportRef.current;
    if (!api) return;
    try {
      const base = `vr3d-${makeTimestamp()}`;
      await api.exportPng({
        size: EXPORT_BASE * scale,
        background,
        filename: `${base}.png`,
      });
      const scene = await serializeScene(api.getCameraState());
      downloadJson(scene, `${base}.json`);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed — see console');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as SerializedScene;
      deserializeScene(parsed);
      // Apply camera last, after a tick — leva updates trigger re-renders
      // that may run controls.update() and override our target.
      if (parsed.camera) {
        setTimeout(() => exportRef.current?.setCameraState(parsed.camera!), 0);
      }
    } catch (err) {
      console.error('Import failed:', err);
      alert(
        `Could not load scene: ${
          err instanceof Error ? err.message : 'unknown error'
        }`,
      );
    }
  };

  return (
    <div className="app">
      <div className="stage">
        <div className="canvas-frame">
          <Scene exportRef={exportRef} />
        </div>
      </div>
      <aside className="sidebar">
        <header className="sidebar-header">
          <h1>vr3d</h1>
          <div className="export-controls">
            <label className="ghost-btn" title="Load scene from JSON">
              <input
                type="file"
                accept=".json,application/json"
                hidden
                onChange={handleImport}
              />
              Load
            </label>
            <select
              className="scale-select"
              value={background}
              onChange={(e) =>
                setBackground(e.target.value as BackgroundChoice)
              }
              title="Export background"
            >
              {Object.entries(BACKGROUND_OPTIONS).map(([label, value]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              className="scale-select"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              title={`Export at ${EXPORT_BASE * scale}×${EXPORT_BASE * scale}`}
            >
              {SCALES.map((s) => (
                <option key={s} value={s}>
                  {s}×
                </option>
              ))}
            </select>
            <button onClick={handleExport}>Export</button>
          </div>
        </header>
        <ImagePanel />
        <section className="panel cloud-panel">
          <h2>Generators</h2>
          <div className="leva-mount">
            <Leva fill flat titleBar={false} />
          </div>
        </section>
      </aside>
    </div>
  );
}

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function makeTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}
