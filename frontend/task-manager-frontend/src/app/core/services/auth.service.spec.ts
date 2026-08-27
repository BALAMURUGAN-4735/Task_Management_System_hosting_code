import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return false for isLoggedIn when token is missing', () => {
    expect(service.isLoggedIn()).toBe(false);
  });

  it('should store user data on successful login', () => {
    const mockUser = {
      token: 'fake.jwt.token',
      role: 'ROLE_ADMIN',
      name: 'Admin User',
      id: '123',
      email: 'admin@test.com'
    };
    const mockResponse = { success: true, message: 'Success', data: mockUser };

    service.login({ email: 'admin@test.com', password: 'password' }).subscribe(res => {
      expect(res.success).toBe(true);
      expect(sessionStorage.getItem('token')).toBe('fake.jwt.token');
      expect(service.getRole()).toBe('ROLE_ADMIN');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should clear storage on logout', () => {
    service.logout();
    expect(service.getToken()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
  });

  it('should verify token expiration logic', () => {
    // Generate a token that expired 1 hour ago
    const pastTimestamp = Math.floor(Date.now() / 1000) - 3600;
    const expiredToken = 'header.' + btoa(JSON.stringify({ exp: pastTimestamp })) + '.signature';
    
    sessionStorage.setItem('token', expiredToken);
    
    expect(service.isLoggedIn()).toBe(false);
  });
});