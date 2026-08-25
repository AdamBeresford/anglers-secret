import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthService, TOKEN_STORAGE_KEY } from './auth.service';
import { AuthResponse } from './user.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;

  const mockResponse: AuthResponse = {
    token: 'test-token',
    user: { id: '1', username: 'angler', email: 'angler@example.com' },
  };

  beforeEach(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should store the token and user on login', () => {
    service.login('angler@example.com', 'password123').subscribe();

    const req = httpTesting.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);

    expect(service.token).toBe('test-token');
    expect(service.currentUser()?.username).toBe('angler');
    expect(service.isLoggedIn()).toBeTrue();
  });

  it('should store the token and user on signup', () => {
    service.signup('angler', 'angler@example.com', 'password123').subscribe();

    const req = httpTesting.expectOne('/api/auth/signup');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);

    expect(service.token).toBe('test-token');
    expect(service.isLoggedIn()).toBeTrue();
  });

  it('should clear the session on logout', () => {
    service.login('angler@example.com', 'password123').subscribe();
    httpTesting.expectOne('/api/auth/login').flush(mockResponse);

    service.logout();

    expect(service.token).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.isLoggedIn()).toBeFalse();
  });
});
