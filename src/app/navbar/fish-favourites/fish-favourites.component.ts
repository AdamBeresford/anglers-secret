import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FishDisplayItem, fishList } from './models/fish-display-item.model';
import { MatListModule } from '@angular/material/list';
import { RouterLink } from '@angular/router';
import { FishFavouritesService } from './services/fish-favourites.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-fish-favourites',
  templateUrl: './fish-favourites.component.html',
  styleUrl: './fish-favourites.component.scss',
  standalone: true,
  imports: [
    MatListModule,
    RouterLink
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FishFavouritesComponent {

  fishFavouritesService = inject(FishFavouritesService);
  authService = inject(AuthService);

  fishList: FishDisplayItem[] = fishList;
  maxSelection = 4;

  saving = signal(false);
  saveMessage = signal<{ text: string; isError: boolean } | null>(null);

  toggleSelection(fish: FishDisplayItem): void {
    this.fishFavouritesService.toggleFish(fish, this.maxSelection);
    this.saveMessage.set(null);
  }

  isSelected(fish: FishDisplayItem): boolean {
    return this.fishFavouritesService.selectedFish().some(f => f.name === fish.name);
  }

  isDisabled(fish: FishDisplayItem): boolean {
    return !this.isSelected(fish) && this.fishFavouritesService.selectedFish().length >= this.maxSelection;
  }

  saveFavourites(): void {
    this.saving.set(true);
    this.saveMessage.set(null);

    this.fishFavouritesService.saveFavourites().subscribe({
      next: () => {
        this.saving.set(false);
        this.saveMessage.set({ text: 'Favourites saved to your account.', isError: false });
      },
      error: () => {
        this.saving.set(false);
        this.saveMessage.set({ text: 'Could not save your favourites. Please try again.', isError: true });
      },
    });
  }

}
