import { jest } from '@jest/globals';

const mockUserService = {
  getUserById: jest.fn(),
  validateUser: jest.fn(),
};

// Default implementation of mock functions
mockUserService.getUserById.mockImplementation(async (userId) => {
  return {
    id: userId,
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    isActive: true,
  };
});

mockUserService.validateUser.mockImplementation(async (userId) => {
  return true;
});

export default mockUserService;
