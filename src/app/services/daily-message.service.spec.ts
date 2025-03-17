import { TestBed } from '@angular/core/testing';

import { DailyMessageService } from './daily-message.service';

describe('DailyMessageService', () => {
  let service: DailyMessageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DailyMessageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
