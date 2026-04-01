import { describe, it, expect, vi, afterEach } from "vitest";
import { buildContentBlocks, readFilesAsBase64 } from "@/utils/submitUtils";
import type { FileInfo } from "@/types/fileInput";

// ---------------------------------------------------------------------------
// buildContentBlocks
// ---------------------------------------------------------------------------
describe("buildContentBlocks", () => {
  const makeFile = (overrides: Partial<FileInfo> = {}): FileInfo => ({
    fileName: "report.pdf",
    fileType: "application/pdf",
    fileData: "base64encodeddata==",
    ...overrides,
  });

  // --- text-only ---
  it("returns a single text block when there are no files", () => {
    const result = buildContentBlocks("Hello", []) as any[];
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ type: "text", text: "Hello" });
  });

  it("returns an empty array when input is blank and no files are attached", () => {
    const result = buildContentBlocks("   ", []) as any[];
    expect(result).toHaveLength(0);
  });

  it("trims leading/trailing whitespace from the text block in s3Upload mode", () => {
    const result = buildContentBlocks("  hi  ", [], true) as any[];
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("hi");
  });

  // --- files without s3Upload ---
  it("appends document blocks after the text block", () => {
    const file = makeFile();
    const result = buildContentBlocks("See attached", [file]) as any[];
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ type: "text", text: "See attached" });
    expect(result[1].type).toBe("document");
    expect(result[1].fileData).toBe("base64encodeddata==");
    expect(result[1].cache_control).toEqual({ type: "ephemeral" });
  });

  it("includes cache_control on every document block in default mode", () => {
    const files = [makeFile({ fileName: "a.pdf" }), makeFile({ fileName: "b.pdf" })];
    const result = buildContentBlocks("two files", files) as any[];
    const docs = result.filter((b) => b.type === "document");
    expect(docs).toHaveLength(2);
    docs.forEach((d) => {
      expect(d.cache_control).toEqual({ type: "ephemeral" });
    });
  });

  it("omits the text block when input is empty and files are present", () => {
    const file = makeFile();
    const result = buildContentBlocks("", [file]) as any[];
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("document");
  });

  // --- s3Upload mode ---
  it("omits fileData in s3Upload mode and only sends filename/filetype", () => {
    const file = makeFile();
    const result = buildContentBlocks("upload", [file], true) as any[];
    const doc = result.find((b) => b.type === "document");
    expect(doc).toBeDefined();
    expect(doc.source).toEqual({
      filename: "report.pdf",
      filetype: "application/pdf",
    });
    expect(doc.fileData).toBeUndefined();
  });

  it("does NOT add cache_control in s3Upload mode", () => {
    const file = makeFile();
    const result = buildContentBlocks("msg", [file], true) as any[];
    const doc = result.find((b) => b.type === "document");
    expect(doc.cache_control).toBeUndefined();
  });

  it("omits text block when input is blank in s3Upload mode with files", () => {
    const file = makeFile();
    const result = buildContentBlocks("", [file], true) as any[];
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("document");
  });

  it("handles multiple files in s3Upload mode", () => {
    const files = [
      makeFile({ fileName: "x.png", fileType: "image/png" }),
      makeFile({ fileName: "y.pdf", fileType: "application/pdf" }),
    ];
    const result = buildContentBlocks("two", files, true) as any[];
    const docs = result.filter((b) => b.type === "document");
    expect(docs).toHaveLength(2);
    expect(docs[0].source.filename).toBe("x.png");
    expect(docs[1].source.filename).toBe("y.pdf");
  });
});

// ---------------------------------------------------------------------------
// readFilesAsBase64
// ---------------------------------------------------------------------------
describe("readFilesAsBase64", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** jsdom has no DataTransfer — build a minimal FileList from an array. */
  function makeFileList(...files: File[]): FileList {
    return Object.assign([...files], {
      item: (i: number) => files[i] ?? null,
    }) as unknown as FileList;
  }

  /**
   * Stub FileReader as a proper class so `new FileReader()` works.
   * readAsDataURL schedules onload asynchronously, mirroring the real API.
   */
  function stubFileReader(base64Result: string) {
    vi.stubGlobal(
      "FileReader",
      class {
        result = `data:application/pdf;base64,${base64Result}`;
        onload: ((e: Event) => void) | null = null;
        onerror: ((e: Event) => void) | null = null;
        readAsDataURL() {
          Promise.resolve().then(() => { this.onload?.({} as Event); });
        }
      }
    );
  }

  it("resolves with a FileInfo array containing base64 data", async () => {
    stubFileReader("abc123==");

    const file = new File(["dummy"], "test.pdf", { type: "application/pdf" });
    const result = await readFilesAsBase64(makeFileList(file));

    expect(result).toHaveLength(1);
    expect(result[0].fileName).toBe("test.pdf");
    expect(result[0].fileType).toBe("application/pdf");
    expect(result[0].fileData).toBe("abc123==");
    expect(result[0].file).toBe(file);
  });

  it("strips the data-url prefix, keeping only the base64 payload", async () => {
    stubFileReader("PAYLOAD");

    const file = new File(["x"], "img.png", { type: "image/png" });
    const result = await readFilesAsBase64(makeFileList(file));

    expect(result[0].fileData).toBe("PAYLOAD");
    expect(result[0].fileData).not.toContain("data:");
  });

  it("processes multiple files in parallel and preserves order", async () => {
    let callCount = 0;

    vi.stubGlobal(
      "FileReader",
      class {
        result: string;
        onload: ((e: Event) => void) | null = null;
        onerror: ((e: Event) => void) | null = null;
        constructor() {
          this.result = `data:text/plain;base64,file${callCount++}data`;
        }
        readAsDataURL() {
          Promise.resolve().then(() => { this.onload?.({} as Event); });
        }
      }
    );

    const files = makeFileList(
      new File(["a"], "a.txt", { type: "text/plain" }),
      new File(["b"], "b.txt", { type: "text/plain" }),
    );

    const res = await readFilesAsBase64(files);
    expect(res).toHaveLength(2);
    expect(res[0].fileName).toBe("a.txt");
    expect(res[1].fileName).toBe("b.txt");
    expect(res[0].fileData).toBe("file0data");
    expect(res[1].fileData).toBe("file1data");
  });
});
