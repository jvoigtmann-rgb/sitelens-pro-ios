import { useState, useRef } from "react";
import { Upload, Camera, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";

export default function PhotoUploader({ onPhotoUploaded, disabled }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const extractGps = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const view = new DataView(e.target.result);
      // Only JPEG has EXIF
      if (view.getUint16(0) !== 0xFFD8) return resolve(null);
      let offset = 2;
      while (offset < view.byteLength) {
        if (view.getUint16(offset) === 0xFFE1) {
          const exifLen = view.getUint16(offset + 2);
          const exifData = new DataView(e.target.result, offset + 4, exifLen - 2);
          if (exifData.getUint32(0) !== 0x45786966) return resolve(null); // "Exif"
          const little = exifData.getUint16(6) === 0x4949;
          const ifdOffset = exifData.getUint32(10, little) + 6;
          const numEntries = exifData.getUint16(ifdOffset, little);
          let gpsOffset = null;
          for (let i = 0; i < numEntries; i++) {
            const entryOffset = ifdOffset + 2 + i * 12;
            if (exifData.getUint16(entryOffset, little) === 0x8825) {
              gpsOffset = exifData.getUint32(entryOffset + 8, little) + 6;
            }
          }
          if (!gpsOffset) return resolve(null);
          const gpsEntries = exifData.getUint16(gpsOffset, little);
          let latRef, lat, lngRef, lng;
          const toDecimal = (rationals) => rationals[0] + rationals[1] / 60 + rationals[2] / 3600;
          const readRationals = (off) => [0, 1, 2].map(i => {
            const n = exifData.getUint32(off + i * 8, little);
            const d = exifData.getUint32(off + i * 8 + 4, little);
            return d ? n / d : 0;
          });
          for (let i = 0; i < gpsEntries; i++) {
            const e = gpsOffset + 2 + i * 12;
            const tag = exifData.getUint16(e, little);
            const valOff = exifData.getUint32(e + 8, little) + 6;
            if (tag === 1) latRef = String.fromCharCode(exifData.getUint8(e + 8));
            else if (tag === 2) lat = toDecimal(readRationals(valOff));
            else if (tag === 3) lngRef = String.fromCharCode(exifData.getUint8(e + 8));
            else if (tag === 4) lng = toDecimal(readRationals(valOff));
          }
          if (lat != null && lng != null) {
            return resolve({
              lat: latRef === "S" ? -lat : lat,
              lng: lngRef === "W" ? -lng : lng,
            });
          }
          return resolve(null);
        }
        offset += 2 + view.getUint16(offset + 2);
      }
      resolve(null);
    };
    reader.readAsArrayBuffer(file);
  });

  const compressImage = (file) => new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 2400;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
        else { width = Math.round(width * MAX / height); height = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: "image/jpeg" })), "image/jpeg", 0.92);
    };
    img.src = url;
  });

  const handleFiles = async (files) => {
    if (disabled || uploading) return;
    const imageFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;
    setUploading(true);

    for (const file of imageFiles) {
      const [compressed, gps] = await Promise.all([compressImage(file), extractGps(file)]);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: compressed });
      onPhotoUploaded(file_url, file.name, gps);
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all duration-300 ${
        isDragging
          ? "border-primary bg-primary/5 scale-[1.01]"
          : "border-border hover:border-primary/40 hover:bg-secondary/50"
      } ${disabled ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
      onClick={() => !uploading && fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(Array.from(e.target.files))}
      />

      {uploading ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Uploading photos...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Camera className="w-8 h-8 text-primary" />
          </div>
          <div>
            <p className="text-base font-medium text-foreground">
              Drop photos here or click to upload
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              JPG, PNG, HEIC — upload multiple photos at once
            </p>
          </div>
        </div>
      )}
    </div>
  );
}