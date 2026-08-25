import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { FishFavouritesService } from './fish-favourites.service';
import { fishList } from '../models/fish-display-item.model';

describe('FishFavouritesService', () => {
  let service: FishFavouritesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FishFavouritesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should toggle a fish in and out of the selection', () => {
    const pike = fishList[0];

    service.toggleFish(pike, 4);
    expect(service.selectedFish()).toEqual([pike]);

    service.toggleFish(pike, 4);
    expect(service.selectedFish()).toEqual([]);
  });

  it('should not select beyond the maximum', () => {
    const max = 2;
    fishList.slice(0, 3).forEach(fish => service.toggleFish(fish, max));

    expect(service.selectedFish().length).toBe(max);
  });

  it('should report unsaved changes after a toggle', () => {
    expect(service.hasUnsavedChanges()).toBeFalse();

    service.toggleFish(fishList[0], 4);
    expect(service.hasUnsavedChanges()).toBeTrue();
  });
});
