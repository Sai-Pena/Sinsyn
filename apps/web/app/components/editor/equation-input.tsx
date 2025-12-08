"use client";

import type React from "react";
import { Input } from "../../components/ui/input";
import Latex from "react-latex-next";
import { parse } from "mathjs";

interface EquationInputProps {
  value: string;
  currentEquation: string;
  onChange: (value: string) => void;
  onApply: () => void;
}

export function EquationInput({
  value,
  currentEquation,
  onChange,
  onApply,
}: EquationInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onApply();
    }
  };

  let latexString = "";
  try {
    latexString = parse(currentEquation).toTex();
  } catch {
    latexString = currentEquation;
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Equation</label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter equation"
      />
      <div className="p-4 bg-muted rounded-lg overflow-x-auto">
        <Latex
          delimiters={[
            { left: "$$", right: "$$", display: true },
            { left: "$$", right: "$$", display: false },
            { left: "$", right: "$", display: false },
            { left: "\\[", right: "\\]", display: true },
          ]}
        >
          $${latexString}$$
        </Latex>
      </div>
    </div>
  );
}
