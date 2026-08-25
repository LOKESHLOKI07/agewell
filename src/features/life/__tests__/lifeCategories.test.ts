import { LIFE_CATEGORIES, findLifeCategory } from '../categories';

describe('AgeWell Life categories', () => {
  it('exposes the consumer category architecture without inventing content', () => {
    expect(LIFE_CATEGORIES.map((c) => c.id)).toEqual([
      'movies',
      'music',
      'theatre',
      'books',
      'news',
      'puzzles',
      'learning',
      'cultural',
      'local',
    ]);
    for (const category of LIFE_CATEGORIES) {
      expect(category.title.length).toBeGreaterThan(0);
      expect(category.description.length).toBeGreaterThan(0);
    }
  });

  it('resolves known categories and returns null for unknown ids', () => {
    expect(findLifeCategory('music')?.title).toBe('Music');
    expect(findLifeCategory('missing')).toBeNull();
    expect(findLifeCategory(undefined)).toBeNull();
  });
});
