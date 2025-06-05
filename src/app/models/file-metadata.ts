export interface FileMetadata {
  id?: string;
  fileName: string;
  fileURL: string;
  fileType: string;
  parentFolderId: string | null;
  userId: string;
  isShared:boolean;
  uploadedAt?: number;
  lastAccessedAt?: number;
  isRenaming?: boolean;
  newName?: string;
  practiced?: boolean;
  isFavorite?: boolean;
}
