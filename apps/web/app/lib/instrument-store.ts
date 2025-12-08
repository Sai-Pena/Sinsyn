"use client";

import { create } from "zustand";
import type { TimelineClipData } from "../components/timeline-clip";

export interface InstrumentConfig {
  id: string;
  name: string;
  displayName: string;
  equation: string;
  dX: number;
  dT: number;
  instrumentName: string;
  soundfont: string;
  color: string;
  enabledTicks: boolean[];
}

export interface TimelineData {
  instrumentId: string;
  clips: TimelineClipData[];
}

interface InstrumentStore {
  instruments: InstrumentConfig[];
  bpm: number;
  timelineData: TimelineData[];
  projectName: string;
  addInstrument: (instrument: InstrumentConfig) => void;
  updateInstrument: (id: string, updates: Partial<InstrumentConfig>) => void;
  removeInstrument: (id: string) => void;
  setBPM: (bpm: number) => void;
  setProjectName: (name: string) => void;
  saveTimeline: (data: TimelineData[]) => void;
  getTimelineForInstrument: (instrumentId: string) => TimelineClipData[];
  getInstrumentById: (id: string) => InstrumentConfig | undefined;
  clearAll: () => void;
}

export const useInstrumentStore = create<InstrumentStore>()((set, get) => ({
  instruments: [],
  bpm: 120,
  timelineData: [],
  projectName: "",
  addInstrument: (instrument) =>
    set((state) => ({
      instruments: [...state.instruments, instrument],
    })),
  updateInstrument: (id, updates) =>
    set((state) => ({
      instruments: state.instruments.map((inst) =>
        inst.id === id ? { ...inst, ...updates } : inst
      ),
    })),
  removeInstrument: (id) =>
    set((state) => ({
      instruments: state.instruments.filter((inst) => inst.id !== id),
      timelineData: state.timelineData.filter((t) => t.instrumentId !== id),
    })),
  setBPM: (bpm) => set({ bpm }),
  setProjectName: (name) => set({ projectName: name }),
  saveTimeline: (data) => set({ timelineData: data }),
  getTimelineForInstrument: (instrumentId) => {
    const timeline = get().timelineData.find(
      (t) => t.instrumentId === instrumentId
    );
    return timeline?.clips || [];
  },
  getInstrumentById: (id) => get().instruments.find((inst) => inst.id === id),
  clearAll: () =>
    set({ instruments: [], timelineData: [], bpm: 120, projectName: "" }),
}));
