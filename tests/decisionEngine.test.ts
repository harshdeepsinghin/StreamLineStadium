import { describe, it, expect } from 'vitest';
import { 
  calculatePriorityScore, 
  getFallbackIncident, 
  getFallbackRecommendations 
} from '../lib/decisionEngine';

describe('Decision Engine Unit Tests', () => {
  describe('calculatePriorityScore', () => {
    it('should compute base scores for each severity level with zero zone count', () => {
      expect(calculatePriorityScore('Low', 0)).toBe(2);
      expect(calculatePriorityScore('Medium', 0)).toBe(4);
      expect(calculatePriorityScore('High', 0)).toBe(7);
      expect(calculatePriorityScore('Critical', 0)).toBe(9);
    });

    it('should boost priority based on recent active incidents in same zone', () => {
      // Low (base 2) + 2 incidents (boost 2 * 0.8 = 1.6) = 3.6
      expect(calculatePriorityScore('Low', 2)).toBeCloseTo(3.6);
      
      // High (base 7) + 1 incident (boost 1 * 0.8 = 0.8) = 7.8
      expect(calculatePriorityScore('High', 1)).toBeCloseTo(7.8);
    });

    it('should cap the maximum priority score at 10', () => {
      // Critical (base 9) + 5 incidents (boost 5 * 0.8 = 4.0) = 13 -> capped at 10
      expect(calculatePriorityScore('Critical', 5)).toBe(10);
    });
  });

  describe('getFallbackIncident (Keyword Parser)', () => {
    it('should detect location when present in text', () => {
      const result1 = getFallbackIncident('Fight at Gate C, send security');
      expect(result1.location).toBe('Gate C');

      const result2 = getFallbackIncident('Water overflow in north stand');
      expect(result2.location).toBe('North Stand');
    });

    it('should return Unknown location if not specified in text', () => {
      const result = getFallbackIncident('Someone fainted and needs CPR');
      expect(result.location).toBe('Unknown');
    });

    it('should detect Crowd category, security severity, and suggest teams', () => {
      const result = getFallbackIncident('Extremely long queues and bottlenecks at gate A');
      expect(result.category).toBe('Crowd');
      expect(result.severity).toBe('Medium'); // "slow/clogged" triggers Medium
      expect(result.suggested_teams).toContain('Stewards');
      expect(result.suggested_teams).toContain('Security');
    });

    it('should detect critical medical emergencies', () => {
      const result = getFallbackIncident('A fan fainted and requires urgent CPR in section 10');
      expect(result.category).toBe('Medical');
      expect(result.severity).toBe('Critical'); // "CPR/unconscious" triggers Critical
      expect(result.suggested_teams).toContain('Medical Team');
    });

    it('should detect security altercations', () => {
      const result = getFallbackIncident('Two fans started a fist fight near Gate C');
      expect(result.category).toBe('Security');
      expect(result.severity).toBe('High'); // "fight" triggers High
      expect(result.suggested_teams).toContain('Security');
    });
  });

  describe('getFallbackRecommendations', () => {
    it('should return appropriate crowd actions', () => {
      const recs = getFallbackRecommendations('Crowd', 'Gate A');
      expect(recs.length).toBeGreaterThan(0);
      expect(recs[0].action).toContain('stewards');
      expect(recs[0].action).toContain('Gate A');
    });

    it('should return appropriate medical actions', () => {
      const recs = getFallbackRecommendations('Medical', 'South Stand');
      expect(recs.length).toBeGreaterThan(0);
      expect(recs[0].action).toContain('First Responder');
      expect(recs[0].action).toContain('South Stand');
    });
  });
});
