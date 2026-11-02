export function displayRequestNotes(notes: string | null | undefined): string | null {
  if (!notes?.trim()) {
    return null;
  }
  const cleaned = notes
    .replace(/^Typed grocery list:\s*/i, '')
    .replace(/^Handwritten grocery list photo:\s*/i, '')
    .replace(/^Prescription upload:\s*/i, '')
    .trim();
  return cleaned || null;
}

export function requestNotesTitle(slug: string | null | undefined): string {
  if (slug === 'grocery') {
    return 'Shopping list';
  }
  if (slug === 'medicine') {
    return 'Prescription';
  }
  return 'Request notes';
}
