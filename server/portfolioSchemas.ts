import { z } from "zod";

export const contactInquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(320),
  message: z.string().trim().min(12).max(4000),
});

export const resumeUploadSchema = z.object({
  fileName: z.string().trim().min(1).max(180),
  mimeType: z.literal("application/pdf"),
  contentBase64: z.string().min(1).max(12_000_000),
});

export const projectMediaUploadSchema = z.object({
  projectId: z.number().int().positive(),
  fileName: z.string().trim().min(1).max(180),
  mimeType: z.enum(["image/png", "image/jpeg", "image/webp"]),
  contentBase64: z.string().min(1).max(12_000_000),
});
