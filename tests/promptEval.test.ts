import { vi, describe, it, expect, beforeEach } from 'vitest';
import { extractIncident, generateRecommendations } from '../lib/gemini';

const { mockGenerateContent } = vi.hoisted(() => {
  return { mockGenerateContent: vi.fn() };
});

vi.mock('@google/genai', () => {
  class MockGoogleGenAI {
    models = {
      generateContent: mockGenerateContent,
    };
  }
  return {
    GoogleGenAI: MockGoogleGenAI,
    Type: {
      OBJECT: 'OBJECT',
      STRING: 'STRING',
      NUMBER: 'NUMBER',
      ARRAY: 'ARRAY',
      INTEGER: 'INTEGER',
    },
  };
});

describe('Prompt Evaluation and LLM Parser Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call Gemini generateContent with correct prompts for extraction and parse structured output', async () => {
    const fakeExtractResponse = {
      location: 'Gate A',
      category: 'Crowd',
      severity: 'High',
      confidence: 0.95,
      description: 'Bottleneck queue forming at Gate A entrance.',
      suggested_teams: ['Stewards', 'Security'],
    };

    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(fakeExtractResponse),
    });

    const result = await extractIncident('Gate A queue is huge and crowded, need help');

    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    const callArgs = mockGenerateContent.mock.calls[0][0];
    
    // Assert prompt format and contents
    expect(callArgs.config.systemInstruction).toContain('Analyze the following text reported by ground staff');
    expect(callArgs.contents).toContain('Gate A queue is huge and crowded, need help');
    
    // Assert response schemas are present
    expect(callArgs.config.responseMimeType).toBe('application/json');
    expect(callArgs.config.responseSchema.properties.location.enum).toContain('Gate A');
    
    // Assert parsed output structure matches
    expect(result).toEqual(fakeExtractResponse);
  });

  it('should call Gemini generateContent for recommendations and return sorted priorities', async () => {
    const fakeRecommendationsResponse = {
      recommendations: [
        {
          action: 'Open overflow barriers at Gate B',
          reasoning: 'Reduces queue pressure from adjacent Gates.',
          priority: 2,
        },
        {
          action: 'Deploy 4 additional stewards to Gate A',
          reasoning: 'Handles immediate security check backup.',
          priority: 1,
        },
      ],
    };

    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify(fakeRecommendationsResponse),
    });

    const newIncident = {
      location: 'Gate A' as const,
      category: 'Crowd' as const,
      severity: 'High' as const,
      description: 'Bottleneck queue forming at Gate A entrance.',
      suggested_teams: ['Stewards'],
    };

    const result = await generateRecommendations(newIncident, []);

    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    const callArgs = mockGenerateContent.mock.calls[0][0];
    
    // Assert prompt contents
    expect(callArgs.config.systemInstruction).toContain('AI Operations Copilot');
    expect(callArgs.contents).toContain('Gate A');
    
    // Assert result is sorted by priority ascending (priority 1 first, then 2)
    expect(result.length).toBe(2);
    expect(result[0].priority).toBe(1);
    expect(result[0].action).toBe('Deploy 4 additional stewards to Gate A');
    expect(result[1].priority).toBe(2);
  });

  it('should transparently fall back to rule-based parser on JSON parse failure', async () => {
    // Return invalid JSON to trigger the catch block fallback
    mockGenerateContent.mockResolvedValueOnce({
      text: 'invalid json response',
    });

    const result = await extractIncident('Medical emergency in South Stand: CPR in progress!');
    
    // Assert that fallback still extracted correct category and severity based on keywords
    expect(result.category).toBe('Medical');
    expect(result.severity).toBe('Critical');
    expect(result.location).toBe('South Stand');
  });
});
