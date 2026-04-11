import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import Thinking from "@/components/Thinking";

describe("Thinking component", () => {
  it("renders without crashing", () => {
    const { container } = render(<Thinking />);
    expect(container).toBeTruthy();
  });

  it("renders exactly 8 animated letters", () => {
    const { container } = render(<Thinking />);
    const letters = container.querySelectorAll(".loader-letter");
    expect(letters).toHaveLength(8);
  });

  it("spells out the word 'Thinking'", () => {
    const { container } = render(<Thinking />);
    const letters = container.querySelectorAll(".loader-letter");
    const word = Array.from(letters)
      .map((el) => el.textContent)
      .join("");
    expect(word).toBe("Thinking");
  });

  it("renders the loader spinner element", () => {
    const { container } = render(<Thinking />);
    // The animated spinner div has className "loader"
    expect(container.querySelector(".loader-wrapper")).toBeTruthy();
  });

  it("contains a letter-wrapper element as parent of the letters", () => {
    const { container } = render(<Thinking />);
    const wrapper = container.querySelector(".letter-wrapper");
    expect(wrapper).toBeTruthy();
    expect(wrapper!.children).toHaveLength(8);
  });

  it("injects a <style> block with keyframe animations", () => {
    const { container } = render(<Thinking />);
    const style = container.querySelector("style");
    expect(style).toBeTruthy();
    expect(style!.textContent).toContain("loader-letter-anim");
    expect(style!.textContent).toContain("loader-rotate");
  });

  it("each letter has its own animation-delay via nth-child CSS", () => {
    const { container } = render(<Thinking />);
    const style = container.querySelector("style");
    // Verify nth-child selectors 1 through 8 are declared in the style block
    for (let i = 1; i <= 8; i++) {
      expect(style!.textContent).toContain(`:nth-child(${i})`);
    }
  });

  it("renders the same output on multiple mounts (idempotent)", () => {
    const { container: c1 } = render(<Thinking />);
    const { container: c2 } = render(<Thinking />);
    expect(c1.innerHTML).toBe(c2.innerHTML);
  });
});
