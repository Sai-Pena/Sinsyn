"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import MusyngKiteNames from "../../instruments/MusyngKite.json";
import FluidR3Names from "../../instruments/FluidR3_GM.json";
import FatBoyNames from "../../instruments/FatBoy.json";
import TablaNames from "../../instruments/Tabla.json";

export interface InstrumentInfo {
  soundfont: string;
}

export const Instruments: Record<string, InstrumentInfo> = (() => {
  const sourceMap: Record<string, unknown> = {
    MusyngKite: MusyngKiteNames as unknown,
    FluidR3_GM: FluidR3Names as unknown,
    FatBoy: FatBoyNames as unknown,
    Tabla: TablaNames as unknown,
  };

  const out: Record<string, InstrumentInfo> = {};

  Object.entries(sourceMap).forEach(([soundfont, names]) => {
    if (Array.isArray(names)) {
      names.forEach((instrumentName) => {
        if (typeof instrumentName === "string") {
          out[instrumentName] = { soundfont };
        }
      });
    } else if (typeof names === "object" && names !== null) {
      Object.keys(names as Record<string, string>).forEach((instrumentKey) => {
        out[instrumentKey] = { soundfont };
      });
    }
  });

  return out;
})();

interface InstrumentSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function InstrumentSelector({
  value,
  onChange,
}: InstrumentSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Instrument</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {Object.keys(Instruments).map((inst) => (
            <SelectItem key={inst} value={inst}>
              {inst}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
