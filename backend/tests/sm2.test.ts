import { calculateSM2, getWordStatus } from '../src/services/sm2';

describe('SM-2 Algorithm', () => {
  describe('New word – first review', () => {
    it('Again (0): resets to interval=1, repetitions=0', () => {
      const result = calculateSM2({ repetitions: 0, easinessFactor: 2.5, intervalDays: 0, rating: 0 });
      expect(result.repetitions).toBe(0);
      expect(result.intervalDays).toBe(1);
      expect(result.easinessFactor).toBeLessThan(2.5);
    });

    it('Hard (1): maps to quality 3 – borderline pass (q>=3), repetitions increments', () => {
      const result = calculateSM2({ repetitions: 0, easinessFactor: 2.5, intervalDays: 0, rating: 1 });
      expect(result.repetitions).toBe(1);
      expect(result.intervalDays).toBe(1);
      // EF decreases on quality=3 relative to 2.5
      expect(result.easinessFactor).toBeLessThan(2.5);
    });

    it('Good (2): maps to quality 4 – first success, interval=1', () => {
      const result = calculateSM2({ repetitions: 0, easinessFactor: 2.5, intervalDays: 0, rating: 2 });
      expect(result.repetitions).toBe(1);
      expect(result.intervalDays).toBe(1);
    });

    it('Easy (3): maps to quality 5 – first success, interval=1', () => {
      const result = calculateSM2({ repetitions: 0, easinessFactor: 2.5, intervalDays: 0, rating: 3 });
      expect(result.repetitions).toBe(1);
      expect(result.intervalDays).toBe(1);
    });
  });

  describe('Second review (repetitions=1)', () => {
    it('Good: interval becomes 6', () => {
      const result = calculateSM2({ repetitions: 1, easinessFactor: 2.5, intervalDays: 1, rating: 2 });
      expect(result.repetitions).toBe(2);
      expect(result.intervalDays).toBe(6);
    });

    it('Easy: interval becomes 6, EF increases', () => {
      const result = calculateSM2({ repetitions: 1, easinessFactor: 2.5, intervalDays: 1, rating: 3 });
      expect(result.intervalDays).toBe(6);
      expect(result.easinessFactor).toBeGreaterThan(2.5);
    });
  });

  describe('Subsequent reviews (repetitions >= 2)', () => {
    it('interval = round(prev_interval * EF)', () => {
      const result = calculateSM2({ repetitions: 2, easinessFactor: 2.5, intervalDays: 6, rating: 2 });
      expect(result.intervalDays).toBe(Math.round(6 * 2.5));
      expect(result.repetitions).toBe(3);
    });

    it('Easy increases EF above 2.5', () => {
      const result = calculateSM2({ repetitions: 2, easinessFactor: 2.5, intervalDays: 6, rating: 3 });
      expect(result.easinessFactor).toBeGreaterThan(2.5);
    });

    it('Again resets repetitions and interval', () => {
      const result = calculateSM2({ repetitions: 5, easinessFactor: 2.5, intervalDays: 30, rating: 0 });
      expect(result.repetitions).toBe(0);
      expect(result.intervalDays).toBe(1);
    });
  });

  describe('EF floor', () => {
    it('EF never drops below 1.3', () => {
      let state = { repetitions: 0, easinessFactor: 1.4, intervalDays: 0 };
      for (let i = 0; i < 20; i++) {
        const result = calculateSM2({ ...state, rating: 0 });
        state = { repetitions: result.repetitions, easinessFactor: result.easinessFactor, intervalDays: result.intervalDays };
        expect(result.easinessFactor).toBeGreaterThanOrEqual(1.3);
      }
    });
  });

  describe('nextReviewDate', () => {
    it('is set to today + intervalDays', () => {
      const result = calculateSM2({ repetitions: 0, easinessFactor: 2.5, intervalDays: 0, rating: 2 });
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(result.nextReviewDate.toDateString()).toBe(tomorrow.toDateString());
    });
  });

  describe('getWordStatus', () => {
    it('new: repetitions=0', () => expect(getWordStatus(0, 0)).toBe('new'));
    it('learning: interval<=1', () => expect(getWordStatus(1, 1)).toBe('learning'));
    it('review: interval<21', () => expect(getWordStatus(3, 10)).toBe('review'));
    it('master: interval>=21', () => expect(getWordStatus(5, 30)).toBe('master'));
  });
});
