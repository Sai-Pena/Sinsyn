"use client";

import type React from "react";

type TimelineRulerProps = {
  beatWidth: number;
  totalBeats: number;
  beatsPerMeasure?: number;
  showBeatTicks?: boolean;
};

const TimelineRuler: React.FC<TimelineRulerProps> = ({
  beatWidth,
  totalBeats,
  beatsPerMeasure = 4,
  showBeatTicks = true,
}) => {
  const measures = Array.from(
    { length: Math.ceil(totalBeats / beatsPerMeasure) },
    (_, i) => i
  );
  const beats = Array.from({ length: totalBeats }, (_, i) => i);

  return (
    <div className="sticky left-0 h-8 bg-muted/50 border-b border-border flex items-center text-xs font-medium text-muted-foreground">
      {/* Empty space for instrument label column */}
      <div className="w-48 flex-shrink-0 border-r border-border px-3">
        Timeline
      </div>

      {/* Measure markers */}
      <div className="flex-1 relative h-full">
        {showBeatTicks &&
          beats.map((beat) => (
            <div
              key={`beat-${beat}`}
              className="absolute top-0 bottom-0 w-px bg-border/40"
              style={{ left: `${beat * beatWidth}px` }}
            />
          ))}

        {measures.map((measure) => (
          <div
            key={measure}
            className="absolute top-0 bottom-0 flex items-center"
            style={{ left: `${measure * beatsPerMeasure * beatWidth}px` }}
          >
            <span className="pl-1">{measure + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineRuler;
