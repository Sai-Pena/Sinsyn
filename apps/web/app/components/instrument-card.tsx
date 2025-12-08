"use client";

import type React from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

type InstrumentCardProps = {
  title: string;
  description?: string;
  imageUrl?: string;
  onClick?: () => void;
  className?: string;
};

const InstrumentCard: React.FC<InstrumentCardProps> = ({
  title,
  description,
  imageUrl,
  onClick,
  className,
}) => {
  return (
    <Card
      className={`w-[150px] h-[150px] cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${className}`}
      onClick={onClick}
    >
      <CardHeader className="p-3 space-y-1">
        {imageUrl && (
          <div className="w-full h-12 mb-2 rounded-md overflow-hidden bg-muted">
            <img
              src={imageUrl || "/placeholder.svg"}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardTitle className="text-sm leading-tight line-clamp-2">
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-xs line-clamp-2">
            {description}
          </CardDescription>
        )}
      </CardHeader>
    </Card>
  );
};

export default InstrumentCard;
