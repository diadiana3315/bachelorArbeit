import {FormArray, FormBuilder, FormControl, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {Component} from '@angular/core';

@Component({
  selector: 'app-folder-dialog',
  templateUrl: './shared-folder-dialog.component.html',
  styleUrl: './shared-folder-dialog.component.css'
})
export class SharedFolderDialogComponent {
  form;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<SharedFolderDialogComponent>
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      sharedWithEmails: this.fb.array([this.fb.control('', Validators.email)])
    });
  }

  get sharedWithEmails(): FormControl[] {
    return (this.form.get('sharedWithEmails') as FormArray).controls as FormControl[];
  }

  addEmailField() {
    (this.form.get('sharedWithEmails') as FormArray).push(this.fb.control('', Validators.email));
  }

  removeEmailField(index: number) {
    (this.form.get('sharedWithEmails') as FormArray).removeAt(index);
  }

  save() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  cancel() {
    this.dialogRef.close();
  }
}
