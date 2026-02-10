"use client";
import React from "react";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

export interface AvatarProps {
  readonly src: string;
  readonly alt: string;
  readonly size?: AvatarSize;
  readonly className?: string;
  readonly bordered?: boolean;
}

const sizeStyles: Record<AvatarSize, string> = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

export const Avatar = ({
  src,
  alt,
  size = "md",
  className = "",
  bordered = false,
}: AvatarProps) => {
  const borderStyle = bordered ? "border-4 border-white dark:border-gray-600 shadow-lg" : "";

  return (
    <img
      src={src}
      alt={alt}
      className={`${sizeStyles[size]} rounded-full ${borderStyle} ${className}`}
    />
  );
};
