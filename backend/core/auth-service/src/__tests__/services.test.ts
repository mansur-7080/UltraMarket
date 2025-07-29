/**
 * Services Test Suite
 * Tests for all service classes
 */

import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';

describe('Services Tests', () => {
  let authService: AuthService;
  let userService: UserService;

  beforeAll(() => {
    // Create service instances
    authService = new AuthService();
    userService = new UserService();
  });

  describe('Auth Service', () => {
    it('should be initialized', () => {
      expect(authService).toBeDefined();
      expect(authService).toBeInstanceOf(AuthService);
    });
  });

  describe('User Service', () => {
    it('should be initialized', () => {
      expect(userService).toBeDefined();
      expect(userService).toBeInstanceOf(UserService);
    });
  });
}); 