/**
 * Wuthering Waves - Base de Datos Completa de Códigos de Canje
 * Incluye códigos activos funcionando y el historial de códigos desactivados/expirados.
 */

export const PROMO_CODES = [
  // ==========================================
  // CÓDIGOS ACTIVOS (FUNCIONANDO ACTUALMENTE)
  // ==========================================
  {
    code: 'WUTHERINGGIFT',
    rewards: '50 Astrites, 2x Poción de Resonancia Premium, 2x Inhalador de Revivir Mediano, 10,000 Créditos de Concha',
    status: 'active',
    badge: 'PERMANENTE',
    date: 'Código de Bienvenida Oficial (Válido para todas las cuentas)',
    verified: true
  },
  {
    code: 'SHOREKEEPER',
    rewards: '100 Astrites, 2x Paquete de Materiales de Forja Avanzados',
    status: 'active',
    badge: 'ACTIVO v1.3',
    date: 'Lanzamiento de The Black Shores',
    verified: true
  },
  {
    code: 'BLACKSHORES',
    rewards: '100 Astrites, 20,000 Créditos de Concha',
    status: 'active',
    badge: 'ACTIVO v1.3',
    date: 'Evento Especial Archipiélago Negro',
    verified: true
  },
  {
    code: 'FORYOU',
    rewards: '100 Astrites, 1x Inhalador de Resonancia',
    status: 'active',
    badge: 'ACTIVO',
    date: 'Celebración de la Comunidad Kuro',
    verified: true
  },
  {
    code: 'PTTMYZSOM',
    rewards: '5,000 Créditos de Concha, 1x Poción de Resonancia Mediana',
    status: 'active',
    badge: 'ACTIVO',
    date: 'Código de Difusión Global',
    verified: true
  },
  {
    code: 'DCARD36ME5',
    rewards: '5,000 Créditos de Concha, 1x Poción de Resonancia Mediana',
    status: 'active',
    badge: 'ACTIVO',
    date: 'Código Promocional Discord Oficial',
    verified: true
  },
  {
    code: 'BAHAMUTKRO',
    rewards: '5,000 Créditos de Concha, 2x Poción Básica de Resonancia',
    status: 'active',
    badge: 'ACTIVO',
    date: 'Colaboración de Comunidad',
    verified: true
  },

  // ==========================================
  // HISTORIAL DE CÓDIGOS EXPIRADOS / DESACTIVADOS
  // ==========================================
  {
    code: 'ALLTHANKSTOYOU',
    rewards: '160 Astrites (1 Tirada de Gacha Gratis)',
    status: 'expired',
    badge: 'EXPIRADO',
    date: 'Hito 30 Millones de Descargas Globales (Finalizado)',
    verified: false
  },
  {
    code: 'WUTHERING2024',
    rewards: '100 Astrites, 10,000 Créditos de Concha',
    status: 'expired',
    badge: 'EXPIRADO',
    date: 'Semana de Lanzamiento Global (Expiró)',
    verified: false
  },
  {
    code: 'BURNINGAWAKENING',
    rewards: '100 Astrites, 2x Poción de Resonancia Avanzada',
    status: 'expired',
    badge: 'EXPIRADO',
    date: 'Actualización v1.1 Changli (Expiró)',
    verified: false
  },
  {
    code: 'JINZHOU',
    rewards: '50 Astrites, 2x Poción Mediana de Resonancia',
    status: 'expired',
    badge: 'EXPIRADO',
    date: 'Evento de Celebración de Jinzhou (Expiró)',
    verified: false
  },
  {
    code: 'SOLARIS3',
    rewards: '50 Astrites, 10,000 Créditos de Concha',
    status: 'expired',
    badge: 'EXPIRADO',
    date: 'Campaña de Apertura Solaris-3 (Expiró)',
    verified: false
  },
  {
    code: 'WUTHERINGMOVE',
    rewards: '10,000 Créditos de Concha, 2x Poción Básica de Energía',
    status: 'expired',
    badge: 'EXPIRADO',
    date: 'Campaña Móvil Kuro (Expiró)',
    verified: false
  },
  {
    code: 'MINGCHAO666',
    rewards: '100 Astrites, 10,000 Créditos de Concha',
    status: 'expired',
    badge: 'EXPIRADO',
    date: 'Evento Exclusivo Servidores de Asia (Expiró)',
    verified: false
  },
  {
    code: 'WUWA2024',
    rewards: '50 Astrites, 10,000 Créditos de Concha',
    status: 'expired',
    badge: 'EXPIRADO',
    date: 'Beta Cerrada CBT2 / Pre-registro (Expiró)',
    verified: false
  },
  {
    code: 'ROVERRES',
    rewards: '10,000 Créditos de Concha',
    status: 'expired',
    badge: 'EXPIRADO',
    date: 'Evento de Resonancia del Rover (Expiró)',
    verified: false
  },
  {
    code: 'ECHOESOFWAR',
    rewards: '100 Astrites, 1x Caja de Materiales de Arma',
    status: 'expired',
    badge: 'EXPIRADO',
    date: 'Desafío Holograma Tacet (Expiró)',
    verified: false
  },
  {
    code: 'KUROSEPT',
    rewards: '100 Astrites, 2x Pack de Forja',
    status: 'expired',
    badge: 'EXPIRADO',
    date: 'Especial de Septiembre (Expiró)',
    verified: false
  }
];

export const REDEEM_GUIDE = {
  requirement: 'Nivel de Unión 2 (Union Level 2) completando la primera misión de la historia.',
  inGameSteps: [
    'Abre el Menú Principal (tecla ESC en PC o icono de terminal arriba a la derecha en móviles).',
    'Haz clic en el engranaje de "Ajustes" (Settings) ubicado abajo a la derecha.',
    'Dirígete a la pestaña "Otros Ajustes" (Other Settings, icono de llave inglesa).',
    'Busca la sección "Código de Canje" (Redemption Code) y pega el código que copiaste aquí.',
    'Revisa tu Correo (Mailbox) dentro del juego para reclamar los Astrites y materiales.'
  ]
};
