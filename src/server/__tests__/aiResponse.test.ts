import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { requireApiKey, extractGroundingSources, withAiFallback } from '../aiResponse';

describe('aiResponse helpers', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('requireApiKey', () => {
    it('returns api key when present', () => {
      process.env.GEMINI_API_KEY = 'test-key';
      expect(requireApiKey()).toBe('test-key');
    });

    it('throws error when api key is missing', () => {
      delete process.env.GEMINI_API_KEY;
      expect(() => requireApiKey()).toThrow('GEMINI_API_KEY is not defined in the environment. Please add it via Settings > Secrets.');
    });
  });

  describe('extractGroundingSources', () => {
    it('extracts sources correctly', () => {
      const mockResponse = {
        candidates: [{
          groundingMetadata: {
            groundingChunks: [
              { web: { title: 'Source 1', uri: 'https://example.com/1' } },
              { web: { title: 'Source 2', uri: 'https://example.com/2' } }
            ]
          }
        }]
      };
      
      const sources = extractGroundingSources(mockResponse);
      expect(sources).toHaveLength(2);
      expect(sources[0].title).toBe('Source 1');
      expect(sources[0].uri).toBe('https://example.com/1');
    });

    it('returns empty array when no sources are present', () => {
      expect(extractGroundingSources({})).toEqual([]);
    });

    it('filters out chunks without uri', () => {
      const mockResponse = {
        candidates: [{
          groundingMetadata: {
            groundingChunks: [
              { web: { title: 'Source 1' } }
            ]
          }
        }]
      };
      expect(extractGroundingSources(mockResponse)).toEqual([]);
    });
  });

  describe('withAiFallback', () => {
    const mockFallback = () => ({ status: 'fallback_active' });
    const contextName = 'Test Context';

    it('returns parsed data on success', async () => {
      const mockSuccessCall = vi.fn().mockResolvedValue({
        text: JSON.stringify({ status: 'success' }),
        candidates: [{
          groundingMetadata: {
            groundingChunks: [{ web: { title: 'Success Source', uri: 'http://success' } }]
          }
        }]
      });

      const result = await withAiFallback(mockSuccessCall, mockFallback, contextName);
      
      expect(result.isFallback).toBe(false);
      expect(result.data).toEqual({ status: 'success' });
      expect(result.sources).toHaveLength(1);
    });

    it('calls fallback on AI error (e.g. Quota Exceeded)', async () => {
      const mockFailCall = vi.fn().mockRejectedValue(new Error('Quota Exceeded'));

      const result = await withAiFallback(mockFailCall, mockFallback, contextName);
      
      expect(result.isFallback).toBe(true);
      expect(result.data).toEqual({ status: 'fallback_active' });
      expect(result.error).toBe('Quota Exceeded');
      expect(result.sources[0].title).toContain('Mode Analitik Lokal');
    });

    it('calls fallback on JSON parse error', async () => {
      const mockParseFailCall = vi.fn().mockResolvedValue({
        text: 'invalid json data'
      });

      const result = await withAiFallback(mockParseFailCall, mockFallback, contextName);
      
      expect(result.isFallback).toBe(true);
      expect(result.data).toEqual({ status: 'fallback_active' });
      expect(result.error).toContain('Unexpected token');
    });
  });
});
