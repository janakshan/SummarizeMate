import { login, signup, logout, getCurrentUser, getMockUsers } from '../auth';

describe('Auth Module', () => {
  beforeEach(() => {
    logout(); // Clear any existing user session
  });

  describe('Login Function', () => {
    it('should reject empty email', () => {
      expect(() => login({ email: '', password: 'password123' }))
        .toThrow('Email is required');
    });

    it('should reject empty password', () => {
      expect(() => login({ email: 'test@example.com', password: '' }))
        .toThrow('Password is required');
    });

    it('should reject both empty email and password', () => {
      expect(() => login({ email: '', password: '' }))
        .toThrow('Email is required');
    });

    it('should reject whitespace-only email', () => {
      expect(() => login({ email: '   ', password: 'password123' }))
        .toThrow('Email is required');
    });

    it('should reject whitespace-only password', () => {
      expect(() => login({ email: 'test@example.com', password: '   ' }))
        .toThrow('Password is required');
    });

    it('should reject invalid credentials', () => {
      expect(() => login({ email: 'wrong@example.com', password: 'wrongpassword' }))
        .toThrow('Invalid email or password');
    });

    it('should accept valid credentials', () => {
      const result = login({ email: 'test@example.com', password: 'password123' });
      
      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
      
      expect(getCurrentUser()).toEqual(result);
    });

    it('should trim whitespace from valid credentials', () => {
      const result = login({ 
        email: '  test@example.com  ', 
        password: '  password123  ' 
      });
      
      expect(result.email).toBe('test@example.com');
      expect(getCurrentUser()).toEqual(result);
    });
  });

  describe('Signup Function', () => {
    it('should reject empty email', () => {
      expect(() => signup({ email: '', password: 'password123', name: 'Test User' }))
        .toThrow('Email is required');
    });

    it('should reject empty password', () => {
      expect(() => signup({ email: 'new@example.com', password: '', name: 'Test User' }))
        .toThrow('Password is required');
    });

    it('should reject empty name', () => {
      expect(() => signup({ email: 'new@example.com', password: 'password123', name: '' }))
        .toThrow('Name is required');
    });

    it('should reject existing email', () => {
      expect(() => signup({ email: 'test@example.com', password: 'password123', name: 'Another User' }))
        .toThrow('Email already exists');
    });

    it('should create new user with valid data', () => {
      const result = signup({ 
        email: 'new@example.com', 
        password: 'newpassword', 
        name: 'New User' 
      });
      
      expect(result).toEqual({
        id: expect.any(Number),
        email: 'new@example.com',
        password: 'newpassword',
        name: 'New User'
      });
      
      expect(getCurrentUser()).toEqual(result);
    });

    it('should trim whitespace from signup data', () => {
      const result = signup({ 
        email: '  newuser@example.com  ', 
        password: '  newpassword  ', 
        name: '  New User  ' 
      });
      
      expect(result.email).toBe('newuser@example.com');
      expect(result.password).toBe('newpassword');
      expect(result.name).toBe('New User');
    });
  });

  describe('Session Management', () => {
    it('should clear current user on logout', () => {
      login({ email: 'test@example.com', password: 'password123' });
      expect(getCurrentUser()).toBeTruthy();
      
      logout();
      expect(getCurrentUser()).toBeNull();
    });

    it('should return mock users list', () => {
      const users = getMockUsers();
      expect(users).toBeInstanceOf(Array);
      expect(users.length).toBeGreaterThan(0);
      expect(users[0]).toHaveProperty('email');
      expect(users[0]).toHaveProperty('password');
      expect(users[0]).toHaveProperty('name');
    });
  });
});