import { describe, it, expect } from 'vitest';

describe('AadharCheckModal', () => {
  it('should be importable', async () => {
    const { AadharCheckModal } = await import(
      '../../../components/ui/AadharCheckModal'
    );
    expect(AadharCheckModal).toBeDefined();
    expect(typeof AadharCheckModal).toBe('function');
  });
});
