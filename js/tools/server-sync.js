/**
 * Wuthering Waves - Live Server Sync & Convene History Engine
 * Manages real-time server time synchronization, reset countdowns, and Convene log imports.
 */

export const SERVERS = [
  {
    id: 'america',
    name: 'América',
    timezone: 'America/New_York', // UTC-5 standard
    utcOffset: -5,
    resetUtcHour: 9 // 04:00 UTC-5 = 09:00 UTC
  },
  {
    id: 'europe',
    name: 'Europa',
    timezone: 'Europe/Paris', // UTC+1 standard
    utcOffset: 1,
    resetUtcHour: 3 // 04:00 UTC+1 = 03:00 UTC
  },
  {
    id: 'asia',
    name: 'Asia / SEA',
    timezone: 'Asia/Shanghai', // UTC+8 standard
    utcOffset: 8,
    resetUtcHour: 20 // 04:00 UTC+8 = 20:00 UTC previous day
  }
];

// Calculate live time and countdown to 04:00 AM server reset
export function getServerTimes(serverConfig) {
  const now = new Date();
  
  // Calculate current server timestamp based on UTC offset
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
  const serverMs = utcMs + (serverConfig.utcOffset * 3600000);
  const serverDate = new Date(serverMs);

  // Calculate next reset at 04:00:00 server time
  const nextReset = new Date(serverMs);
  nextReset.setHours(4, 0, 0, 0);

  // If already past 4 AM today, next reset is tomorrow at 4 AM
  if (serverDate.getHours() >= 4) {
    nextReset.setDate(nextReset.getDate() + 1);
  }

  const diffMs = Math.max(0, nextReset.getTime() - serverDate.getTime());
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  return {
    serverTimeFormatted: serverDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    countdownFormatted: `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`,
    isOnline: true
  };
}

// Calculate bi-weekly Tower of Adversity reset (Mondays 04:00 AM server time)
export function getTowerResetCountdown(serverConfig) {
  const now = new Date();
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
  const serverDate = new Date(utcMs + (serverConfig.utcOffset * 3600000));

  // Wuthering Waves Tower of Adversity resets every 2 weeks on Monday 04:00 server time
  const currentDay = serverDate.getDay(); // 0 is Sunday, 1 is Monday
  let daysUntilMonday = (1 - currentDay + 7) % 7;
  if (daysUntilMonday === 0 && serverDate.getHours() >= 4) {
    daysUntilMonday = 7;
  }

  const nextMonday = new Date(serverDate);
  nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
  nextMonday.setHours(4, 0, 0, 0);

  const diffMs = Math.max(0, nextMonday.getTime() - serverDate.getTime());
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return `${days}d ${hours}h`;
}

// Parse Kuro Games Convene / Gacha Record URL
export function parseConveneUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('Por favor pega una URL válida del historial de tiradas.');
  }

  try {
    const cleanUrl = rawUrl.trim();
    const urlObj = new URL(cleanUrl);

    // Expected host contains aki-game.com or kurogames
    if (!urlObj.hostname.includes('aki-game.com') && !urlObj.hostname.includes('kurogame')) {
      throw new Error('La URL no parece ser de los servidores oficiales de Kuro Games (aki-game.com).');
    }

    // Extract query or hash parameters
    let params = urlObj.searchParams;
    if (urlObj.hash && urlObj.hash.includes('?')) {
      const hashQuery = urlObj.hash.split('?')[1];
      params = new URLSearchParams(hashQuery);
    }

    const recordId = params.get('record_id') || params.get('gacha_id');
    const playerId = params.get('player_id') || params.get('user_id');
    const serverId = params.get('server_id') || 'Global';

    return {
      isValid: true,
      recordId,
      playerId,
      serverId,
      rawUrl: cleanUrl
    };
  } catch (err) {
    throw new Error(err.message || 'Formato de URL no válido.');
  }
}

// Safe PowerShell 1-liner to retrieve the official Convene History link from PC logs
export const POWERSHELL_CONVENE_SCRIPT = `powershell -Command "$log = Get-ChildItem -Path \\"$env:USERPROFILE\\AppData\\LocalLow\\KuroGame\\Wuthering Waves\\Client\\Saved\\Logs\\Client.log\\", \\"C:\\Wuthering Waves\\*Client.log\\", \\"D:\\Wuthering Waves\\*Client.log\\" -ErrorAction SilentlyContinue | Select-Object -First 1; if ($log) { Get-Content $log.FullName | Select-String -Pattern 'https://.*/aki/gacha/index.html.*' | ForEach-Object { $_.Matches.Value } | Select-Object -Last 1 | Set-Clipboard; Write-Host '¡Enlace copiado al portapapeles exitosamente!' -ForegroundColor Cyan } else { Write-Host 'Abre primero el historial de tiradas dentro del juego y vuelve a intentarlo.' -ForegroundColor Yellow }"`;
