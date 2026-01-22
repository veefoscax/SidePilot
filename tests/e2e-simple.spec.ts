import { test, expect } from '@playwright/test';

test.describe('Simple Test', () => {
  test('should pass', async () => {
    expect(1 + 1).toBe(2);
  });
});
