import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const configSource = readFileSync(join(process.cwd(), 'next.config.ts'), 'utf8');

describe('TrustOS module framing security', () => {
  it('allows only same-origin framing so the workspace can render protected modules', () => {
    expect(configSource).toContain("frame-ancestors 'self'");
    expect(configSource).not.toContain("frame-ancestors 'none'");
    expect(configSource).toContain("frame-src 'self'");
  });
});
