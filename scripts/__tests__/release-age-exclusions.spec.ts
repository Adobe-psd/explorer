import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

// The kit 8.3.0 upgrade exempted its same-day releases from the release-age quarantine. They
// clear the window on this date, and the exemption must not outlive the reason for it.
const EXPIRES_ON = Date.parse('2026-09-23T00:00:00Z');

// @solana-program/memo 0.14.1 was exempted the same way; it clears the window on this date.
const MEMO_EXPIRES_ON = Date.parse('2026-09-30T00:00:00Z');

function expiredExemptions(workspace: string, now: number): string[] {
    const names = workspace
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith("- '") && line.endsWith("'"))
        .map(line => line.slice(3, -1));
    return names.filter(name => {
        if (name === '@solana-program/memo') return now >= MEMO_EXPIRES_ON;
        if (name.startsWith('@solana/') || name === 'undici-types') return now >= EXPIRES_ON;
        return false;
    });
}

describe('release-age exemptions', () => {
    const workspace = readFileSync(path.join(process.cwd(), 'pnpm-workspace.yaml'), 'utf8');

    test('should report nothing the day before the exemptions expire', () => {
        expect(expiredExemptions(workspace, EXPIRES_ON - 1)).toEqual([]);
    });

    test('should report the kit exemptions on the day they expire', () => {
        expect(expiredExemptions(workspace, EXPIRES_ON)).toContain('@solana/kit');
    });

    test('should report the memo exemption on the day it expires', () => {
        expect(expiredExemptions(workspace, MEMO_EXPIRES_ON - 1)).not.toContain('@solana-program/memo');
        expect(expiredExemptions(workspace, MEMO_EXPIRES_ON)).toContain('@solana-program/memo');
    });

    test('should carry no expired exemption', () => {
        expect(expiredExemptions(workspace, Date.now())).toEqual([]);
    });
});
