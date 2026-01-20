"use client";
import React from "react";

export interface SectionProps {
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly background?: "white" | "transparent";
  readonly padding?: "sm" | "md" | "lg";
}

const backgroundStyles = {
  white: "bg-white rounded-3xl shadow-sm",
  transparent: "",
};

const paddingStyles = {
  sm: "p-6 md:p-8",
  md: "p-10 md:p-12",
  lg: "p-10 md:p-16",
};

export const Section = ({
  children,
  className = "",
  background = "white",
  padding = "lg",
}: SectionProps) => {
  return (
    <div
      className={`${backgroundStyles[background]} ${paddingStyles[padding]} ${className}`}
    >
      {children}
    </div>
  );
};
