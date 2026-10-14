/**
 * Wuthering Waves - Astrite & Pull Sources Database
 * Accurate breakdown of all recurring, one-time, and hidden Astrite sources.
 */

export const RECURRING_SOURCES = [
  {
    id: 'daily_activity',
    name: 'Guía de Actividad Diaria (Dailies)',
    nameEn: 'Daily Activity Guide',
    amount: 60,
    frequency: 'Diario (Daily)',
    monthlyEst: 1800,
    desc: 'Completa 5 tareas diarias del cuaderno para alcanzar 100 puntos de actividad.',
    category: 'f2p'
  },
  {
    id: 'tower_hazard',
    name: 'Torre de la Adversidad (Zona de Peligro)',
    nameEn: 'Tower of Adversity (Hazard Zone)',
    amount: 700,
    frequency: 'Cada 2 semanas (Bi-weekly)',
    monthlyEst: 1400,
    desc: 'Hasta 700 Astrite por ciclo al conseguir 30/30 estrellas en los pisos finales.',
    category: 'f2p'
  },
  {
    id: 'illusive_realm',
    name: 'Reino Ilusorio (Depths of Illusive Realm)',
    nameEn: 'Depths of Illusive Realm',
    amount: 1000,
    frequency: 'Por versión (Per Patch)',
    monthlyEst: 750,
    desc: 'Tienda del evento roguelike y recompensas de memoria de resonancia.',
    category: 'f2p'
  },
  {
    id: 'patch_maintenance',
    name: 'Compensación por Mantenimiento de Versión',
    nameEn: 'Patch Maintenance Compensation',
    amount: 600,
    frequency: 'Cada actualización (~42 días)',
    monthlyEst: 430,
    desc: 'Llega directamente al correo del juego tras cada actualización mayor.',
    category: 'f2p'
  },
  {
    id: 'character_trials',
    name: 'Pruebas de Personajes Nuevos (Trial Runs)',
    nameEn: 'Character Test Runs',
    amount: 40,
    frequency: 'Por banner (Per Banner)',
    monthlyEst: 60,
    desc: '20 Astrite por probar cada nuevo resonador de 5 estrellas de la fase.',
    category: 'f2p'
  },
  {
    id: 'lunite_pass',
    name: 'Suscripción Lunite (Pase mensual)',
    nameEn: 'Lunite Subscription (Monthly Pass)',
    amount: 90,
    frequency: 'Diario (+300 inicial)',
    monthlyEst: 3000,
    desc: 'Otorga 300 Lunite al comprar + 90 Astrite cada día que inicias sesión (3,000 en 30 días).',
    category: 'p2p'
  },
  {
    id: 'pioneer_podcast',
    name: 'Podcast del Pionero (Pase de Batalla Insider)',
    nameEn: 'Pioneer Podcast (Battle Pass)',
    amount: 680,
    frequency: 'Por versión (+5 Mareas Radiantes)',
    monthlyEst: 480,
    desc: 'La versión de pago (Canal Insider) da 680 Astrite y 5 tiradas doradas de personaje al nivel 50.',
    category: 'p2p'
  }
];

export const HIDDEN_SECRETS = [
  {
    id: 'holograms',
    title: 'Desafíos de Hologramas Tácticos (Tactical Holograms)',
    reward: 'Hasta 720+ Astrite',
    difficulty: 'Alta (Skill-based)',
    desc: 'Cada jefe de holograma (Mourning Aix, Impermanence Heron, Mephis, etc.) tiene 6 dificultades. Cada nivel superado otorga de 20 a 30 Astrite más materiales dorados.',
    tips: 'Aprovecha las ventanas de contraataque (Parry) y no uses comida, ya que está deshabilitada.'
  },
  {
    id: 'caskets',
    title: 'Entrega de Reliquias de Sonoridad (Sonance Caskets)',
    reward: '500+ Astrite + Mareas Lustrosas',
    difficulty: 'Exploración',
    desc: 'Recolecta las cajas flotantes doradas en Jinzhou, Desorock, Central Plains, Dim Forest y entrégalas al mercader de reliquias de Jinzhou.',
    tips: 'Usa el Sonance Casket Lootmapper en tu rueda de utilidades para revelar su posición exacta en el minimapa.'
  },
  {
    id: 'windchimers',
    title: 'Campanillas de Viento (Windchimers - Mt. Firmament)',
    reward: '360+ Astrite + Bandas de Ondas de Rover',
    difficulty: 'Exploración',
    desc: 'Coleccionables exclusivos de la montaña Mt. Firmament. Al entregarlos en el pabellón de Xian\'ge recibes grandes cantidades de Astrite y copias de Rover.',
    tips: 'Dispara con resonadores pistolas (Chixia, Mortefi) a las campanillas elevadas en el aire.'
  },
  {
    id: 'tigers_maw',
    title: 'Secretos de la Mina de las Fauces del Tigre (Tiger\'s Maw)',
    reward: '300+ Astrite + Cofres Ocultos',
    difficulty: 'Misiones secundarias',
    desc: 'Cadena de misiones oculta que repara la grúa gigante y la red de energía subterránea. Desbloquea cofres avanzados con llaves magnéticas.',
    tips: 'Habla con Xiaoyu y revisa las consolas de control del nivel inferior cada día para misiones secundarias encadenadas.'
  },
  {
    id: 'trophy_hunt',
    title: 'Cacería de Trofeos / Logros Ocultos',
    reward: '1,500+ Astrite acumulables',
    difficulty: 'Coleccionismo',
    desc: 'Hay más de 400 logros en el menú de Trofeos. Muchos se desbloquean realizando acciones específicas: ser derrotado por un jabalí, volar 15 minutos continuos, o derrotar jefes con personajes específicos.',
    tips: 'La categoría "Luz del Destino" y "Huellas de Batalla" son las que más Astrite otorgan rápidamente.'
  },
  {
    id: 'red_enemies',
    title: 'Enemigos de Aura Roja (Jefes de Mundo Especiales)',
    reward: 'Cofres de Lujo + Ecos Garantizados',
    difficulty: 'Muy Alta',
    desc: 'Monstruos con niveles muy superiores (Lv. 85-120) repartidos por el mapa con aura roja. Derrotarlos por primera vez garantiza logros y cofres con Astrite.',
    tips: 'Lleva personajes con escudos (Jianxin, Taoqi) o esquiva al milisegundo aprovechando los contraataques.'
  }
];
