import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const pageSource = () => readFile(new URL("./Home.tsx", import.meta.url), "utf8");
const styleSource = () => readFile(new URL("../index.css", import.meta.url), "utf8");

describe("Circuit Fieldbook accessibility markers", () => {
  it("keeps navigation, controls, and skill meters labeled", async () => {
    const source = await pageSource();

    expect(source).toContain('aria-label="Primary navigation"');
    expect(source).toContain('aria-label="Mobile navigation"');
    expect(source).toContain('aria-label="Toggle navigation"');
    expect(source).toContain('aria-label={`${skill.name} self-assessed proficiency`}');
    expect(source).toContain('htmlFor="resume-upload"');
    expect(source).toContain('htmlFor="project-media-upload"');
  });

  it("retains visible keyboard focus styling", async () => {
    const source = await styleSource();

    expect(source).toContain(":focus-visible");
    expect(source).toContain("outline: 2px solid var(--lime)");
  });
});
