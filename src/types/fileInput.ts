export type FileInfo = {
  fileName: string;
  fileType: string;
  file?: File;
  fileData?: string;
  metadata?: Record<string, unknown>;
};