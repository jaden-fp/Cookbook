export const COOKBOOK_SWATCHES = [
  { bg: '#FF61B4', dark: '#C83E94' },
  { bg: '#9B8EC4', dark: '#7B6EA4' },
  { bg: '#54A0C8', dark: '#3A80A8' },
  { bg: '#E8A254', dark: '#C8823A' },
  { bg: '#54C89B', dark: '#3AA87B' },
  { bg: '#C854A0', dark: '#A83480' },
];

type SvgEl =
  | { tag: 'path'; d: string }
  | { tag: 'circle'; cx: number; cy: number; r: number }
  | { tag: 'line'; x1: number; y1: number; x2: number; y2: number }
  | { tag: 'rect'; x: number; y: number; w: number; h: number; rx?: number };

export type CookbookIconDef = {
  id: string;
  label: string;
  elements: SvgEl[];
};

export const COOKBOOK_ICONS: CookbookIconDef[] = [
  {
    id: 'book',
    label: 'Book',
    elements: [
      { tag: 'path', d: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25' },
    ],
  },
  {
    id: 'cake',
    label: 'Cake',
    elements: [
      { tag: 'rect', x: 4, y: 16, w: 16, h: 5, rx: 1.5 },
      { tag: 'rect', x: 7, y: 11, w: 10, h: 5, rx: 1 },
      { tag: 'line', x1: 12, y1: 7, x2: 12, y2: 11 },
      { tag: 'circle', cx: 12, cy: 6, r: 1.5 },
    ],
  },
  {
    id: 'cupcake',
    label: 'Cupcake',
    elements: [
      { tag: 'path', d: 'M6 14l2 7h8l2-7z' },
      { tag: 'path', d: 'M6 14a6 6 0 0012 0' },
      { tag: 'circle', cx: 12, cy: 6, r: 1.5 },
      { tag: 'line', x1: 12, y1: 7.5, x2: 12, y2: 8.5 },
    ],
  },
  {
    id: 'cookie',
    label: 'Cookie',
    elements: [
      { tag: 'circle', cx: 12, cy: 12, r: 9 },
      { tag: 'circle', cx: 9, cy: 10, r: 1.5 },
      { tag: 'circle', cx: 14.5, cy: 9.5, r: 1.25 },
      { tag: 'circle', cx: 10.5, cy: 15, r: 1.5 },
      { tag: 'circle', cx: 15.5, cy: 14.5, r: 1 },
    ],
  },
  {
    id: 'bread',
    label: 'Bread',
    elements: [
      { tag: 'path', d: 'M3 14Q3 6 12 6Q21 6 21 14V20H3z' },
      { tag: 'line', x1: 8, y1: 17, x2: 16, y2: 17 },
    ],
  },
  {
    id: 'pie',
    label: 'Pie',
    elements: [
      { tag: 'circle', cx: 12, cy: 13, r: 8 },
      { tag: 'line', x1: 12, y1: 13, x2: 12, y2: 5 },
      { tag: 'line', x1: 12, y1: 13, x2: 19.9, y2: 17 },
    ],
  },
  {
    id: 'rollingpin',
    label: 'Rolling Pin',
    elements: [
      { tag: 'rect', x: 6, y: 9, w: 12, h: 6, rx: 3 },
      { tag: 'line', x1: 2, y1: 12, x2: 6, y2: 12 },
      { tag: 'line', x1: 18, y1: 12, x2: 22, y2: 12 },
      { tag: 'circle', cx: 2, cy: 12, r: 1.5 },
      { tag: 'circle', cx: 22, cy: 12, r: 1.5 },
    ],
  },
  {
    id: 'whisk',
    label: 'Whisk',
    elements: [
      { tag: 'line', x1: 12, y1: 21, x2: 12, y2: 14 },
      { tag: 'path', d: 'M12 14C10 12 8 8 12 6' },
      { tag: 'path', d: 'M12 14C14 12 16 8 12 6' },
      { tag: 'path', d: 'M12 14C8 11 6 6 12 6' },
      { tag: 'path', d: 'M12 14C16 11 18 6 12 6' },
    ],
  },
  {
    id: 'star',
    label: 'Star',
    elements: [
      { tag: 'path', d: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z' },
    ],
  },
  {
    id: 'heart',
    label: 'Heart',
    elements: [
      { tag: 'path', d: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z' },
    ],
  },
  {
    id: 'flame',
    label: 'Flame',
    elements: [
      { tag: 'path', d: 'M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z' },
      { tag: 'path', d: 'M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z' },
    ],
  },
  {
    id: 'sparkles',
    label: 'Sparkles',
    elements: [
      { tag: 'path', d: 'M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09Z' },
      { tag: 'path', d: 'M18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456Z' },
    ],
  },
];

export function getSwatch(color: string | null | undefined, fallbackId: number) {
  return (
    COOKBOOK_SWATCHES.find(s => s.bg === color) ??
    COOKBOOK_SWATCHES[fallbackId % COOKBOOK_SWATCHES.length]
  );
}

export function getIconDef(id: string | null | undefined): CookbookIconDef {
  return COOKBOOK_ICONS.find(i => i.id === id) ?? COOKBOOK_ICONS[0];
}
