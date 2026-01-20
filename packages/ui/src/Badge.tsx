"use client";
import React from "react";

export type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger";

export interface BadgeProps {
  readonly children: React.ReactNode;
  readonly variant?: BadgeVariant;
  readonly className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
  primary: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
  success: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
  warning: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
  danger: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
};

export const Badge = ({
  children,
  variant = "default",
  className = "",
}: BadgeProps) => {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
