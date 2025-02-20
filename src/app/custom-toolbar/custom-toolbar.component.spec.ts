import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomToolbarComponent } from './custom-toolbar.component';

describe('CustomToolbarComponent', () => {
  let component: CustomToolbarComponent;
  let fixture: ComponentFixture<CustomToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CustomToolbarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
