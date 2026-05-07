import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings } from '../types';
import { fetchSettings, updateSettings } from '../api/client';

interface SettingsStore {
  settings: Settings;
  loaded: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<Settings>) => Promise<void>;
}

const DEFAULT_SETTINGS: Settings = {
  id: 'default',
  lernrichtung: 'jp_to_de',
  frontShowHiragana: true,
  frontShowKanji: false,
  frontShowRomaji: false,
  frontShowExampleJp: false,
  showExampleSentence: true,
  newWordsPerDay: 20,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      loaded: false,
      load: async () => {
        try {
          const s = await fetchSettings();
          set({ settings: s, loaded: true });
        } catch {
          set({ loaded: true });
        }
      },
      update: async (patch) => {
        const optimistic = { ...get().settings, ...patch };
        set({ settings: optimistic });
        try {
          const updated = await updateSettings(patch);
          set({ settings: updated });
        } catch {
          // revert on error
          set({ settings: get().settings });
        }
      },
    }),
    {
      name: 'jp-voc-settings',
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);
