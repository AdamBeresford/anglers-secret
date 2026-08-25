import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
    selector: 'app-account',
    templateUrl: './account.component.html',
    styleUrl: './account.component.scss',
    standalone: true,
    imports: [ReactiveFormsModule, RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountComponent {

  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser = this.authService.currentUser;

  confirmingDelete = signal(false);
  deleting = signal(false);
  errorMessage = signal<string | null>(null);

  deletePasswordControl = new FormControl('', Validators.required);

  downloadMyData() {
    this.errorMessage.set(null);

    this.authService.exportMyData().subscribe({
      next: (data) => this.saveAsJsonFile(data),
      error: () => this.errorMessage.set('Could not export your data. Please try again.'),
    });
  }

  startDelete() {
    this.confirmingDelete.set(true);
    this.errorMessage.set(null);
  }

  cancelDelete() {
    this.confirmingDelete.set(false);
    this.deletePasswordControl.reset();
    this.errorMessage.set(null);
  }

  confirmDelete() {
    if (this.deletePasswordControl.invalid) return;

    this.deleting.set(true);
    this.errorMessage.set(null);

    this.authService.deleteAccount(this.deletePasswordControl.value ?? '').subscribe({
      next: () => this.router.navigate(['/home']),
      error: (err) => {
        this.deleting.set(false);
        this.errorMessage.set(err.error?.message ?? 'Could not delete your account.');
      },
    });
  }

  private saveAsJsonFile(data: unknown) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'anglers-secret-my-data.json';
    link.click();

    URL.revokeObjectURL(url);
  }

}
