import {Component, EventEmitter, Input, Output} from '@angular/core';
import { FirestoreService } from '../services/firestore.service';
import {Folder} from '../models/folder';

@Component({
  selector: 'app-manage-sharing',
  templateUrl: './manage-sharing.component.html',
  styleUrls: ['./manage-sharing.component.css']
})
export class ManageSharingComponent {
  @Input() folder!: Folder;
  @Input() closeModal!: () => void;
  @Output() sharingUpdated = new EventEmitter<Folder>();

  showModal: boolean = false;

  constructor(private firestoreService: FirestoreService) {}

  updateRole(user: { userId: string; role: 'viewer' | 'editor' }) {
    if (!this.folder.id) return;

    this.firestoreService.updateUserRoleInFolder(
      this.folder.id,
      user.userId,
      user.role
    ).then(() => {
      console.log('Role updated');
    }).catch(err => {
      console.error('Error updating role', err);
    });
  }

  // close() {
  //   this.closeModal();
  // }
}
