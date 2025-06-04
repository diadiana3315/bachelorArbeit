import {FileMetadata} from './file-metadata';

// export interface Folder {
//   id?: string;
//   name: string;
//   parentFolderId: string | null;
//   userId: string;
//   sharedWith?: { userId: string; permission: 'viewer' | 'editor' }[];
//   isShared?: boolean;
//   sharedWithEmails?: { email: string; role: 'viewer' | 'editor' }[];
//   sharedWithUserIds?: string[];
//   files?: FileMetadata[];
//   ownerName?: string;
//   createdAt?: Date;
// }

export interface Folder {
  id?: string;
  name: string;
  parentFolderId: string | null;
  userId: string; // owner user ID
  isShared?: boolean;
  sharedWithUserIds?: string[];
  sharedWith?: {
    userId: string;
    email: string;
    role: 'viewer' | 'editor';
  }[];
  files?: FileMetadata[];
  ownerName?: string;
  createdAt?: Date;
}

