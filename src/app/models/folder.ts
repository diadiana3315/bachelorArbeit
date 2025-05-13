import {FileMetadata} from './file-metadata';

export interface Folder {
  id?: string; // optional, added by Firestore
  name: string;
  parentFolderId: string | null;
  userId: string;
  sharedWith?: string[];
  isShared?: boolean;    // Optional: for UI indication
  sharedWithEmails?: string[]; // stored temporarily for resolving to user IDs
  files?: FileMetadata[];
  ownerName?: string; // Optional: name of the owner
  createdAt?: Date;
}
