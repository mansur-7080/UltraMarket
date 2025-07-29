import {
  userSchemas,
  addressSchemas,
  productSchemas,
  orderSchemas,
  cartSchemas,
  reviewSchemas,
  searchSchemas,
  validateId,
  validateEmail,
  validatePassword,
} from '../validation';

describe('Validation Schemas', () => {
  describe('User Schemas', () => {
    describe('register', () => {
      it('should validate valid registration data', () => {
        const validData = {
          email: 'test@example.com',
          password: 'TestPass123!',
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: '+1234567890',
          role: 'CUSTOMER',
        };

        const { error } = userSchemas.register.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should reject invalid email', () => {
        const invalidData = {
          email: 'invalid-email',
          password: 'TestPass123!',
          firstName: 'John',
          lastName: 'Doe',
        };

        const { error } = userSchemas.register.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details[0].message).toContain('email');
      });

      it('should reject weak password', () => {
        const invalidData = {
          email: 'test@example.com',
          password: 'weak',
          firstName: 'John',
          lastName: 'Doe',
        };

        const { error } = userSchemas.register.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details[0].message).toContain('password');
      });

      it('should reject missing required fields', () => {
        const invalidData = {
          email: 'test@example.com',
          password: 'TestPass123!',
        };

        const { error } = userSchemas.register.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details.length).toBeGreaterThan(0);
      });
    });

    describe('login', () => {
      it('should validate valid login data', () => {
        const validData = {
          email: 'test@example.com',
          password: 'TestPass123!',
        };

        const { error } = userSchemas.login.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should reject missing email', () => {
        const invalidData = {
          password: 'TestPass123!',
        };

        const { error } = userSchemas.login.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details[0].message).toContain('email');
      });
    });

    describe('updateProfile', () => {
      it('should validate valid profile update data', () => {
        const validData = {
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: '+1234567890',
          bio: 'Software developer',
          profileImage: 'https://example.com/image.jpg',
        };

        const { error } = userSchemas.updateProfile.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should allow partial updates', () => {
        const validData = {
          firstName: 'John',
        };

        const { error } = userSchemas.updateProfile.validate(validData);
        expect(error).toBeUndefined();
      });
    });
  });

  describe('Address Schemas', () => {
    describe('create', () => {
      it('should validate valid address data', () => {
        const validData = {
          type: 'SHIPPING',
          street1: '123 Main St',
          street2: 'Apt 4B',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'USA',
          isDefault: true,
        };

        const { error } = addressSchemas.create.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should reject invalid address type', () => {
        const invalidData = {
          type: 'INVALID',
          street1: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'USA',
        };

        const { error } = addressSchemas.create.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details[0].message).toContain('type');
      });
    });
  });

  describe('Product Schemas', () => {
    describe('create', () => {
      it('should validate valid product data', () => {
        const validData = {
          name: 'Test Product',
          description: 'This is a test product description',
          price: 99.99,
          compareAtPrice: 129.99,
          costPrice: 50.0,
          sku: 'TEST-SKU-001',
          barcode: '1234567890123',
          weight: 1.5,
          dimensions: {
            length: 10,
            width: 5,
            height: 3,
          },
          categoryId: '550e8400-e29b-41d4-a716-446655440000',
          brandId: '550e8400-e29b-41d4-a716-446655440001',
          tags: ['electronics', 'gadgets'],
          images: ['https://example.com/image1.jpg'],
          isActive: true,
          isFeatured: false,
          inventory: {
            quantity: 100,
            lowStockThreshold: 10,
            trackQuantity: true,
          },
        };

        const { error } = productSchemas.create.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should reject negative price', () => {
        const invalidData = {
          name: 'Test Product',
          description: 'This is a test product description',
          price: -10,
          sku: 'TEST-SKU-001',
          categoryId: '550e8400-e29b-41d4-a716-446655440000',
          inventory: {
            quantity: 100,
          },
        };

        const { error } = productSchemas.create.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details[0].message).toContain('price');
      });
    });
  });

  describe('Order Schemas', () => {
    describe('create', () => {
      it('should validate valid order data', () => {
        const validData = {
          items: [
            {
              productId: '550e8400-e29b-41d4-a716-446655440000',
              quantity: 2,
              price: 99.99,
            },
          ],
          shippingAddressId: '550e8400-e29b-41d4-a716-446655440001',
          billingAddressId: '550e8400-e29b-41d4-a716-446655440002',
          paymentMethod: 'CREDIT_CARD',
          notes: 'Please deliver after 6 PM',
        };

        const { error } = orderSchemas.create.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should reject empty items array', () => {
        const invalidData = {
          items: [],
          shippingAddressId: '550e8400-e29b-41d4-a716-446655440001',
          billingAddressId: '550e8400-e29b-41d4-a716-446655440002',
          paymentMethod: 'CREDIT_CARD',
        };

        const { error } = orderSchemas.create.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details[0].message).toContain('items');
      });
    });
  });

  describe('Cart Schemas', () => {
    describe('addItem', () => {
      it('should validate valid cart item data', () => {
        const validData = {
          productId: '550e8400-e29b-41d4-a716-446655440000',
          quantity: 3,
        };

        const { error } = cartSchemas.addItem.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should reject zero quantity', () => {
        const invalidData = {
          productId: '550e8400-e29b-41d4-a716-446655440000',
          quantity: 0,
        };

        const { error } = cartSchemas.addItem.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details[0].message).toContain('quantity');
      });
    });
  });

  describe('Review Schemas', () => {
    describe('create', () => {
      it('should validate valid review data', () => {
        const validData = {
          productId: '550e8400-e29b-41d4-a716-446655440000',
          rating: 5,
          title: 'Great product!',
          comment: 'This product exceeded my expectations. Highly recommended!',
          images: ['https://example.com/review1.jpg'],
        };

        const { error } = reviewSchemas.create.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should reject rating outside 1-5 range', () => {
        const invalidData = {
          productId: '550e8400-e29b-41d4-a716-446655440000',
          rating: 6,
          title: 'Great product!',
          comment: 'This product exceeded my expectations.',
        };

        const { error } = reviewSchemas.create.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details[0].message).toContain('rating');
      });
    });
  });

  describe('Search Schemas', () => {
    describe('search', () => {
      it('should validate valid search data', () => {
        const validData = {
          query: 'laptop',
          category: 'electronics',
          brand: 'Apple',
          minPrice: 500,
          maxPrice: 2000,
          rating: 4,
          inStock: true,
          sortBy: 'price',
          sortOrder: 'asc',
          page: 1,
          limit: 20,
        };

        const { error } = searchSchemas.search.validate(validData);
        expect(error).toBeUndefined();
      });

      it('should reject empty query', () => {
        const invalidData = {
          query: '',
          category: 'electronics',
        };

        const { error } = searchSchemas.search.validate(invalidData);
        expect(error).toBeDefined();
        expect(error?.details[0].message).toContain('query');
      });
    });
  });
});

describe('Validation Functions', () => {
  describe('validateId', () => {
    it('should validate valid UUID', () => {
      const validId = '550e8400-e29b-41d4-a716-446655440000';
      expect(validateId(validId)).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const invalidId = 'invalid-uuid';
      expect(validateId(invalidId)).toBe(false);
    });

    it('should reject empty string', () => {
      expect(validateId('')).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should validate valid email', () => {
      const validEmail = 'test@example.com';
      expect(validateEmail(validEmail)).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidEmail = 'invalid-email';
      expect(validateEmail(invalidEmail)).toBe(false);
    });

    it('should reject empty string', () => {
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong password', () => {
      const strongPassword = 'TestPass123!';
      expect(validatePassword(strongPassword)).toBe(true);
    });

    it('should reject weak password', () => {
      const weakPassword = 'weak';
      expect(validatePassword(weakPassword)).toBe(false);
    });

    it('should reject password without uppercase', () => {
      const password = 'testpass123!';
      expect(validatePassword(password)).toBe(false);
    });

    it('should reject password without lowercase', () => {
      const password = 'TESTPASS123!';
      expect(validatePassword(password)).toBe(false);
    });

    it('should reject password without number', () => {
      const password = 'TestPass!';
      expect(validatePassword(password)).toBe(false);
    });

    it('should reject password without special character', () => {
      const password = 'TestPass123';
      expect(validatePassword(password)).toBe(false);
    });
  });
});
