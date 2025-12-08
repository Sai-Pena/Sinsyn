"use client";

import { Slider } from "../../components/ui/slider";
import { Checkbox } from "../../components/ui/checkbox";

interface ParameterControlsProps {
  dX: number;
  dT: number;
  showBeatTicks: boolean;
  onDXChange: (value: number) => void;
  onDTChange: (value: number) => void;
  onShowBeatTicksChange: (value: boolean) => void;
}

export function ParameterControls({
  dX,
  dT,
  showBeatTicks,
  onDXChange,
  onDTChange,
  onShowBeatTicksChange,
}: ParameterControlsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">dX: {dX}</label>
        <Slider
          value={[dX]}
          onValueChange={(values) => onDXChange(values[0])}
          min={1}
          max={50}
          step={1}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">dT (ms): {dT}</label>
        <Slider
          value={[dT]}
          onValueChange={(values) => onDTChange(values[0])}
          min={10}
          max={1000}
          step={10}
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="showBeatTicks"
          checked={showBeatTicks}
          onCheckedChange={(checked) => onShowBeatTicksChange(checked === true)}
        />
        <label
          htmlFor="showBeatTicks"
          className="text-sm font-medium cursor-pointer"
        >
          Show Beat Ticks
        </label>
      </div>
    </div>
  );
}
