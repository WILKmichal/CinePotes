"use client";
import React from "react";

export interface MovieCardProps {
  readonly imageSrc: string;
  readonly title: string;
  readonly author: string;
  readonly alt?: string;
  readonly className?: string;
}

export const MovieCard = ({
  imageSrc,
  title,
  author,
  alt,
  className = "",
}: MovieCardProps) => {
  return (
    <div
      className={`group relative overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 ${className}`}
    >
      <img
        src={imageSrc}
        alt={alt || title}
        className="w-full h-[400px] object-cover group-hover:scale-110 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-6 left-6 right-6">
          <h3 className="text-white text-2xl font-bold">{title}</h3>
          <p className="text-white text-sm font-bold">de {author}</p>
        </div>
      </div>
    </div>
  );
};
