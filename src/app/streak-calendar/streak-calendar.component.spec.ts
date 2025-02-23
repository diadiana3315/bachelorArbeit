import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StreakCalendarComponent } from './streak-calendar.component';

describe('StreakCalendarComponent', () => {
  let component: StreakCalendarComponent;
  let fixture: ComponentFixture<StreakCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StreakCalendarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StreakCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
