"use client";

import { cn } from "../../lib/utils/cn";

interface TickSequencerProps {
  enabledTicks: boolean[];
  onToggleTick: (index: number) => void;
  dX: number;
  domainL?: number;
  domainR?: number;
}

export function TickSequencer({
  enabledTicks,
  onToggleTick,
  dX,
  domainL = 1,
  domainR = 500,
}: TickSequencerProps) {
  const tickCount = Math.floor((domainR - domainL) / dX) + 1;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Tick Sequencer</label>
        <span className="text-xs text-muted-foreground">{tickCount} ticks</span>
      </div>
      <div className="flex flex-wrap gap-1 p-3 bg-muted/30 rounded-lg border border-border">
        {Array.from({ length: tickCount }).map((_, index) => {
          const isEnabled = enabledTicks[index] ?? true;
          return (
            <button
              key={index}
              onClick={() => onToggleTick(index)}
              className={cn(
                "w-8 h-8 rounded text-xs font-medium transition-all border-2",
                isEnabled
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-transparent text-muted-foreground border-muted-foreground/30 hover:border-muted-foreground/50"
              )}
              title={`Tick ${index + 1}: ${isEnabled ? "Enabled" : "Disabled"}`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Click ticks to enable/disable. Enabled ticks (filled) play notes,
        disabled ticks (hollow) are silent.
      </p>
    </div>
  );
}
