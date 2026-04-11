import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { FileProvider, useFileProvider } from "@/providers/FileProvider";
import type { FileInfo } from "@/types/fileInput";

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------
function FileDisplay() {
  const { fileInput } = useFileProvider();
  return (
    <ul data-testid="list">
      {fileInput.map((f) => (
        <li key={f.fileName} data-testid="file-item">
          {f.fileName}
        </li>
      ))}
    </ul>
  );
}

function FileAdder({ file }: { file: FileInfo }) {
  const { setFileInput } = useFileProvider();
  return (
    <button onClick={() => setFileInput((prev) => [...prev, file])}>
      Add
    </button>
  );
}

function FileClearer() {
  const { setFileInput } = useFileProvider();
  return <button onClick={() => setFileInput([])}>Clear</button>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("FileProvider + useFileProvider", () => {
  it("starts with an empty file list", () => {
    render(
      <FileProvider>
        <FileDisplay />
      </FileProvider>
    );

    expect(screen.getByTestId("list").children).toHaveLength(0);
  });

  it("reflects added files in consumers", async () => {
    const user = userEvent.setup();
    const file: FileInfo = { fileName: "report.pdf", fileType: "application/pdf" };

    render(
      <FileProvider>
        <FileAdder file={file} />
        <FileDisplay />
      </FileProvider>
    );

    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getAllByTestId("file-item")).toHaveLength(1);
    expect(screen.getByTestId("file-item").textContent).toBe("report.pdf");
  });

  it("accumulates multiple files", async () => {
    const user = userEvent.setup();
    const file1: FileInfo = { fileName: "a.png", fileType: "image/png" };
    const file2: FileInfo = { fileName: "b.pdf", fileType: "application/pdf" };

    function MultiAdder() {
      const { setFileInput } = useFileProvider();
      return (
        <>
          <button onClick={() => setFileInput((p) => [...p, file1])}>Add1</button>
          <button onClick={() => setFileInput((p) => [...p, file2])}>Add2</button>
        </>
      );
    }

    render(
      <FileProvider>
        <MultiAdder />
        <FileDisplay />
      </FileProvider>
    );

    await user.click(screen.getByRole("button", { name: "Add1" }));
    await user.click(screen.getByRole("button", { name: "Add2" }));

    expect(screen.getAllByTestId("file-item")).toHaveLength(2);
  });

  it("clears the file list when setFileInput is called with []", async () => {
    const user = userEvent.setup();
    const file: FileInfo = { fileName: "doc.txt", fileType: "text/plain" };

    render(
      <FileProvider>
        <FileAdder file={file} />
        <FileClearer />
        <FileDisplay />
      </FileProvider>
    );

    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getAllByTestId("file-item")).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.queryAllByTestId("file-item")).toHaveLength(0);
  });

  it("throws when useFileProvider is used outside a FileProvider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    function Bare() {
      useFileProvider();
      return null;
    }

    expect(() => render(<Bare />)).toThrow(
      "use File Provider inside a FileProvider"
    );

    consoleSpy.mockRestore();
  });

  it("multiple consumers share the same state", async () => {
    const user = userEvent.setup();
    const file: FileInfo = { fileName: "shared.pdf", fileType: "application/pdf" };

    function CountDisplay({ id }: { id: string }) {
      const { fileInput } = useFileProvider();
      return <span data-testid={id}>{fileInput.length}</span>;
    }

    render(
      <FileProvider>
        <FileAdder file={file} />
        <CountDisplay id="count-a" />
        <CountDisplay id="count-b" />
      </FileProvider>
    );

    expect(screen.getByTestId("count-a").textContent).toBe("0");
    expect(screen.getByTestId("count-b").textContent).toBe("0");

    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByTestId("count-a").textContent).toBe("1");
    expect(screen.getByTestId("count-b").textContent).toBe("1");
  });
});
