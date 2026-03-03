"use server";

import { z } from "zod";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const uploadRequestSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileType: z.enum(ALLOWED_TYPES),
  fileSize: z.number().min(1).max(MAX_SIZE_BYTES),
});

export async function getCloudinaryUploadSignature(
  fileName: string,
  fileType: string,
  fileSize: number
): Promise<{
  success?: boolean;
  error?: string;
  signature?: string;
  timestamp?: number;
  apiKey?: string;
  cloudName?: string;
  folder?: string;
}> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const parsed = uploadRequestSchema.safeParse({
    fileName,
    fileType,
    fileSize,
  });

  if (!parsed.success) {
    if (parsed.error.issues.some((i) => i.path.includes("fileType"))) {
      return { error: "Invalid file type. Use JPEG, PNG, or WebP." };
    }
    if (parsed.error.issues.some((i) => i.path.includes("fileSize"))) {
      return {
        error: `File too large. Max size is ${MAX_SIZE_BYTES / 1024 / 1024}MB.`,
      };
    }
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid upload request.",
    };
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return { error: "Upload is not configured." };
  }

  const folder = `foods/${session.user.id}`;
  const timestamp = Math.round(Date.now() / 1000);

  // Only sign folder and timestamp - Cloudinary verifies these. max_file_size
  // is not included in their signature verification.
  const paramsToSign = { folder, timestamp };

  try {
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      apiSecret
    );

    return {
      success: true,
      signature,
      timestamp,
      apiKey,
      cloudName,
      folder,
    };
  } catch (err) {
    console.error("Cloudinary signature generation failed:", err);
    return { error: "Failed to generate upload signature." };
  }
}
