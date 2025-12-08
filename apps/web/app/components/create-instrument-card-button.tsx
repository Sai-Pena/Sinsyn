"use client";

import type React from "react";

type CreateInstrumentCardButtonProps = {
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

const CreateInstrumentCardButton: React.FC<CreateInstrumentCardButtonProps> = ({
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="w-[150px] h-[150px] flex justify-center items-center border-2 border-dashed border-border rounded-lg bg-card hover:bg-accent hover:border-accent-foreground/20 transition-colors cursor-pointer group"
    >
      <span className="text-5xl font-bold text-muted-foreground group-hover:text-accent-foreground transition-colors">
        ＋
      </span>
    </button>
  );
};

export default CreateInstrumentCardButton;
