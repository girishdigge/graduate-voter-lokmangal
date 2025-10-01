import { describe, it, expect } from 'vitest';

describe('Admin App', () => {
  it('should be able to run tests', () => {
    expect(true).toBe(true);
  });

  it('should be able to import App component', async () => {
    const { default: App } = await import('../App');
    expect(App).toBeDefined();
    expect(typeof App).toBe('function');
  });
});
