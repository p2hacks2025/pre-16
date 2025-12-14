"use client";

import { useState } from "react";
import { ImageUploader } from "@/components/ImageUploader";
import { FireBreather } from "@/components/FireBreather";

export function UploadMode() {
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Note: In a real production app we'd manage URL revocation better
  const imageSrc = imageFile ? URL.createObjectURL(imageFile) : "";

  return (
    <div className="w-full flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!imageFile ? (
        <ImageUploader onImageSelect={setImageFile} />
      ) : (
        <FireBreather imageSrc={imageSrc} onBack={() => setImageFile(null)} />
      )}
    </div>
  );
}
