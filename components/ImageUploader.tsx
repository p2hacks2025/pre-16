"use client";

import React, { useCallback, useState } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
}

export function ImageUploader({ onImageSelect }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        onImageSelect(file);
      }
    },
    [onImageSelect]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onImageSelect(file);
      }
    },
    [onImageSelect]
  );

  return (
    <div
      className={`relative w-full max-w-xl h-64 rounded-2xl border-4 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden group
        ${
          isDragging
            ? "border-orange-500 bg-orange-50 scale-105"
            : "border-white/20 bg-white/5 hover:border-orange-400 hover:bg-white/10"
        }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="image/*"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        onChange={handleChange}
      />

      <div className="flex flex-col items-center gap-4 text-white/80 group-hover:text-white transition-colors">
        <div
          className={`p-4 rounded-full bg-white/10 transition-transform duration-500 ${
            isDragging ? "rotate-12 scale-110" : "group-hover:scale-110"
          }`}
        >
          {isDragging ? (
            <ImageIcon className="w-10 h-10 text-orange-500" />
          ) : (
            <Upload className="w-10 h-10" />
          )}
        </div>
        <div className="text-center">
          <p className="text-xl font-bold">
            {isDragging ? "Drop it like it's hot!" : "Upload your creature"}
          </p>
          <p className="text-sm opacity-60 mt-2">
            Click or drag & drop an image here
          </p>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
}
