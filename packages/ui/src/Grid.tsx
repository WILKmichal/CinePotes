"use client";
import React from "react";

export interface GridProps {
  readonly children: React.ReactNode;
  readonly cols?: 1 | 2 | 3 | 4 | 5 | 10;
  readonly gap?: 2 | 3 | 4 | 6;
  readonly className?: string;
}

const colsStyles: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-5 md:grid-cols-10",
  10: "grid-cols-5 md:grid-cols-10",
};

const gapStyles: Record<number, string> = {
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  6: "gap-6",
};

export const Grid = ({
  children,
  cols = 3,
  gap = 4,
  className = "",
}: GridProps) => {
  return (
    <div className={`grid ${colsStyles[cols]} ${gapStyles[gap]} ${className}`}>
      {children}
    </div>
  );
};
