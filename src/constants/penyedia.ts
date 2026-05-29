// Enum & data penyedia produk RS Rubini

export const PENYEDIA = {
  DWP: 'DWP',
  MONA: 'Mona',
  HARIAN: 'Harian',
  KERING: 'Kering',
} as const;

export type PenyediaType = (typeof PENYEDIA)[keyof typeof PENYEDIA];

export interface PenyediaInfo {
  id: number;
  nama: PenyediaType;
  label: string;
  icon: string; // MaterialCommunityIcons name
  color: string;
  bgColor: string;
}

export const PENYEDIA_LIST: PenyediaInfo[] = [
  {
    id: 1,
    nama: PENYEDIA.DWP,
    label: 'DWP',
    icon: 'cookie',
    color: '#1565C0',
    bgColor: '#E3F2FD',
  },
  {
    id: 2,
    nama: PENYEDIA.MONA,
    label: 'Mona',
    icon: 'cupcake',
    color: '#AD1457',
    bgColor: '#FCE4EC',
  },
  {
    id: 3,
    nama: PENYEDIA.HARIAN,
    label: 'Harian',
    icon: 'food-apple',
    color: '#F57C00',
    bgColor: '#FFF3E0',
  },
  {
    id: 4,
    nama: PENYEDIA.KERING,
    label: 'Kering',
    icon: 'package-variant-closed',
    color: '#2E7D32',
    bgColor: '#E8F5E9',
  },
];

export const POTONGAN_RS_OPTIONS = [
  { label: 'Tanpa Potongan', value: 'none' },
  { label: '10%', value: '10%' },
  { label: '20%', value: '20%' },
] as const;

export type PotonganRS = (typeof POTONGAN_RS_OPTIONS)[number]['value'];

export const METODE_BAYAR = {
  TUNAI: 'tunai',
  QRIS: 'qris',
} as const;

export type MetodeBayar = (typeof METODE_BAYAR)[keyof typeof METODE_BAYAR];

export function getPenyediaById(id: number): PenyediaInfo | undefined {
  return PENYEDIA_LIST.find((p) => p.id === id);
}

export function getPenyediaByNama(nama: string): PenyediaInfo | undefined {
  return PENYEDIA_LIST.find((p) => p.nama === nama);
}
