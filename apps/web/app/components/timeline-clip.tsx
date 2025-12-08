"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";

export type TimelineClipData = {
  id: string;
  startBeat: number;
  duration: number;
  instrumentName: string;
  color?: string;
  lane: number;
};

type TimelineClipProps = {
  clip: TimelineClipData;
  beatWidth: number;
  laneHeight: number;
  allClips: TimelineClipData[];
  onMove: (id: string, newStartBeat: number, newLane: number) => void;
  onResize: (id: string, newDuration: number) => void;
  onDelete: (id: string) => void;
};

const TimelineClip: React.FC<TimelineClipProps> = ({
  clip,
  beatWidth,
  laneHeight,
  allClips,
  onMove,
  onResize,
  onDelete,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const dragStartBeat = useRef(0);
  const dragStartLane = useRef(0);
  const dragStartDuration = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartY.current = e.clientY;
    dragStartBeat.current = clip.startBeat;
    dragStartLane.current = clip.lane;
  };

  const handleResizeLeftMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizingLeft(true);
    dragStartX.current = e.clientX;
    dragStartBeat.current = clip.startBeat;
    dragStartDuration.current = clip.duration;
  };

  const handleResizeRightMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizingRight(true);
    dragStartX.current = e.clientX;
    dragStartDuration.current = clip.duration;
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onDelete(clip.id);
  };

  const checkCollision = (
    startBeat: number,
    duration: number,
    lane: number
  ): boolean => {
    const endBeat = startBeat + duration;

    // Check all clips in the same lane (excluding current clip)
    for (const otherClip of allClips) {
      if (otherClip.id === clip.id || otherClip.lane !== lane) continue;

      const otherEnd = otherClip.startBeat + otherClip.duration;

      // Check if ranges overlap
      if (startBeat < otherEnd && endBeat > otherClip.startBeat) {
        return true; // Collision detected
      }
    }

    return false; // No collision
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStartX.current;
        const deltaBeats = Math.round(deltaX / beatWidth);
        const newStartBeat = Math.max(0, dragStartBeat.current + deltaBeats);

        const deltaY = e.clientY - dragStartY.current;
        const deltaLanes = Math.round(deltaY / laneHeight);
        const newLane = Math.max(0, dragStartLane.current + deltaLanes);

        if (!checkCollision(newStartBeat, clip.duration, newLane)) {
          onMove(clip.id, newStartBeat, newLane);
        }
      } else if (isResizingLeft) {
        const deltaX = e.clientX - dragStartX.current;
        const deltaBeats = Math.round(deltaX / beatWidth);
        const newStartBeat = Math.max(0, dragStartBeat.current + deltaBeats);
        const newDuration = Math.max(1, dragStartDuration.current - deltaBeats);

        if (
          newDuration >= 1 &&
          newStartBeat !== clip.startBeat &&
          !checkCollision(newStartBeat, newDuration, clip.lane)
        ) {
          onMove(clip.id, newStartBeat, clip.lane);
          onResize(clip.id, newDuration);
        }
      } else if (isResizingRight) {
        const deltaX = e.clientX - dragStartX.current;
        const deltaBeats = Math.round(deltaX / beatWidth);
        const newDuration = Math.max(1, dragStartDuration.current + deltaBeats);

        if (!checkCollision(clip.startBeat, newDuration, clip.lane)) {
          onResize(clip.id, newDuration);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizingLeft(false);
      setIsResizingRight(false);
    };

    if (isDragging || isResizingLeft || isResizingRight) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [
    isDragging,
    isResizingLeft,
    isResizingRight,
    beatWidth,
    laneHeight,
    clip,
    allClips,
    onMove,
    onResize,
  ]);

  const clipColor = clip.color || "#3b82f6";

  return (
    <div
      className="absolute rounded cursor-move select-none group"
      style={{
        left: `${clip.startBeat * beatWidth}px`,
        top: `${clip.lane * laneHeight + 4}px`,
        width: `${clip.duration * beatWidth}px`,
        height: `${laneHeight - 8}px`,
        backgroundColor: clipColor,
        border: "1px solid rgba(0,0,0,0.2)",
      }}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={handleResizeLeftMouseDown}
      />

      <div className="px-2 py-1 text-xs font-medium text-white truncate pointer-events-none">
        {clip.instrumentName}
      </div>

      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={handleResizeRightMouseDown}
      />
    </div>
  );
};

export default TimelineClip;
