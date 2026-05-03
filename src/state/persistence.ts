import { levaStore } from 'leva';
import { useStore, type ImageSpriteData } from './store';
import type { CameraState } from '../export/ExportBridge';

export type SerializedScene = {
  version: 1;
  createdAt: string;
  leva: Record<string, unknown>;
  sprites: ImageSpriteData[];
  camera?: CameraState;
};

export async function serializeScene(
  camera?: CameraState,
): Promise<SerializedScene> {
  const sprites = useStore.getState().sprites;

  // Inline blob: URLs as data URLs so the JSON is self-contained.
  // External (http/https) URLs are kept as-is and re-fetched on import.
  const inlinedSprites = await Promise.all(
    sprites.map(async (s) => {
      if (s.url.startsWith('blob:')) {
        return { ...s, url: await blobUrlToDataUrl(s.url) };
      }
      return s;
    }),
  );

  return {
    version: 1,
    createdAt: new Date().toISOString(),
    leva: serializeLeva(),
    sprites: inlinedSprites,
    camera,
  };
}

export function deserializeScene(scene: SerializedScene): void {
  if (!scene || typeof scene !== 'object' || scene.version !== 1) {
    throw new Error('Unsupported or invalid scene file (expected version 1)');
  }

  if (scene.leva && typeof scene.leva === 'object') {
    deserializeLeva(scene.leva);
  }

  // Replace sprites — assign fresh ids so we never collide with anything
  // already in the store.
  const restored = (scene.sprites ?? []).map((s) => ({
    ...s,
    id: crypto.randomUUID(),
  }));
  useStore.getState().replaceSprites(restored);
}

function serializeLeva(): Record<string, unknown> {
  const data = levaStore.getData() as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [path, item] of Object.entries(data)) {
    if (!item || typeof item !== 'object') continue;
    // Skip folder rows — they hold UI state, not values.
    if ('type' in item && (item as { type: unknown }).type === 'FOLDER') {
      continue;
    }
    if ('value' in item) {
      out[path] = (item as { value: unknown }).value;
    }
  }
  return out;
}

function deserializeLeva(values: Record<string, unknown>): void {
  // Only set paths that exist in the current store; ignore stale keys
  // from older scene files so we don't error out on schema drift.
  const data = levaStore.getData() as Record<string, unknown>;
  const filtered: Record<string, unknown> = {};
  for (const [path, value] of Object.entries(values)) {
    if (path in data) filtered[path] = value;
  }
  if (Object.keys(filtered).length > 0) {
    // Second arg is "fromPanel" — false flags the change as programmatic.
    levaStore.set(filtered, false);
  }
}

async function blobUrlToDataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.readAsDataURL(blob);
  });
}
