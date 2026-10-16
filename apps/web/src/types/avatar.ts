export type AvatarGender = 'male' | 'female';

export interface AvatarConfig {
  gender: AvatarGender;
  name: string;
  skinTone: string;
  outfitStyle: 'senator' | 'ankara' | 'casual' | 'owambe';
  outfitColor: string;
  accentColor: string;
  hairStyle: 'fade' | 'afro' | 'fila' | 'dreads' | 'gele' | 'braids' | 'puff' | 'bun';
  hairColor: string;
  sunglasses: boolean;
  goldChain: boolean;
  coralBeads: boolean;
  wristwatch: boolean;
  earrings: boolean;
}

export const SKIN_TONES = [
  { id: 'ebony', name: 'Ebony', color: '#2c1b18' },
  { id: 'espresso', name: 'Espresso', color: '#3f261d' },
  { id: 'chestnut', name: 'Chestnut', color: '#5e3829' },
  { id: 'bronze', name: 'Bronze', color: '#7d4c35' },
  { id: 'caramel', name: 'Caramel', color: '#9e6443' },
];

export const OUTFIT_PALETTES = [
  { id: 'emerald', name: 'Delta Emerald', primary: '#0d5c3a', accent: '#f59e0b' },
  { id: 'royal', name: 'Royal Blue', primary: '#1e3a8a', accent: '#fde047' },
  { id: 'wine', name: 'Owambe Ruby', primary: '#831843', accent: '#fbbf24' },
  { id: 'charcoal', name: 'Urban Shadow', primary: '#1f2937', accent: '#10b981' },
  { id: 'coral', name: 'Sunset Terracotta', primary: '#c2410c', accent: '#fef08a' },
  { id: 'ivory', name: 'Pure White Lace', primary: '#f8fafc', accent: '#d97706' },
];

export const MALE_HAIRSTYLES = [
  { id: 'fade', name: 'Sharp Fade' },
  { id: 'afro', name: 'Classic Afro' },
  { id: 'fila', name: 'Delta Cap / Fila' },
  { id: 'dreads', name: 'Locs' },
];

export const FEMALE_HAIRSTYLES = [
  { id: 'gele', name: 'Royal Gele' },
  { id: 'braids', name: 'Box Braids' },
  { id: 'bun', name: 'Braided Bun' },
  { id: 'puff', name: 'Afro Puff' },
];

export const DEFAULT_MALE_AVATAR: AvatarConfig = {
  gender: 'male',
  name: 'Bros Efe',
  skinTone: '#5e3829',
  outfitStyle: 'senator',
  outfitColor: '#0d5c3a',
  accentColor: '#f59e0b',
  hairStyle: 'fade',
  hairColor: '#111827',
  sunglasses: false,
  goldChain: true,
  coralBeads: false,
  wristwatch: true,
  earrings: false,
};

export const DEFAULT_FEMALE_AVATAR: AvatarConfig = {
  gender: 'female',
  name: 'Sisi Blessing',
  skinTone: '#7d4c35',
  outfitStyle: 'ankara',
  outfitColor: '#831843',
  accentColor: '#fbbf24',
  hairStyle: 'gele',
  hairColor: '#111827',
  sunglasses: false,
  goldChain: false,
  coralBeads: true,
  wristwatch: true,
  earrings: true,
};
