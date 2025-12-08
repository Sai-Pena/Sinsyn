"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Note } from "tonal";
import { evaluate } from "mathjs";
import Soundfont from "soundfont-player";
import { useInstrumentStore } from "../lib/instrument-store";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import Link from "next/link";
import { EquationGraph } from "../components/editor/equation-graph";
import {
  InstrumentSelector,
  Instruments,
} from "../components/editor/instrument-selector";
import { EquationInput } from "../components/editor/equation-input";
import { ParameterControls } from "../components/editor/parameter-controls";
import { TickSequencer } from "../components/editor/tick-sequencer";

export default function EditorPage() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [isAudioStarted, setIsAudioStarted] = useState(false);
  const acRef = useRef<AudioContext | null>(null);
  const loopRef = useRef<number | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [currentEquation, setCurrentEquation] = useState<string>(
    "(sin(x/30)*500) + log(x+1) * 200 + ((x/20)^3)/100"
  );
  const [inputEquation, setInputEquation] = useState(currentEquation);
  const [selectedInstrument, setSelectedInstrument] =
    useState<string>("clavinet");

  const domainL = 1;
  const domainR = 500;
  const [dX, setDX] = useState(45);
  const [dT, setDT] = useState(220);
  const [showBeatTicks, setShowBeatTicks] = useState(true);
  const [enabledTicks, setEnabledTicks] = useState<boolean[]>([]);

  const HzMin = 16.35;
  const HzMax = 7902.13;

  const [xValue, setXValue] = useState(domainL);
  const xRef = useRef(domainL);
  const tickIndexRef = useRef(0);

  const [editingId, setEditingId] = useState<string | null>(null);

  const { instruments, addInstrument, updateInstrument, getInstrumentById } =
    useInstrumentStore();

  useEffect(() => {
    const tickCount = Math.floor((domainR - domainL) / dX) + 1;
    setEnabledTicks((prev) => {
      if (prev.length === tickCount) return prev;
      // Preserve existing values, extend with true for new ticks
      const newTicks = Array(tickCount).fill(true);
      for (let i = 0; i < Math.min(prev.length, tickCount); i++) {
        newTicks[i] = prev[i];
      }
      return newTicks;
    });
  }, [dX, domainL, domainR]);

  useEffect(() => {
    if (editId) {
      const inst = getInstrumentById(editId);
      if (inst) {
        setEditingId(inst.id);
        setDisplayName(inst.displayName);
        setSelectedInstrument(inst.instrumentName);
        setCurrentEquation(inst.equation);
        setInputEquation(inst.equation);
        setDX(inst.dX);
        setDT(inst.dT);
        setEnabledTicks(inst.enabledTicks || []);
      }
    }
  }, [editId, getInstrumentById]);

  const handleToggleTick = (index: number) => {
    setEnabledTicks((prev) => {
      const newTicks = [...prev];
      newTicks[index] = !newTicks[index];
      return newTicks;
    });
  };

  const startAudioContext = () => {
    if (!acRef.current) {
      acRef.current = new AudioContext();
    }
    acRef.current.resume().then(() => {
      setIsAudioStarted(true);
    });
  };

  async function playInstrumentNote(
    frequency: number,
    instrumentPlayer: Soundfont.Player
  ) {
    try {
      frequency = Math.min(Math.max(frequency, HzMin), HzMax);
      instrumentPlayer.play(Note.fromFreq(frequency));
    } catch (error) {
      console.error("playInstrumentNote error:", error);
    }
  }

  const startLoop = async () => {
    if (loopRef.current) return;

    if (!Instruments[selectedInstrument]) {
      console.error("Instrument not found");
      return;
    }

    if (!acRef.current) {
      console.error("AudioContext not initialized");
      return;
    }

    tickIndexRef.current = 0;
    xRef.current = domainL;

    Soundfont.instrument(acRef.current, selectedInstrument).then(
      (inst: Soundfont.Player) => {
        loopRef.current = window.setInterval(() => {
          if (!acRef.current) return;

          if (enabledTicks[tickIndexRef.current] !== false) {
            const result = evaluate(currentEquation, { x: xRef.current });
            const frequency = Math.ceil(Math.abs(result));
            playInstrumentNote(frequency, inst);
          }

          xRef.current += dX;
          tickIndexRef.current++;

          if (xRef.current > domainR) {
            xRef.current = domainL;
            tickIndexRef.current = 0;
          }

          setXValue(xRef.current);
        }, dT);
      }
    );
  };

  const stopLoop = () => {
    if (loopRef.current) {
      clearInterval(loopRef.current);
      loopRef.current = null;
    }
  };

  const handleSaveInstrument = () => {
    const { soundfont } = Instruments[selectedInstrument];
    const colors = [
      "#ef4444",
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#8b5cf6",
      "#ec4899",
      "#06b6d4",
      "#84cc16",
    ];
    const finalName = displayName.trim() || selectedInstrument;

    if (editingId) {
      updateInstrument(editingId, {
        name: selectedInstrument,
        displayName: finalName,
        equation: currentEquation,
        dX,
        dT,
        instrumentName: selectedInstrument,
        soundfont,
        enabledTicks,
      });
    } else {
      addInstrument({
        id: Date.now().toString(),
        name: selectedInstrument,
        displayName: finalName,
        equation: currentEquation,
        dX,
        dT,
        instrumentName: selectedInstrument,
        soundfont,
        color: colors[Math.floor(Math.random() * colors.length)],
        enabledTicks,
      });
    }

    // Reset form after saving
    handleCancelEdit();
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDisplayName("");
    setSelectedInstrument("clavinet");
    setCurrentEquation("(sin(x/30)*500) + log(x+1) * 200 + ((x/20)^3)/100");
    setInputEquation("(sin(x/30)*500) + log(x+1) * 200 + ((x/20)^3)/100");
    setDX(45);
    setDT(220);
    setEnabledTicks([]);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold">SINESTH Editor</h1>
          <Link href="/timeline">
            <Button variant="outline">Back to Timeline</Button>
          </Link>
        </div>

        {!isAudioStarted && (
          <Button onClick={startAudioContext} size="lg" className="w-full">
            Start Audio
          </Button>
        )}

        {isAudioStarted && (
          <div className="space-y-6">
            {editingId && (
              <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <span className="text-sm font-medium text-amber-600">
                  Editing: {displayName || selectedInstrument}
                </span>
                <Link href="/editor">
                  <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                </Link>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={startLoop}>Start Loop</Button>
              <Button onClick={stopLoop} variant="outline">
                Stop Loop
              </Button>
              <Button
                onClick={handleSaveInstrument}
                variant="default"
                className="ml-auto"
              >
                {editingId ? "Update Instrument" : "Save to Timeline"}
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Instrument Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter a custom name for this instrument..."
              />
            </div>

            <InstrumentSelector
              value={selectedInstrument}
              onChange={setSelectedInstrument}
            />

            <EquationInput
              value={inputEquation}
              currentEquation={currentEquation}
              onChange={setInputEquation}
              onApply={() => setCurrentEquation(inputEquation)}
            />

            <div className="text-center text-lg font-semibold">
              Current x: {xValue.toFixed(2)}
            </div>

            <EquationGraph
              equation={currentEquation}
              dX={dX}
              xValue={xValue}
              showBeatTicks={showBeatTicks}
              enabledTicks={enabledTicks}
              onTickToggle={handleToggleTick}
            />

            <ParameterControls
              dX={dX}
              dT={dT}
              showBeatTicks={showBeatTicks}
              onDXChange={setDX}
              onDTChange={setDT}
              onShowBeatTicksChange={setShowBeatTicks}
            />

            <TickSequencer
              enabledTicks={enabledTicks}
              onToggleTick={handleToggleTick}
              dX={dX}
              domainL={domainL}
              domainR={domainR}
            />
          </div>
        )}
      </div>
    </div>
  );
}
