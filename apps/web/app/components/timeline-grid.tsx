"use client";

import type React from "react";

type TimelineGridProps = {
  beatWidth: number;
  totalBeats: number;
  beatsPerMeasure?: number;
};

const TimelineGrid: React.FC<TimelineGridProps> = ({
  beatWidth,
  totalBeats,
  beatsPerMeasure = 4,
}) => {
  const beats = Array.from({ length: totalBeats }, (_, i) => i);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {beats.map((beat) => {
        const isMeasureStart = beat % beatsPerMeasure === 0;
        return (
          <div
            key={beat}
            className="absolute top-0 bottom-0"
            style={{
              left: `${beat * beatWidth}px`,
              width: "1px",
              backgroundColor: isMeasureStart
                ? "hsl(var(--border))"
                : "hsl(var(--border) / 0.3)",
            }}
          />
        );
      })}
    </div>
  );
};

export default TimelineGrid;
