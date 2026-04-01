import { describe, it, expect } from "vitest";
import { cn } from "@/utils/tailwindUtil";

describe("cn (class name utility)", () => {
  it("returns a single class unchanged", () => {
    expect(cn("text-red-500")).toBe("text-red-500");
  });

  it("joins multiple classes with a space", () => {
    expect(cn("flex", "items-center", "gap-2")).toBe("flex items-center gap-2");
  });

  it("ignores falsy values (undefined, null, false, empty string)", () => {
    expect(cn("p-4", undefined, null, false, "")).toBe("p-4");
  });

  it("merges conflicting Tailwind classes, keeping the last one", () => {
    // tailwind-merge should resolve padding conflicts
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("merges conflicting text-color classes", () => {
    expect(cn("text-red-500", "text-blue-600")).toBe("text-blue-600");
  });

  it("handles conditional class objects (clsx feature)", () => {
    expect(cn({ "font-bold": true, italic: false })).toBe("font-bold");
  });

  it("handles array inputs", () => {
    expect(cn(["flex", "flex-col"])).toBe("flex flex-col");
  });

  it("handles nested arrays and objects together", () => {
    expect(cn(["p-2", { "text-lg": true, hidden: false }])).toBe("p-2 text-lg");
  });

  it("returns an empty string when all inputs are falsy", () => {
    expect(cn(undefined, null, false)).toBe("");
  });

  it("merges responsive and modifier variants without conflict", () => {
    // These don't conflict, so both should be present
    const result = cn("md:flex", "lg:grid");
    expect(result).toContain("md:flex");
    expect(result).toContain("lg:grid");
  });
});
