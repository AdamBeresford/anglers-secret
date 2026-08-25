import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { FishDisplayItem, fishList } from '../models/fish-display-item.model';
import { AuthService } from '../../../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class FishFavouritesService {

  private static readonly FAVOURITES_PATH = '/api/account/favourites';

  private http = inject(HttpClient);
  private authService = inject(AuthService);

  selectedFish = signal<FishDisplayItem[]>([]);

  // The names as last seen on the server, for detecting unsaved changes
  private savedFishNames = signal<string[]>([]);

  hasUnsavedChanges = computed(() => {
    const selected = this.selectedFish().map(fish => fish.name);
    const saved = this.savedFishNames();
    return selected.length !== saved.length || selected.some((name, i) => name !== saved[i]);
  });

  constructor() {
    // Favourites follow the session: load them on sign-in, drop them on sign-out
    effect(() => {
      if (this.authService.isLoggedIn()) {
        this.loadFavourites();
      } else {
        this.selectedFish.set([]);
        this.savedFishNames.set([]);
      }
    }, { allowSignalWrites: true });
  }

  toggleFish(fish: FishDisplayItem, maxSelection: number) {
    this.selectedFish.update(selected => {
      if (selected.some(f => f.name === fish.name)) {
        return selected.filter(f => f.name !== fish.name);
      }
      return selected.length < maxSelection ? [...selected, fish] : selected;
    });
  }

  saveFavourites(): Observable<{ favourites: string[] }> {
    const favourites = this.selectedFish().map(fish => fish.name);

    return this.http.put<{ favourites: string[] }>(FishFavouritesService.FAVOURITES_PATH, { favourites }).pipe(
      tap((response) => this.savedFishNames.set(response.favourites))
    );
  }

  private loadFavourites() {
    this.http.get<{ favourites: string[] }>(FishFavouritesService.FAVOURITES_PATH).subscribe({
      next: (response) => {
        const favourites = response.favourites
          .map(name => fishList.find(fish => fish.name === name))
          .filter((fish): fish is FishDisplayItem => fish !== undefined);

        this.selectedFish.set(favourites);
        this.savedFishNames.set(favourites.map(fish => fish.name));
      },
      // On failure the page still works with an empty in-memory selection
      error: () => undefined,
    });
  }

}
