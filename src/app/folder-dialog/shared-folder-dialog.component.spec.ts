import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedFolderDialogComponent } from './shared-folder-dialog.component';

describe('FolderDialogComponent', () => {
  let component: SharedFolderDialogComponent;
  let fixture: ComponentFixture<SharedFolderDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SharedFolderDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SharedFolderDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
