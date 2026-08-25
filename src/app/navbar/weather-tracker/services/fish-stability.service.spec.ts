import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { FishStabilityService } from './fish-stability.service';

describe('FishStabilityService', () => {
  let service: FishStabilityService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FishStabilityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
