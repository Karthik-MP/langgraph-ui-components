export type FileInfo = {
  fileName: string;
  fileType: string;
  file:File;
  fileData?: string; // Base64 encoded file data
};