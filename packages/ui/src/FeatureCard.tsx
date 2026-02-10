"use client";
import React from "react";

export interface FeatureCardProps {
  readonly icon: string;
  readonly title: string;
  readonly description: string;
  readonly className?: string;
}

export const FeatureCard = ({
  icon,
  title,
  description,
  className = "",
}: FeatureCardProps) => {
  return (
    <div
      className={`bg-white rounded-3xl p-10 shadow-sm hover:shadow-xl transition-shadow duration-300 ${className}`}
    >
      <div className="space-y-4">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl">
          {icon}
        </div>
        <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight">
          {title}
        </h3>
        <p className="text-lg text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
  );
};
