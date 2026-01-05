export type Metadata = {
  file?: File;
  fileData?: string;
  metadata?: Record<string, any>; // JSON metadata object
};

export type FileInfo = {
  fileName: string;
  fileType: string;
  metadata?: Metadata; // Base64 encoded file data
};
