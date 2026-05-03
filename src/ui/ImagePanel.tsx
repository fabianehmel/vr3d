import { useState } from 'react';
import { useStore, type ImageSpriteData, type Blending } from '../state/store';
import { Slider, NumInput } from './controls';

export function ImagePanel() {
  const sprites = useStore((s) => s.sprites);
  const addSprite = useStore((s) => s.addSprite);

  const [url, setUrl] = useState('');

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    addSprite({ url: trimmed, name: filenameFromUrl(trimmed) });
    setUrl('');
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      addSprite({ url: URL.createObjectURL(file), name: file.name });
    }
    e.target.value = '';
  };

  return (
    <section className="panel">
      <h2>Images</h2>
      <form className="add-row" onSubmit={handleAddUrl}>
        <input
          type="url"
          placeholder="https://example.com/image.png"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button type="submit" disabled={!url.trim()}>
          Add URL
        </button>
      </form>
      <label className="upload-btn">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleUpload}
          hidden
        />
        Upload files…
      </label>
      <p className="hint subtle">
        URLs need CORS-enabled hosts or PNG export will fail. Local files always
        work.
      </p>
      {sprites.length === 0 ? (
        <p className="hint subtle">No images yet.</p>
      ) : (
        <ul className="sprite-list">
          {sprites.map((s) => (
            <SpriteCard key={s.id} data={s} />
          ))}
        </ul>
      )}
    </section>
  );
}

function SpriteCard({ data }: { data: ImageSpriteData }) {
  const update = useStore((s) => s.updateSprite);
  const remove = useStore((s) => s.removeSprite);

  const setPos = (axis: 0 | 1 | 2, value: number) => {
    const next = [...data.position] as [number, number, number];
    next[axis] = value;
    update(data.id, { position: next });
  };

  const setRot = (axis: 0 | 1 | 2, value: number) => {
    const next = [...data.rotation] as [number, number, number];
    next[axis] = value;
    update(data.id, { rotation: next });
  };

  return (
    <li className="sprite-card">
      <header>
        <img src={data.url} alt="" className="thumb" />
        <span className="name" title={data.name}>
          {data.name}
        </span>
        <button
          className="icon-btn"
          onClick={() => remove(data.id)}
          aria-label="Delete"
          title="Delete"
        >
          ×
        </button>
      </header>

      <div className="row pos">
        <label>pos</label>
        <NumInput value={data.position[0]} onChange={(v) => setPos(0, v)} />
        <NumInput value={data.position[1]} onChange={(v) => setPos(1, v)} />
        <NumInput value={data.position[2]} onChange={(v) => setPos(2, v)} />
      </div>

      <div className="row pos">
        <label>rot</label>
        <NumInput value={data.rotation[0]} onChange={(v) => setRot(0, v)} />
        <NumInput value={data.rotation[1]} onChange={(v) => setRot(1, v)} />
        <NumInput value={data.rotation[2]} onChange={(v) => setRot(2, v)} />
      </div>

      <Slider
        label="scale"
        min={0.05}
        max={5}
        step={0.01}
        value={data.scale}
        onChange={(v) => update(data.id, { scale: v })}
      />
      <Slider
        label="alpha"
        min={0}
        max={1}
        step={0.01}
        value={data.opacity}
        onChange={(v) => update(data.id, { opacity: v })}
      />

      <div className="row">
        <label>blend</label>
        <select
          value={data.blending}
          onChange={(e) =>
            update(data.id, { blending: e.target.value as Blending })
          }
        >
          <option value="normal">Normal</option>
          <option value="additive">Additive</option>
        </select>
      </div>
    </li>
  );
}

function filenameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const last = u.pathname.split('/').filter(Boolean).pop();
    return last || u.hostname;
  } catch {
    return url.slice(0, 40);
  }
}
