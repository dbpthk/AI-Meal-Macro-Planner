"use client";

import { useRef, useState } from "react";
import { getCloudinaryUploadSignature } from "@/app/actions/upload";
import { Button } from "@/components/ui/button";
import { ImageIcon, Loader2, X } from "lucide-react";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPT = ".jpg,.jpeg,.png,.webp";
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1";

type FoodImageUploadProps = {
  value?: string | null;
  onChange?: (url: string | null) => void;
  disabled?: boolean;
};

export function FoodImageUpload({
  value,
  onChange,
  disabled = false,
}: FoodImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value ?? null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Invalid file type. Use JPEG, PNG, or WebP.");
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError(
        `File too large. Max size is ${MAX_SIZE_BYTES / 1024 / 1024}MB.`
      );
      return;
    }

    const blobUrl = URL.createObjectURL(file);
    setPreview(blobUrl);
    setUploading(true);

    try {
      const result = await getCloudinaryUploadSignature(
        file.name,
        file.type,
        file.size
      );

      if (result.error) {
        setError(
          result.error === "Upload is not configured."
            ? "Image upload is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your .env file."
            : result.error
        );
        URL.revokeObjectURL(blobUrl);
        setPreview(null);
        return;
      }

      if (
        !result.signature ||
        result.timestamp === undefined ||
        !result.apiKey ||
        !result.cloudName
      ) {
        setError("Upload failed.");
        URL.revokeObjectURL(blobUrl);
        setPreview(null);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("signature", result.signature);
      formData.append("timestamp", String(result.timestamp));
      formData.append("api_key", result.apiKey);
      if (result.folder) {
        formData.append("folder", result.folder);
      }

      const res = await fetch(
        `${CLOUDINARY_UPLOAD_URL}/${result.cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as {
          error?: { message?: string } | string;
        };
        const errMsg =
          typeof errData?.error === "string"
            ? errData.error
            : errData?.error?.message ?? `Upload failed (${res.status}).`;
        setError(errMsg);
        URL.revokeObjectURL(blobUrl);
        setPreview(null);
        return;
      }

      const data = (await res.json()) as { secure_url?: string };
      const finalUrl = data.secure_url ?? null;
      URL.revokeObjectURL(blobUrl);
      setPreview(finalUrl);
      onChange?.(finalUrl);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Upload failed.";
      setError(msg);
      URL.revokeObjectURL(blobUrl);
      setPreview(null);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleRemove = () => {
    if (preview && preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setError(null);
    onChange?.(null);
    inputRef.current?.value && (inputRef.current.value = "");
  };

  const displayUrl = preview ?? value;

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        {displayUrl ? (
          <div className="relative shrink-0">
            <img
              src={displayUrl}
              alt="Food preview"
              className="h-24 w-24 rounded-lg border object-cover"
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={uploading}
                className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm hover:bg-destructive/90 disabled:opacity-50"
                aria-label="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border border-dashed bg-muted/50">
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
        )}
        <div className="flex flex-1 flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            className="hidden"
          />
          {!disabled && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {displayUrl ? "Change image" : "Upload image"}
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            JPEG, PNG or WebP. Max 5MB.
          </p>
        </div>
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
