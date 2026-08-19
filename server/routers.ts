import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { createContactInquiry, getPortfolioSnapshot, saveProjectMedia, saveResumeAsset } from "./db";
import { contactInquirySchema, projectMediaUploadSchema, resumeUploadSchema } from "./portfolioSchemas";
import { storagePut } from "./storage";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  portfolio: router({
    snapshot: publicProcedure.query(async () => getPortfolioSnapshot()),
    contact: publicProcedure.input(contactInquirySchema).mutation(async ({ input }) => {
      await createContactInquiry(input);
      return { success: true } as const;
    }),
    uploadResume: adminProcedure.input(resumeUploadSchema).mutation(async ({ ctx, input }) => {
      const bytes = Buffer.from(input.contentBase64, "base64");
      if (bytes.length === 0 || bytes.length > 8_000_000) throw new Error("Resume must be a PDF smaller than 8 MB");
      if (!bytes.subarray(0, 4).equals(Buffer.from("%PDF"))) throw new Error("The uploaded file is not a valid PDF");

      const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
      const stored = await storagePut(`portfolio/resumes/${ctx.user.id}/${safeName}`, bytes, input.mimeType);
      await saveResumeAsset({
        fileName: input.fileName,
        fileKey: stored.key,
        url: stored.url,
        mimeType: input.mimeType,
        sizeBytes: bytes.length,
        uploadedByUserId: ctx.user.id,
      });
      return { success: true, url: stored.url } as const;
    }),
    uploadProjectMedia: adminProcedure.input(projectMediaUploadSchema).mutation(async ({ ctx, input }) => {
      const bytes = Buffer.from(input.contentBase64, "base64");
      if (bytes.length === 0 || bytes.length > 8_000_000) throw new Error("Project media must be an image smaller than 8 MB");
      const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
      const stored = await storagePut(`portfolio/projects/${input.projectId}/${safeName}`, bytes, input.mimeType);
      await saveProjectMedia({
        projectId: input.projectId,
        fileName: input.fileName,
        fileKey: stored.key,
        url: stored.url,
        mimeType: input.mimeType,
        sizeBytes: bytes.length,
        uploadedByUserId: ctx.user.id,
      });
      return { success: true, url: stored.url } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
