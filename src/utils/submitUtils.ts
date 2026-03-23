import type { FileInfo } from "@/types/fileInput";
import type { Message } from "@langchain/langgraph-sdk";

/**
 * Reads a FileList and converts each file to a base64-encoded FileInfo object.
 * Extracted here to avoid duplicating this logic in Chat.tsx and sidebar.tsx.
 */
export async function readFilesAsBase64(files: FileList): Promise<FileInfo[]> {
  return Promise.all(
    Array.from(files).map(async (file) => {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]); // Strip the data:...;base64, prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      return {
        fileName: file.name,
        fileType: file.type,
        file,
        fileData: base64Data,
      } satisfies FileInfo;
    })
  );
}

/**
 * Builds the `content` array for a human Message from a text input and a list
 * of already-resolved FileInfo objects.
 *
 * @param input   - The plain-text portion of the message (may be empty).
 * @param files   - Resolved file objects to attach as document blocks.
 * @param s3Upload - When true, omits the raw file data and only sends filename/filetype
 *                  (the file was already uploaded to S3, so the agent only needs the reference).
 */
export function buildContentBlocks(
  input: string,
  files: FileInfo[],
  s3Upload = false
): Message["content"] {
  if (s3Upload) {
    return [
      ...(input.trim().length > 0 ? [{ type: "text" as const, text: input.trim() }] : []),
      ...files.map((file) => ({
        type: "document" as const,
        source: { filename: file.fileName, filetype: file.fileType },
      })),
    ] as unknown as Message["content"];
  }

  return [
    ...(input.trim().length > 0 ? [{ type: "text" as const, text: input }] : []),
    ...files.map((file) => ({
      type: "document" as const,
      ...file,
      cache_control: { type: "ephemeral" as const },
    })),
  ] as unknown as Message["content"];
}
