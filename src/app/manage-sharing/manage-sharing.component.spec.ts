import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageSharingComponent } from './manage-sharing.component';

describe('ManageSharingComponent', () => {
  let component: ManageSharingComponent;
  let fixture: ComponentFixture<ManageSharingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ManageSharingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageSharingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
