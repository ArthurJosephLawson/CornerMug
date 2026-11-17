export const theme = {
  colors: {
    ivory: '#FAF7F2',
    ivoryDeep: '#F5F2EB',
    charcoal: '#1E1E24',
    charcoalSoft: '#2A2A32',
    lavender: '#C8B6FF',
    lavenderDeep: '#A98FE8',
    pink: '#F4ACB7',
    pinkDeep: '#E58CA0',
    butter: '#FDE49E',
    butterDeep: '#F0CE6B',
    sage: '#B7E4C7',
    sageDeep: '#8CCBA0',
    powder: '#BDE0FE',
    powderDeep: '#8FC4F2',
    peach: '#FFD6BA',
    peachDeep: '#F2B98A',
  },
  radius: {
    card: '1rem',
    cardLarge: '1.5rem',
    pill: '9999px',
  },
  font: {
    sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
  },
} as const;

export type ThemeColorKey = keyof typeof theme.colors;

export interface PastelToken {
  key: string;
  label: string;
  hex: string;
  deep: string;
}

export const pastelPalette: PastelToken[] = [
  { key: 'lavender', label: 'Muted Lavender', hex: theme.colors.lavender, deep: theme.colors.lavenderDeep },
  { key: 'pink', label: 'Dusty Pink', hex: theme.colors.pink, deep: theme.colors.pinkDeep },
  { key: 'butter', label: 'Soft Butter Yellow', hex: theme.colors.butter, deep: theme.colors.butterDeep },
  { key: 'sage', label: 'Sage Green', hex: theme.colors.sage, deep: theme.colors.sageDeep },
  { key: 'powder', label: 'Powder Blue', hex: theme.colors.powder, deep: theme.colors.powderDeep },
  { key: 'peach', label: 'Subtle Peach', hex: theme.colors.peach, deep: theme.colors.peachDeep },
];
