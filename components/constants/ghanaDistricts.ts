import type { GhanaRegion } from './ghanaRegions';

/** Sample districts per region — extend as needed; users can still type custom districts. */
export const DISTRICTS_BY_REGION: Partial<Record<GhanaRegion | string, string[]>> = {
  'Greater Accra': [
    'Accra Metropolitan',
    'Tema Metropolitan',
    'Ga East',
    'Ga West',
    'Ga Central',
    'Ledzokuku',
    'Krowor',
    'Adentan',
    'Ashaiman',
  ],
  Ashanti: ['Kumasi Metropolitan', 'Asokore Mampong', 'Oforikrom', 'Suame', 'Ejisu', 'Obuasi'],
  Western: ['Sekondi-Takoradi Metropolitan', 'Ahanta West', 'Tarkwa-Nsuaem', 'Prestea-Huni Valley'],
  Central: ['Cape Coast Metropolitan', 'Komenda-Edina-Eguafo-Abirem', 'Mfantsiman', 'Agona West'],
  Eastern: ['New Juaben South', 'Akuapim North', 'Suhum', 'Kwahu Afram Plains North'],
  Volta: ['Ho Municipal', 'Hohoe', 'Keta', 'Ketu South'],
  Northern: ['Tamale Metropolitan', 'Sagnarigu', 'Yendi', 'Gushegu'],
  'Upper East': ['Bolgatanga Municipal', 'Bawku Municipal', 'Kassena-Nankana'],
  'Upper West': ['Wa Municipal', 'Lawra', 'Jirapa'],
  Bono: ['Sunyani Municipal', 'Berekum East', 'Dormaa Central'],
  'Bono East': ['Techiman Municipal', 'Atebubu-Amantin', 'Kintampo North'],
  Ahafo: ['Goaso Municipal', 'Tano North', 'Asunafo North'],
  'Western North': ['Sefwi-Wiawso', 'Bibiani-Anhwiaso-Bekwai', 'Juaboso'],
  'North East': ['Nalerigu-Gambaga', 'Walewale', 'Bunkpurugu-Nakpanduri'],
  Savannah: ['Damongo', 'Bole', 'Salaga North'],
  Oti: ['Dambai', 'Jasikan', 'Krachi East'],
};
