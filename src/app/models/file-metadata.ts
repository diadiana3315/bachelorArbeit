export interface FileMetadata {
  id?: string;
  fileName: string;
  fileURL: string;
  fileType: string;
  parentFolderId: string | null;
  userId: string;
  isShared:boolean;
  uploadedAt?: number; // Timestamp when uploaded
  lastAccessedAt?: number; // Timestamp when last accessed
  isRenaming?: boolean;
  newName?: string;
}
