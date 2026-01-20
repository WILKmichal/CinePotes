"use client";
import React from "react";

export interface EmptyStateProps {
  readonly message: string;
  readonly icon?: React.ReactNode;
  readonly className?: string;
}

export const EmptyState = ({
  message,
  icon,
  className = "",
}: EmptyStateProps) => {
  return (
    <div
      className={`text-center py-16 bg-gray-50 dark:bg-gray-700 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 ${className}`}
    >
      {icon && <div className="mb-4 flex justify-center">{icon}</div>}
      <p className="text-xl text-gray-400 dark:text-gray-500">{message}</p>
    </div>
  );
};
