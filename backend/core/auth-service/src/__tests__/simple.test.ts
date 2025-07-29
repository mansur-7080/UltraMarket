/**
 * Simple Test Suite
 * Basic functionality tests
 */

describe('Simple Tests', () => {
  it('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle string operations', () => {
    const str = 'hello world';
    expect(str.length).toBe(11);
    expect(str.toUpperCase()).toBe('HELLO WORLD');
  });

  it('should handle array operations', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(arr.length).toBe(5);
    expect(arr.reduce((a, b) => a + b, 0)).toBe(15);
  });
}); 