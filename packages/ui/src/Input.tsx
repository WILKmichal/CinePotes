"use client";
import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  readonly label?: string;
  readonly error?: string;
  readonly helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-xl border-2 ${
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-300"
              : "border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-300"
          } bg-white dark:bg-gray-800 px-6 py-4 text-lg text-gray-900 dark:text-white focus:ring-2 transition ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
