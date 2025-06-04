import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {Component} from '@angular/core';

@Component({
  selector: 'app-folder-dialog',
  templateUrl: './shared-folder-dialog.component.html',
  styleUrl: './shared-folder-dialog.component.css'
})
export class SharedFolderDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<SharedFolderDialogComponent>
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      sharedWith: this.fb.array([
        this.fb.group({
          email: ['', [Validators.required, Validators.email]],
          role: ['viewer']
        })
      ])
    });
  }

  // get sharedWithEmails(): FormControl[] {
  //   return (this.form.get('sharedWithEmails') as FormArray).controls as FormControl[];
  // }

  get sharedWithControls(): FormGroup[] {
    return (this.form.get('sharedWith') as FormArray).controls as FormGroup[];
  }

  // addEmailField() {
  //   (this.form.get('sharedWithEmails') as FormArray).push(this.fb.control('', Validators.email));
  // }

  addEmailField() {
    (this.form.get('sharedWith') as FormArray).push(
      this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        role: ['viewer']
      })
    );
  }

  removeEmailField(index: number) {
    (this.form.get('sharedWith') as FormArray).removeAt(index);
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
