import { describe, it, expect } from 'vitest';

describe('Button Component', () => {
  it('should be importable', async () => {
    const { Button } = await import('../../../components/ui/Button');
    expect(Button).toBeDefined();
    expect(typeof Button).toBe('object'); // React component
  });

  it('should have correct display name', async () => {
    const { Button } = await import('../../../components/ui/Button');
    expect(Button.displayName).toBe('Button');
  });
});
