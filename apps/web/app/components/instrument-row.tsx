"use client";

import type React from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import TimelineClip, { type TimelineClipData } from "./timeline-clip";

export type InstrumentRowData = {
  id: string;
  name: string;
  displayName?: string;
  color: string;
  clips: TimelineClipData[];
};

type InstrumentRowProps = {
  instrument: InstrumentRowData;
  beatWidth: number;
  totalBeats: number;
  onAddClip: (instrumentId: string, startBeat: number) => void;
  onMoveClip: (
    instrumentId: string,
    clipId: string,
    newStartBeat: number,
    newLane: number
  ) => void;
  onResizeClip: (
    instrumentId: string,
    clipId: string,
    newDuration: number
  ) => void;
  onDeleteClip: (instrumentId: string, clipId: string) => void;
  onRemoveInstrument: (instrumentId: string) => void;
};

const LANE_HEIGHT = 64;

const InstrumentRow: React.FC<InstrumentRowProps> = ({
  instrument,
  beatWidth,
  totalBeats,
  onAddClip,
  onMoveClip,
  onResizeClip,
  onDeleteClip,
  onRemoveInstrument,
}) => {
  const maxLane =
    instrument.clips.length > 0
      ? Math.max(...instrument.clips.map((c) => c.lane))
      : 0;
  const numLanes = maxLane + 1;
  const rowHeight = Math.max(LANE_HEIGHT, numLanes * LANE_HEIGHT);

  const handleRowDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickedBeat = Math.floor(clickX / beatWidth);

    onAddClip(instrument.id, clickedBeat);
  };

  return (
    <div className="flex border-b border-border">
      <div className="w-48 flex-shrink-0 bg-muted/50 border-r border-border p-3 flex items-center justify-between group">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-4 h-4 rounded flex-shrink-0"
            style={{ backgroundColor: instrument.color }}
          />
          <span className="font-medium text-sm truncate">
            {instrument.displayName || instrument.name}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link href={`/editor?id=${instrument.id}`}>
            <button
              className="p-1 text-muted-foreground hover:text-primary transition-colors"
              title="Edit instrument"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </Link>
          <button
            onClick={() => onRemoveInstrument(instrument.id)}
            className="text-muted-foreground hover:text-destructive transition-colors"
            title="Remove instrument"
          >
            ×
          </button>
        </div>
      </div>

      <div
        className="flex-1 relative bg-background"
        style={{ height: `${rowHeight}px` }}
        onDoubleClick={handleRowDoubleClick}
      >
        {Array.from({ length: numLanes }).map((_, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 border-b border-border/30"
            style={{ top: `${(i + 1) * LANE_HEIGHT}px` }}
          />
        ))}

        {instrument.clips.map((clip) => (
          <TimelineClip
            key={clip.id}
            clip={clip}
            beatWidth={beatWidth}
            laneHeight={LANE_HEIGHT}
            allClips={instrument.clips}
            onMove={(clipId, newStartBeat, newLane) =>
              onMoveClip(instrument.id, clipId, newStartBeat, newLane)
            }
            onResize={(clipId, newDuration) =>
              onResizeClip(instrument.id, clipId, newDuration)
            }
            onDelete={(clipId) => onDeleteClip(instrument.id, clipId)}
          />
        ))}
      </div>
    </div>
  );
};

export default InstrumentRow;
