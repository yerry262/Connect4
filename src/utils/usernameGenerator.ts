// Random username generator for online PvP

const adjectives = [
  'Swift', 'Clever', 'Bold', 'Bright', 'Cool', 'Dark', 'Epic', 'Fast',
  'Grand', 'Happy', 'Iron', 'Jolly', 'Keen', 'Lucky', 'Mega', 'Noble',
  'Quick', 'Rapid', 'Sharp', 'Storm', 'Ultra', 'Vivid', 'Wild', 'Zen',
  'Azure', 'Cosmic', 'Fierce', 'Golden', 'Hyper', 'Jade', 'Lunar', 'Neon',
  'Omega', 'Pixel', 'Royal', 'Sonic', 'Turbo', 'Volt', 'Xenon', 'Zero',
];

const nouns = [
  'Ace', 'Bear', 'Cat', 'Dragon', 'Eagle', 'Fox', 'Ghost', 'Hawk',
  'Ice', 'Jet', 'Knight', 'Lion', 'Moon', 'Ninja', 'Owl', 'Phoenix',
  'Raven', 'Shark', 'Tiger', 'Unicorn', 'Viper', 'Wolf', 'Yeti', 'Zephyr',
  'Blaze', 'Comet', 'Dusk', 'Echo', 'Flame', 'Gamer', 'Hunter', 'Joker',
  'King', 'Legend', 'Maverick', 'Nova', 'Oracle', 'Panda', 'Quest', 'Rider',
  'Shadow', 'Titan', 'Unity', 'Vertex', 'Warrior', 'X', 'Youth', 'Zone',
];

// Generate a browser fingerprint hash to create a consistent user ID
// This uses available browser properties to create a semi-unique identifier
async function generateBrowserFingerprint(): Promise<string> {
  const components: string[] = [];
  
  // Screen properties
  components.push(`${screen.width}x${screen.height}`);
  components.push(`${screen.colorDepth}`);
  components.push(`${screen.pixelDepth}`);
  
  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
  
  // Language
  components.push(navigator.language);
  
  // Platform
  components.push(navigator.platform);
  
  // Hardware concurrency (CPU cores)
  components.push(`${navigator.hardwareConcurrency || 0}`);
  
  // Device memory (if available)
  components.push(`${(navigator as unknown as { deviceMemory?: number }).deviceMemory || 0}`);
  
  // Canvas fingerprint
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Connect4 🎮', 2, 2);
      components.push(canvas.toDataURL().slice(-50));
    }
  } catch {
    components.push('no-canvas');
  }
  
  // WebGL renderer (GPU info)
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL));
      }
    }
  } catch {
    components.push('no-webgl');
  }
  
  // Create hash from components
  const fingerprint = components.join('|');
  
  // Use SubtleCrypto if available for better hashing
  if (crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprint);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 12);
  }
  
  // Fallback: simple hash
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).slice(0, 12);
}

// Generate a 4-digit ID from fingerprint
function generateIdFromFingerprint(fingerprint: string): string {
  // Convert first 4 chars of fingerprint to a 4-digit number
  let num = 0;
  for (let i = 0; i < Math.min(4, fingerprint.length); i++) {
    num += fingerprint.charCodeAt(i);
  }
  return ((num % 9000) + 1000).toString();
}

// Generate a random 4-digit ID (fallback)
function generateId(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Generate a random username in format: Name#1234
export function generateUsername(): string {
  const useAdjective = Math.random() > 0.3; // 70% chance to use adjective
  
  if (useAdjective) {
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adjective}${noun}#${generateId()}`;
  } else {
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${noun}#${generateId()}`;
  }
}

// Validate username format (Name#1234 or just #Name1234)
export function isValidUsername(username: string): boolean {
  // Format: Name#1234 or similar
  const standardFormat = /^[A-Za-z0-9]{2,20}#\d{4}$/;
  // Format: #Name1234 (hashtag at start)
  const hashStartFormat = /^#[A-Za-z0-9]{2,20}\d{4}$/;
  
  return standardFormat.test(username) || hashStartFormat.test(username);
}

// Parse username into display name and ID
export function parseUsername(username: string): { name: string; id: string } | null {
  // Standard format: Name#1234
  const standardMatch = username.match(/^([A-Za-z0-9]{2,20})#(\d{4})$/);
  if (standardMatch) {
    return { name: standardMatch[1], id: standardMatch[2] };
  }
  
  // Hash start format: #Name1234
  const hashMatch = username.match(/^#([A-Za-z0-9]{2,16})(\d{4})$/);
  if (hashMatch) {
    return { name: hashMatch[1], id: hashMatch[2] };
  }
  
  return null;
}

// Store and retrieve username from localStorage
const USERNAME_KEY = 'connect4_username';
const USER_ID_KEY = 'connect4_user_id';

export function getStoredUsername(): string | null {
  return localStorage.getItem(USERNAME_KEY);
}

export function storeUsername(username: string): void {
  localStorage.setItem(USERNAME_KEY, username);
}

export function getStoredUserId(): string | null {
  return localStorage.getItem(USER_ID_KEY);
}

export function storeUserId(id: string): void {
  localStorage.setItem(USER_ID_KEY, id);
}

// Get or generate a persistent user ID based on browser fingerprint
export async function getOrCreateUserId(): Promise<string> {
  let userId = getStoredUserId();
  if (!userId) {
    const fingerprint = await generateBrowserFingerprint();
    userId = `user_${fingerprint}`;
    storeUserId(userId);
  }
  return userId;
}

// Generate username with fingerprint-based ID for consistency
export async function generateUsernameWithFingerprint(): Promise<string> {
  const fingerprint = await generateBrowserFingerprint();
  const id = generateIdFromFingerprint(fingerprint);
  
  const useAdjective = Math.random() > 0.3;
  
  if (useAdjective) {
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adjective}${noun}#${id}`;
  } else {
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${noun}#${id}`;
  }
}

// Get or generate username on site visit
export function getOrCreateUsername(): string {
  let username = getStoredUsername();
  if (!username || !isValidUsername(username)) {
    username = generateUsername();
    storeUsername(username);
  }
  return username;
}

// Async version that uses browser fingerprint
export async function getOrCreateUsernameAsync(): Promise<string> {
  let username = getStoredUsername();
  if (!username || !isValidUsername(username)) {
    username = await generateUsernameWithFingerprint();
    storeUsername(username);
  }
  return username;
}
