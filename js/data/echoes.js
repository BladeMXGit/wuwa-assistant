/**
 * Wuthering Waves - Echo & Sonata Database
 */

export const SONATA_SETS = [
  {
    name: 'Molten Rift (Furia Ardiente)',
    element: 'Fusion',
    color: '#ff4d4f',
    twoPiece: 'Daño Fusion +10%',
    fivePiece: 'Tras usar Habilidad de Resonancia, Daño Fusion +30% durante 15s.',
    recommendedFor: ['Changli', 'Encore', 'Chixia', 'Mortefi']
  },
  {
    name: 'Sierra Gale (Vendaval Glacial)',
    element: 'Aero',
    color: '#13c2c2',
    twoPiece: 'Daño Aero +10%',
    fivePiece: 'Tras usar Ataque Pesado o Intro Skill, Daño Aero +30% durante 15s.',
    recommendedFor: ['Jiyan', 'Aalto', 'Yangyang']
  },
  {
    name: 'Celestial Light (Luz Celestial)',
    element: 'Spectro',
    color: '#fadb14',
    twoPiece: 'Daño Spectro +10%',
    fivePiece: 'Tras usar Intro Skill, Daño Spectro +30% durante 15s.',
    recommendedFor: ['Jinhsi', 'Rover (Spectro)']
  },
  {
    name: 'Freezing Frost (Hielo Sombrío)',
    element: 'Glacio',
    color: '#40a9ff',
    twoPiece: 'Daño Glacio +10%',
    fivePiece: 'Al golpear con Ataque Básico o Pesado, Daño Glacio +10% acumulable hasta 3 veces (+30%).',
    recommendedFor: ['Lingyang', 'Sanhua', 'Baizhi (DPS)']
  },
  {
    name: 'Void Thunder (Trueno del Vacío)',
    element: 'Electro',
    color: '#9254de',
    twoPiece: 'Daño Electro +10%',
    fivePiece: 'Tras usar Ataque Pesado o Habilidad de Resonancia, Daño Electro +15% acumulable 2 veces (+30%).',
    recommendedFor: ['Yinlin', 'Calcharo', 'Yuanwu']
  },
  {
    name: 'Havoc Eclipse (Eclipse Destructor)',
    element: 'Havoc',
    color: '#eb2f96',
    twoPiece: 'Daño Havoc +10%',
    fivePiece: 'Tras usar Ataque Básico o Pesado, Daño Havoc +7.5% acumulable 4 veces (+30%).',
    recommendedFor: ['Rover (Havoc)', 'Camellya', 'Danjin']
  },
  {
    name: 'Rejuvenating Glow (Resplandor Sanador)',
    element: 'Support/Healing',
    color: '#52c41a',
    twoPiece: 'Bonificación de Curación +10%',
    fivePiece: 'Al curar a un aliado, el ATK de todo el equipo aumenta un 15% durante 30s.',
    recommendedFor: ['Verina', 'Shorekeeper', 'Baizhi']
  },
  {
    name: 'Moonlit Clouds (Nubes de Luna)',
    element: 'Buffer/Sub-DPS',
    color: '#722ed1',
    twoPiece: 'Recarga de Energía +10%',
    fivePiece: 'Al usar Outro Skill, el siguiente resonador que entra al campo recibe Daño +22.5% durante 15s.',
    recommendedFor: ['Sanhua', 'Yangyang', 'Mortefi', 'Taoqi', 'Jianxin']
  },
  {
    name: 'Lingering Tunes (Melodías Persistentes)',
    element: 'ATK Universal',
    color: '#fa8c16',
    twoPiece: 'ATK +10%',
    fivePiece: 'Mientras el resonador está en combate, ATK +5% cada 1.5s (hasta 20%). Daño de Outro Skill +60%.',
    recommendedFor: ['Resonadores con Outro ofensivo', 'Opción flexible para cualquier DPS']
  }
];

export const COST_CONFIGS = [
  {
    type: '4-3-3-1-1 (Meta Óptimo DPS)',
    slots: ['Coste 4 (Overlord/Calamity)', 'Coste 3 (Elite)', 'Coste 3 (Elite)', 'Coste 1 (Common)', 'Coste 1 (Common)'],
    statPriority: 'Cost 4: Prob. Crítico o Daño Crítico | Cost 3: Daño Elemental (%) x2 | Cost 1: ATK (%) x2',
    pros: 'El techo de daño más alto del juego para cualquier personaje principal.',
    cons: 'Los Ecos de coste 3 con el elemento correcto requieren más farmeo de tacet fields.'
  },
  {
    type: '4-4-1-1 (Build Económica / Híbrida)',
    slots: ['Coste 4 (Overlord/Calamity)', 'Coste 4 (Overlord/Calamity)', 'Coste 1 (Common)', 'Coste 1 (Common)'],
    statPriority: 'Cost 4: Prob. Crítico + Daño Crítico | Cost 1: ATK (%) x2',
    pros: 'Permite equipar 1 Eco de Prob. Crítico y 1 de Daño Crítico fácilmente sin sufrir por Coste 3.',
    cons: 'Pierdes el bono de set de 5 piezas completo o sacrificas daño elemental plano.'
  }
];

export const DATA_BANK_TIPS = [
  {
    level: 'Nivel 15',
    feature: '80% Ecos Dorados (5★)',
    advice: 'Aquí empieza a valer la pena usar tubos de experiencia morados y dorados.'
  },
  {
    level: 'Nivel 20 / 21',
    feature: '100% Ecos Dorados (5★) y Gasto Eficiente',
    advice: 'Nunca gastes Sintonizadores Premium (Dorados) en Ecos de 4 estrellas. Solo sintetiza y mejora Ecos dorados con la estadística principal adecuada.'
  }
];
