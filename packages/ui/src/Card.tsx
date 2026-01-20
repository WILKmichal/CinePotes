"use client";
import React from "react";

export type CardVariant = "default" | "gradient" | "bordered";

export interface CardProps {
  readonly children: React.ReactNode;
  readonly variant?: CardVariant;
  readonly className?: string;
  readonly padding?: "none" | "sm" | "md" | "lg";
}

const variantStyles: Record<CardVariant, string> = {
  default: "bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 shadow-2xl",
  gradient: "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-700 border-2 border-blue-300 dark:border-blue-600 shadow-lg",
  bordered: "bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 border-2 border-gray-300 dark:border-gray-600 hover:shadow-xl hover:scale-105 transition-all duration-200",
};

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-6 md:p-8",
  lg: "p-6 md:p-10",
};

export const Card = ({
  children,
  variant = "default",
  className = "",
  padding = "md",
}: CardProps) => {
  return (
    <div className={`rounded-2xl ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}>
      {children}
    </div>
  );
};
