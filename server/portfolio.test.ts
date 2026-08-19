import { describe, expect, it } from "vitest";
import { contactInquirySchema, projectMediaUploadSchema, resumeUploadSchema } from "./portfolioSchemas";

describe("portfolio persistence contracts", () => {
  it("accepts a complete contact inquiry", () => {
    const result = contactInquirySchema.parse({
      name: "Jamie Rivera",
      email: "jamie@example.com",
      message: "I would like to talk about a networking and application project.",
    });

    expect(result.email).toBe("jamie@example.com");
  });

  it("rejects a resume upload that is not a PDF", () => {
    const result = resumeUploadSchema.safeParse({
      fileName: "resume.exe",
      mimeType: "application/octet-stream",
      contentBase64: "ZmFrZS1jb250ZW50",
    });

    expect(result.success).toBe(false);
  });

  it("only accepts supported image MIME types for project media", () => {
    const accepted = projectMediaUploadSchema.safeParse({
      projectId: 7,
      fileName: "network-map.webp",
      mimeType: "image/webp",
      contentBase64: "ZmFrZS1pbWFnZS1jb250ZW50",
    });
    const rejected = projectMediaUploadSchema.safeParse({
      projectId: 7,
      fileName: "archive.zip",
      mimeType: "application/zip",
      contentBase64: "ZmFrZS1maWxl",
    });

    expect(accepted.success).toBe(true);
    expect(rejected.success).toBe(false);
  });
});
