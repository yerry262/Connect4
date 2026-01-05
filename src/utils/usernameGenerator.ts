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

// Generate a random 4-digit ID
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

export function getStoredUsername(): string | null {
  return localStorage.getItem(USERNAME_KEY);
}

export function storeUsername(username: string): void {
  localStorage.setItem(USERNAME_KEY, username);
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
