/**
 * Single source of truth for every hero / page banner size on the site
 * (home hero, store, collections, categories, about). Change it here only.
 */
// Phone (< 768px): 3:4 portrait. Tablet (768-1023px): 4:3. Desktop (>= 1024px):
// 62% of the viewport height, between 380 and 640px. Upload images to match:
// mobile 3:4 (e.g. 1080 x 1440), tablet 4:3 (e.g. 1600 x 1200).
export const HERO_SIZE =
  "w-full relative overflow-hidden aspect-[3/4] md:aspect-[4/3] lg:aspect-auto lg:h-[62vh] lg:min-h-[380px] lg:max-h-[640px]"
export const HERO_IMG = "absolute inset-0 w-full h-full object-cover object-top"
