import { logger } from '../utils/logger';

export interface UserService {
  getUserById(userId: string): Promise<any>;
  validateUser(userId: string): Promise<boolean>;
}

export class UserServiceClient implements UserService {
  private baseUrl: string;

  constructor(baseUrl = process.env.USER_SERVICE_URL || 'http://user-service:3000') {
    this.baseUrl = baseUrl;
  }

  async getUserById(userId: string): Promise<any> {
    try {
      // In a real implementation, this would make an HTTP request to the User Service
      logger.info(`Fetching user with ID: ${userId}`);
      return {
        id: userId,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        isActive: true,
      };
    } catch (error) {
      logger.error(`Error fetching user with ID ${userId}:`, error);
      throw error;
    }
  }

  async validateUser(userId: string): Promise<boolean> {
    try {
      // In a real implementation, this would make an HTTP request to validate the user
      logger.info(`Validating user with ID: ${userId}`);
      return true;
    } catch (error) {
      logger.error(`Error validating user with ID ${userId}:`, error);
      throw error;
    }
  }
}

// Export a singleton instance
export const userService = new UserServiceClient();
export default userService;
