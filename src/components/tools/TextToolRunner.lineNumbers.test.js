/**
 * Tests for the inline line-number generation logic in TextToolRunner.jsx.
 *
 * The PR replaced the memoised <LineNumbers> component with an inline
 * expression used in both the input pane and the output pane:
 *
 *   (text || ' ').split('\n').map((_, i) => <div key={i}>{i + 1}</div>)
 *
 * This file tests the pure computation that expression performs so that
 * regressions are caught without requiring a full React/JSDOM environment.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------------------
// Pure helper that mirrors the inline JSX expression in TextToolRunner.jsx.
// Returns an array of 1-based line numbers (what would appear as div children).
// ---------------------------------------------------------------------------
function getLineNumbers(text) {
    return (text || ' ').split('\n').map((_, i) => i + 1);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TextToolRunner inline line-number generation', () => {
    // -----------------------------------------------------------------------
    // Empty / nullish input — the || ' ' guard ensures at least one line
    // -----------------------------------------------------------------------

    it('returns [1] for an empty string (|| " " guard)', () => {
        assert.deepEqual(getLineNumbers(''), [1]);
    });

    it('returns [1] for undefined (|| " " guard)', () => {
        assert.deepEqual(getLineNumbers(undefined), [1]);
    });

    it('returns [1] for null (|| " " guard)', () => {
        assert.deepEqual(getLineNumbers(null), [1]);
    });

    // -----------------------------------------------------------------------
    // Single-line strings
    // -----------------------------------------------------------------------

    it('returns [1] for a single line without a trailing newline', () => {
        assert.deepEqual(getLineNumbers('hello'), [1]);
    });

    it('returns [1] for a string that is just a space', () => {
        assert.deepEqual(getLineNumbers(' '), [1]);
    });

    // -----------------------------------------------------------------------
    // Multi-line strings
    // -----------------------------------------------------------------------

    it('returns [1, 2] for two lines', () => {
        assert.deepEqual(getLineNumbers('line1\nline2'), [1, 2]);
    });

    it('returns [1, 2, 3] for three lines', () => {
        assert.deepEqual(getLineNumbers('a\nb\nc'), [1, 2, 3]);
    });

    it('handles a trailing newline (produces an extra line number)', () => {
        // 'a\n' splits to ['a', ''] — two elements → [1, 2]
        assert.deepEqual(getLineNumbers('a\n'), [1, 2]);
    });

    it('handles multiple consecutive newlines correctly', () => {
        // 'a\n\nb' splits to ['a', '', 'b'] → [1, 2, 3]
        assert.deepEqual(getLineNumbers('a\n\nb'), [1, 2, 3]);
    });

    it('handles CRLF line endings as two-character separators (no split on \\r)', () => {
        // The expression only splits on '\n', so '\r\n' gives ['a\r', 'b'] → [1, 2]
        assert.deepEqual(getLineNumbers('a\r\nb'), [1, 2]);
    });

    // -----------------------------------------------------------------------
    // Consistency between input and output pane usage
    // -----------------------------------------------------------------------

    it('produces identical results when called twice with the same text (input vs output pane)', () => {
        const text = 'foo\nbar\nbaz';
        assert.deepEqual(getLineNumbers(text), getLineNumbers(text));
    });

    // -----------------------------------------------------------------------
    // Line number values are 1-based
    // -----------------------------------------------------------------------

    it('first line number is always 1', () => {
        const nums = getLineNumbers('anything');
        assert.equal(nums[0], 1);
    });

    it('last line number equals total line count', () => {
        const text = 'x\ny\nz\nw';
        const nums = getLineNumbers(text);
        const expectedCount = text.split('\n').length;
        assert.equal(nums[nums.length - 1], expectedCount);
    });

    it('line numbers are strictly consecutive integers starting at 1', () => {
        const nums = getLineNumbers('1\n2\n3\n4\n5');
        for (let i = 0; i < nums.length; i++) {
            assert.equal(nums[i], i + 1, `Expected line number at index ${i} to be ${i + 1}`);
        }
    });

    // -----------------------------------------------------------------------
    // Large input — regression guard for performance-sensitive path
    // -----------------------------------------------------------------------

    it('handles 1000-line input and returns exactly 1000 line numbers', () => {
        const text = Array.from({ length: 1000 }, (_, i) => `line ${i + 1}`).join('\n');
        const nums = getLineNumbers(text);
        assert.equal(nums.length, 1000);
        assert.equal(nums[0], 1);
        assert.equal(nums[999], 1000);
    });
});