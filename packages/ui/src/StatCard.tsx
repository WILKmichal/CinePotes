"use client";
import React from "react";

export interface StatCardProps {
  readonly value: string | number;
  readonly label: string;
  readonly className?: string;
}

export const StatCard = ({ value, label, className = "" }: StatCardProps) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="text-5xl font-semibold text-gray-900">{value}</div>
      <div className="text-base text-gray-600">{label}</div>
    </div>
  );
};
