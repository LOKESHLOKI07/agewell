export const LIFE_CATEGORIES = [
  { id: 'movies', title: 'Movies', description: 'Films and cinema for every mood', icon: 'sparkles' as const },
  { id: 'music', title: 'Music', description: 'Songs, playlists, and classical listening', icon: 'music' as const },
  { id: 'theatre', title: 'Theatre', description: 'Plays and stage performances', icon: 'calendar-star' as const },
  { id: 'books', title: 'Books', description: 'Stories and reading lists', icon: 'document-text-outline' as const },
  { id: 'news', title: 'News', description: 'Trusted daily news summaries', icon: 'newspaper' as const },
  { id: 'puzzles', title: 'Puzzles', description: 'Brain games and light challenges', icon: 'puzzle' as const },
  { id: 'learning', title: 'Learning', description: 'Courses and skills at your pace', icon: 'ribbon-outline' as const },
  {
    id: 'cultural',
    title: 'Cultural Activities',
    description: 'Festivals, traditions, and arts',
    icon: 'heart-outline' as const,
  },
  {
    id: 'local',
    title: 'Local Activities',
    description: 'Nearby outings and community life',
    icon: 'location' as const,
  },
] as const;

export type LifeCategoryId = (typeof LIFE_CATEGORIES)[number]['id'];

export function findLifeCategory(id: string | undefined) {
  return LIFE_CATEGORIES.find((category) => category.id === id) ?? null;
}
