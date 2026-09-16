export type AddonBookOption = {
  id: string;
  label: string;
  price: string;
};

export type AddonBookNow = {
  slug: string;
  title: string;
  lines: string[];
  options?: AddonBookOption[];
};

/** Legacy book-now catalogue — all home add-ons now use dedicated gate screens. */
export const ADDON_BOOK_NOW: AddonBookNow[] = [];

export function findAddonBookNow(slug: string | undefined): AddonBookNow | null {
  if (!slug) {
    return null;
  }
  return ADDON_BOOK_NOW.find((item) => item.slug === slug) ?? null;
}
