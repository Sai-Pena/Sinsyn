"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import InstrumentRow, { type InstrumentRowData } from "./instrument-row";
import TimelineGrid from "./timeline-grid";
import TimelineRuler from "./timeline-ruler";
import type { TimelineClipData } from "./timeline-clip";
import { useInstrumentStore } from "../lib/instrument-store";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Input } from "./ui/input";
import Link from "next/link";
import { Note } from "tonal";
import { evaluate } from "mathjs";
import Soundfont from "soundfont-player";
import { Plus, Download, Upload, ChevronDown, ChevronUp } from "lucide-react";
import { CombinedGraph } from "./combined-graph";

const BEAT_WIDTH = 40;
const TOTAL_BEATS = 64;
const BEATS_PER_MEASURE = 4;

const TimelineContainer: React.FC = () => {
  const {
    instruments: savedInstruments,
    bpm,
    setBPM,
    timelineData,
    saveTimeline,
    projectName,
    setProjectName,
    removeInstrument: removeInstrumentFromStore,
  } = useInstrumentStore();
  const store = useInstrumentStore();

  const [instruments, setInstruments] = useState<InstrumentRowData[]>([]);
  const initialLoadRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const acRef = useRef<AudioContext | null>(null);
  const playbackIntervalRef = useRef<number | null>(null);
  const instrumentPlayersRef = useRef<Map<string, Soundfont.Player>>(new Map());

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isTimelineCollapsed, setIsTimelineCollapsed] = useState(false);

  useEffect(() => {
    const newInstruments = savedInstruments.map((inst) => {
      const existing = instruments.find((i) => i.id === inst.id);
      if (existing) {
        return {
          ...existing,
          name: inst.name,
          displayName: inst.displayName,
          color: inst.color,
        };
      }
      const savedClips =
        timelineData.find((t) => t.instrumentId === inst.id)?.clips || [];
      return {
        id: inst.id,
        name: inst.name,
        displayName: inst.displayName,
        color: inst.color,
        clips: savedClips,
      };
    });
    const filteredInstruments = newInstruments.filter((inst) =>
      savedInstruments.some((s) => s.id === inst.id)
    );
    setInstruments(filteredInstruments);
  }, [savedInstruments, timelineData]);

  const saveTimelineDebounced = useCallback(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      return;
    }
    const data = instruments.map((inst) => ({
      instrumentId: inst.id,
      clips: inst.clips,
    }));
    saveTimeline(data);
  }, [instruments, saveTimeline]);

  useEffect(() => {
    const timeoutId = setTimeout(saveTimelineDebounced, 100);
    return () => clearTimeout(timeoutId);
  }, [saveTimelineDebounced]);

  const initAudioContext = async () => {
    if (!acRef.current) {
      acRef.current = new AudioContext();
    }
    await acRef.current.resume();

    for (const inst of savedInstruments) {
      if (!instrumentPlayersRef.current.has(inst.id)) {
        const player = await Soundfont.instrument(
          acRef.current!,
          inst.instrumentName as any
        );
        instrumentPlayersRef.current.set(inst.id, player);
      }
    }
  };

  const playInstruments = async (beat: number) => {
    for (const instrument of instruments) {
      const savedInst = savedInstruments.find((s) => s.id === instrument.id);
      if (!savedInst) continue;

      const activeClips = instrument.clips.filter(
        (clip) =>
          beat >= clip.startBeat && beat < clip.startBeat + clip.duration
      );

      for (const clip of activeClips) {
        const player = instrumentPlayersRef.current.get(instrument.id);
        if (!player) continue;

        const beatInClip = beat - clip.startBeat;

        if (
          savedInst.enabledTicks &&
          savedInst.enabledTicks[beatInClip] === false
        ) {
          continue;
        }

        const xValue = savedInst.dX * beatInClip + 1;

        try {
          const result = evaluate(savedInst.equation, { x: xValue });
          const frequency = Math.ceil(Math.abs(result));
          const clampedFreq = Math.min(Math.max(frequency, 16.35), 7902.13);

          player.play(Note.fromFreq(clampedFreq));
        } catch (error) {
          console.error("Error playing note:", error);
        }
      }
    }
  };

  const togglePlayback = async () => {
    if (!isPlaying) {
      await initAudioContext();

      const beatDuration = (60 / bpm) * 1000;

      playbackIntervalRef.current = window.setInterval(() => {
        setCurrentBeat((prev) => {
          const nextBeat = (prev + 1) % TOTAL_BEATS;
          playInstruments(nextBeat);
          return nextBeat;
        });
      }, beatDuration);

      setIsPlaying(true);
    } else {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
        playbackIntervalRef.current = null;
      }
      setIsPlaying(false);
      setCurrentBeat(0);
    }
  };

  const handleExport = () => {
    const projectData = {
      version: 1,
      name: projectName || "Untitled Project",
      bpm: store.bpm,
      instruments: store.instruments,
      timeline: store.timelineData,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const filename = projectName
      ? `${projectName.toLowerCase().replace(/\s+/g, "-")}.json`
      : `sinesth-${Date.now()}.json`;
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const projectData = JSON.parse(content);

        if (
          !projectData.instruments ||
          !Array.isArray(projectData.instruments)
        ) {
          alert("Invalid project file: missing instruments data");
          return;
        }

        store.clearAll();

        if (projectData.name) {
          store.setProjectName(projectData.name);
        }

        projectData.instruments.forEach((inst: any) => {
          store.addInstrument(inst);
        });

        if (projectData.bpm) {
          store.setBPM(projectData.bpm);
        }

        if (projectData.timeline) {
          store.saveTimeline(projectData.timeline);
        }

        initialLoadRef.current = false;

        alert("Project imported successfully!");
      } catch (error) {
        console.error("Import error:", error);
        alert("Failed to import project. Please check the file format.");
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const findAvailableLane = (
    instrumentId: string,
    startBeat: number,
    duration: number
  ): number => {
    const instrument = instruments.find((i) => i.id === instrumentId);
    if (!instrument) return 0;

    const endBeat = startBeat + duration;

    for (let lane = 0; lane < 100; lane++) {
      const hasOverlap = instrument.clips.some((clip) => {
        if (clip.lane !== lane) return false;
        const clipEnd = clip.startBeat + clip.duration;
        return !(endBeat <= clip.startBeat || startBeat >= clipEnd);
      });

      if (!hasOverlap) return lane;
    }

    return 0;
  };

  const handleAddClip = (instrumentId: string, startBeat: number) => {
    setInstruments(
      instruments.map((inst) => {
        if (inst.id === instrumentId) {
          const lane = findAvailableLane(instrumentId, startBeat, 4);
          const newClip: TimelineClipData = {
            id: Date.now().toString(),
            startBeat,
            duration: 4,
            instrumentName: inst.name,
            color: inst.color,
            lane,
          };
          return { ...inst, clips: [...inst.clips, newClip] };
        }
        return inst;
      })
    );
  };

  const handleMoveClip = (
    instrumentId: string,
    clipId: string,
    newStartBeat: number,
    newLane: number
  ) => {
    setInstruments(
      instruments.map((inst) => {
        if (inst.id === instrumentId) {
          return {
            ...inst,
            clips: inst.clips.map((clip) =>
              clip.id === clipId
                ? { ...clip, startBeat: newStartBeat, lane: newLane }
                : clip
            ),
          };
        }
        return inst;
      })
    );
  };

  const handleResizeClip = (
    instrumentId: string,
    clipId: string,
    newDuration: number
  ) => {
    setInstruments(
      instruments.map((inst) => {
        if (inst.id === instrumentId) {
          return {
            ...inst,
            clips: inst.clips.map((clip) =>
              clip.id === clipId ? { ...clip, duration: newDuration } : clip
            ),
          };
        }
        return inst;
      })
    );
  };

  const handleDeleteClip = (instrumentId: string, clipId: string) => {
    setInstruments(
      instruments.map((inst) => {
        if (inst.id === instrumentId) {
          return {
            ...inst,
            clips: inst.clips.filter((clip) => clip.id !== clipId),
          };
        }
        return inst;
      })
    );
  };

  const handleRemoveInstrument = (instrumentId: string) => {
    removeInstrumentFromStore(instrumentId);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex items-center justify-between p-4 border-b border-border gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Timeline Editor</h1>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium whitespace-nowrap">
            Project:
          </span>
          <Input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Untitled Project"
            className="w-48"
          />
        </div>

        <div className="flex items-center gap-4 flex-1 max-w-md">
          <span className="text-sm font-medium whitespace-nowrap">
            BPM: {bpm}
          </span>
          <Slider
            value={[bpm ?? 120]}
            onValueChange={(values) => {
              const newBpm = values[0];
              if (typeof newBpm === "number") setBPM(newBpm);
            }}
            min={60}
            max={400}
            step={1}
            className="flex-1"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={togglePlayback}
            variant={isPlaying ? "destructive" : "default"}
          >
            {isPlaying ? "Stop" : "Play"}
          </Button>
          <Button
            onClick={handleExport}
            variant="outline"
            title="Export Project"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            title="Import Project"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <Link href="/editor">
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              New Instrument
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <button
          onClick={() => setIsTimelineCollapsed(!isTimelineCollapsed)}
          className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border hover:bg-muted transition-colors"
        >
          <span className="text-sm font-medium">Timeline Tracks</span>
          {isTimelineCollapsed ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </button>

        <div
          className={`overflow-auto transition-all duration-300 ${
            isTimelineCollapsed ? "h-0 overflow-hidden" : "flex-1"
          }`}
        >
          <div className="min-w-max">
            <TimelineRuler
              beatWidth={BEAT_WIDTH}
              totalBeats={TOTAL_BEATS}
              beatsPerMeasure={BEATS_PER_MEASURE}
              showBeatTicks={true}
            />

            <div className="relative">
              <div className="absolute top-0 left-48 right-0 bottom-0">
                <TimelineGrid
                  beatWidth={BEAT_WIDTH}
                  totalBeats={TOTAL_BEATS}
                  beatsPerMeasure={BEATS_PER_MEASURE}
                />
              </div>

              {isPlaying && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-50 pointer-events-none"
                  style={{
                    left: `${192 + currentBeat * BEAT_WIDTH}px`,
                    transition: "left 0.1s linear",
                  }}
                />
              )}

              {instruments.map((instrument) => (
                <InstrumentRow
                  key={instrument.id}
                  instrument={instrument}
                  beatWidth={BEAT_WIDTH}
                  totalBeats={TOTAL_BEATS}
                  onAddClip={handleAddClip}
                  onMoveClip={handleMoveClip}
                  onResizeClip={handleResizeClip}
                  onDeleteClip={handleDeleteClip}
                  onRemoveInstrument={handleRemoveInstrument}
                />
              ))}

              {instruments.length === 0 && (
                <div className="p-12 text-center text-muted-foreground">
                  <p className="text-lg mb-2">No instruments yet</p>
                  <p className="text-sm mb-4">
                    Create your first instrument to start composing
                  </p>
                  <Link href="/editor">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Instrument
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-border p-4 bg-muted/20">
          <h3 className="text-sm font-medium mb-3">Combined Waveforms</h3>
          <CombinedGraph
            instrumentsWithClips={instruments
              .map((inst) => ({
                instrument: savedInstruments.find((s) => s.id === inst.id)!,
                clips: inst.clips,
              }))
              .filter((item) => item.instrument)}
            currentBeat={currentBeat}
            isPlaying={isPlaying}
            totalBeats={TOTAL_BEATS}
          />
        </div>
      </div>

      <div className="p-3 border-t border-border bg-muted/30 text-xs text-muted-foreground">
        <strong>Instructions:</strong> Double-click on a track to add a clip |
        Drag clips horizontally or vertically to move between lanes | Drag edges
        to resize | Right-click to delete | Hover on instrument name to edit or
        remove | Click "Timeline Tracks" to collapse/expand
      </div>
    </div>
  );
};

export default TimelineContainer;
