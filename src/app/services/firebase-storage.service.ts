import {Injectable} from '@angular/core';
import {deleteObject, getDownloadURL, getStorage, ref, uploadBytesResumable} from '@angular/fire/storage';


@Injectable({
  providedIn: 'root',
})
export class FirebaseStorageService {
  private storage = getStorage();

  /**
   * Uploads a file to Firebase Storage/
   * @param file The file to upload.
   * @param filePath
   * @returns A promise indicating success or failure of both the upload and metadata save operations.
   */
  async uploadFile(file: File, filePath: string): Promise<string> {
    const fileRef = ref(this.storage, filePath);

    try {
      const uploadTask = uploadBytesResumable(fileRef, file);
      await uploadTask;

      return await getDownloadURL(fileRef);
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }


  /**
   * Deletes a file from Firebase Storage.
   * @param filePath The path to the file in Firebase Storage.
   * @returns A promise indicating success or failure of the delete operation.
   */
  async deleteFile(filePath: string): Promise<void> {
    const fileRef = ref(this.storage, filePath);
    try {
      await deleteObject(fileRef);
      console.log('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

}
