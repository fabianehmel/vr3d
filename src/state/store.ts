import { create } from 'zustand';

export type Blending = 'normal' | 'additive';

export type ImageSpriteData = {
  id: string;
  url: string; // http(s):// or blob:
  name: string;
  position: [number, number, number];
  scale: number;
  rotation: [number, number, number]; // Euler XYZ, radians
  opacity: number;
  blending: Blending;
};

type Store = {
  sprites: ImageSpriteData[];
  addSprite: (init: { url: string; name: string }) => void;
  removeSprite: (id: string) => void;
  updateSprite: (id: string, patch: Partial<Omit<ImageSpriteData, 'id'>>) => void;
  replaceSprites: (sprites: ImageSpriteData[]) => void;
};

export const useStore = create<Store>((set) => ({
  sprites: [],
  addSprite: ({ url, name }) =>
    set((state) => ({
      sprites: [
        ...state.sprites,
        {
          id: crypto.randomUUID(),
          url,
          name,
          position: randomInSphere(1.0),
          scale: 0.5,
          rotation: [0, 0, 0],
          opacity: 1,
          blending: 'normal',
        },
      ],
    })),
  removeSprite: (id) =>
    set((state) => {
      const target = state.sprites.find((s) => s.id === id);
      if (target?.url.startsWith('blob:')) {
        URL.revokeObjectURL(target.url);
      }
      return { sprites: state.sprites.filter((s) => s.id !== id) };
    }),
  updateSprite: (id, patch) =>
    set((state) => ({
      sprites: state.sprites.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    })),
  replaceSprites: (sprites) =>
    set((state) => {
      for (const s of state.sprites) {
        if (s.url.startsWith('blob:')) URL.revokeObjectURL(s.url);
      }
      return { sprites };
    }),
}));

function randomInSphere(radius: number): [number, number, number] {
  const r = radius * Math.cbrt(Math.random());
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  return [
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi),
  ];
}
