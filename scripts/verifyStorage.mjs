import { readFile } from "node:fs/promises";
import { appRouter } from "../server/routers.ts";

const resumeBytes = await readFile("/home/ubuntu/webdev-static-assets/anthony-baker-professional-profile.pdf");
const projectImageBytes = await readFile("/home/ubuntu/webdev-static-assets/anthony-baker-pihole-project.png");

const adminUser = {
  id: 1,
  openId: "portfolio-storage-verifier",
  name: "Portfolio Storage Verifier",
  email: "Anthony@bakerinfo.org",
  loginMethod: "system",
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const caller = appRouter.createCaller({
  user: adminUser,
  req: { protocol: "https", headers: {} },
  res: { clearCookie: () => undefined },
});

const resume = await caller.portfolio.uploadResume({
  fileName: "Anthony-Baker-Professional-Profile.pdf",
  mimeType: "application/pdf",
  contentBase64: resumeBytes.toString("base64"),
});

const projectMedia = await caller.portfolio.uploadProjectMedia({
  projectId: 2,
  fileName: "portable-pihole-fieldbook.png",
  mimeType: "image/png",
  contentBase64: projectImageBytes.toString("base64"),
});

console.log(JSON.stringify({ resume, projectMedia }, null, 2));
