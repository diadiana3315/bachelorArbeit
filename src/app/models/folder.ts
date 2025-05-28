import {FileMetadata} from './file-metadata';

export interface Folder {
  id?: string;
  name: string;
  parentFolderId: string | null;
  userId: string;
  sharedWith?: string[];
  isShared?: boolean;
  sharedWithEmails?: string[];
  files?: FileMetadata[];
  ownerName?: string;
  createdAt?: Date;
}
