"use client";
import { useEffect, useRef } from "react";
import { evaluate } from "mathjs";
import type { SavedInstrument } from "../lib/instrument-store";
import type { TimelineClipData } from "./timeline-clip";

interface InstrumentWithClips {
  instrument: SavedInstrument;
  clips: TimelineClipData[];
}

interface CombinedGraphProps {
  instrumentsWithClips: InstrumentWithClips[];
  currentBeat: number;
  isPlaying: boolean;
  totalBeats: number;
}

const GRAPH_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
];

export function CombinedGraph({
  instrumentsWithClips,
  currentBeat,
  isPlaying,
  totalBeats,
}: CombinedGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const HzMin = 16.35;
  const HzMax = 7902.13;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const width = canvas.width;
    const height = canvas.height;

    // Draw background grid
    ctx.strokeStyle = "rgba(128, 128, 128, 0.1)";
    ctx.lineWidth = 1;

    for (let i = 0; i <= totalBeats; i++) {
      const x = (i / totalBeats) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      // Stronger line every 4 beats (measure)
      if (i % 4 === 0) {
        ctx.strokeStyle = "rgba(128, 128, 128, 0.3)";
      } else {
        ctx.strokeStyle = "rgba(128, 128, 128, 0.1)";
      }
      ctx.stroke();
    }

    // Horizontal grid lines
    ctx.strokeStyle = "rgba(128, 128, 128, 0.1)";
    for (let i = 0; i <= 4; i++) {
      const y = (i / 4) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    instrumentsWithClips.forEach(({ instrument, clips }, index) => {
      const color =
        instrument.color || GRAPH_COLORS[index % GRAPH_COLORS.length];

      // Draw each clip's waveform at its position
      clips.forEach((clip) => {
        const clipStartX = (clip.startBeat / totalBeats) * width;
        const clipEndX =
          ((clip.startBeat + clip.duration) / totalBeats) * width;
        const clipWidth = clipEndX - clipStartX;

        // Draw clip background
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.1;
        ctx.fillRect(clipStartX, 0, clipWidth, height);
        ctx.globalAlpha = 1;

        // Draw equation curve within clip bounds
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();

        let firstPoint = true;
        for (let beat = 0; beat < clip.duration; beat++) {
          const xPos = clipStartX + (beat / clip.duration) * clipWidth;

          // Check if this tick is enabled
          const isEnabled = instrument.enabledTicks
            ? instrument.enabledTicks[beat] !== false
            : true;

          const xValue = instrument.dX * beat + 1;
          try {
            let yVal = evaluate(instrument.equation, { x: xValue }) ?? 0;
            yVal = Math.min(Math.max(yVal, HzMin), HzMax);
            const normalizedY =
              Math.log(yVal / HzMin) / Math.log(HzMax / HzMin);
            const y = height - normalizedY * height * 0.9 - height * 0.05;

            if (firstPoint) {
              ctx.moveTo(xPos, y);
              firstPoint = false;
            } else {
              ctx.lineTo(xPos, y);
            }

            // Draw dot at tick position
            if (isEnabled) {
              ctx.save();
              ctx.fillStyle = color;
              ctx.globalAlpha = 0.9;
              ctx.beginPath();
              ctx.arc(xPos, y, 4, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            } else {
              // Hollow circle for disabled
              ctx.save();
              ctx.strokeStyle = color;
              ctx.globalAlpha = 0.4;
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.arc(xPos, y, 4, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
            }
          } catch {
            // Skip invalid points
          }
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      });
    });

    // Draw playhead if playing
    if (isPlaying) {
      const playheadX = (currentBeat / totalBeats) * width;
      ctx.strokeStyle = "rgba(239, 68, 68, 0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();

      // Playhead triangle at top
      ctx.fillStyle = "rgba(239, 68, 68, 0.9)";
      ctx.beginPath();
      ctx.moveTo(playheadX - 6, 0);
      ctx.lineTo(playheadX + 6, 0);
      ctx.lineTo(playheadX, 10);
      ctx.closePath();
      ctx.fill();
    }
  }, [instrumentsWithClips, currentBeat, isPlaying, totalBeats]);

  return (
    <div className="flex flex-col gap-2">
      <canvas
        ref={canvasRef}
        width={800}
        height={200}
        className="border border-border rounded-lg w-full bg-background"
      />
      {/* Legend */}
      {instrumentsWithClips.length > 0 && (
        <div className="flex flex-wrap gap-3 px-2">
          {instrumentsWithClips.map(({ instrument }, index) => (
            <div
              key={instrument.id}
              className="flex items-center gap-1.5 text-xs"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor:
                    instrument.color ||
                    GRAPH_COLORS[index % GRAPH_COLORS.length],
                }}
              />
              <span className="text-muted-foreground">
                {instrument.displayName || instrument.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
