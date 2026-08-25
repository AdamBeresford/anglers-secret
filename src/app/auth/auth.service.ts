import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { AuthResponse, User } from './user.model';

export const TOKEN_STORAGE_KEY = 'anglers-secret-token';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private static readonly SIGNUP_PATH = '/api/auth/signup';
  private static readonly LOGIN_PATH = '/api/auth/login';
  private static readonly ME_PATH = '/api/auth/me';

  private http = inject(HttpClient);

  currentUser = signal<User | null>(null);
  isLoggedIn = computed(() => this.currentUser() !== null);

  constructor() {
    this.restoreSession();
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  signup(username: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(AuthService.SIGNUP_PATH, { username, email, password }).pipe(
      tap((response) => this.startSession(response))
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(AuthService.LOGIN_PATH, { email, password }).pipe(
      tap((response) => this.startSession(response))
    );
  }

  logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    this.currentUser.set(null);
  }

  private startSession(response: AuthResponse) {
    localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
    this.currentUser.set(response.user);
  }

  private restoreSession() {
    if (!this.token) return;

    this.http.get<{ user: User }>(AuthService.ME_PATH).subscribe({
      next: (response) => this.currentUser.set(response.user),
      error: () => this.logout(),
    });
  }

}
