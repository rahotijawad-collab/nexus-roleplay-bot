import 'dotenv/config';

function parseIds(env) {
  return (process.env[env] || '').split(',').map(r => r.trim()).filter(Boolean);
}

export const config = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,

  adminRoleIds: parseIds('ADMIN_ROLE_IDS'),

  roles: {
    giveaway:   parseIds('GIVEAWAY_ROLE_IDS'),
    suggestion: parseIds('SUGGESTION_ROLE_IDS'),
    broadcast:  parseIds('BROADCAST_ROLE_IDS'),
    voice:      parseIds('VOICE_ROLE_IDS'),
  },

  channels: {
    level:       process.env.LEVEL_CHANNEL_ID   || null,
    suggestions: process.env.SUGGESTIONS_CHANNEL_ID || null,
    giveaway:    process.env.GIVEAWAY_CHANNEL_ID || null,
    voice:       process.env.VOICE_CHANNEL_ID    || null,
    xpOnly:      process.env.XP_CHANNEL_ID       || null,
  },

  xp: {
    min:      parseInt(process.env.XP_PER_MESSAGE_MIN) || 15,
    max:      parseInt(process.env.XP_PER_MESSAGE_MAX) || 25,
    cooldown: parseInt(process.env.XP_COOLDOWN)        || 60,
  },

  colors: {
    primary: 0x5865F2,
    success: 0x57F287,
    danger:  0xED4245,
    warning: 0xFEE75C,
    gold:    0xF1C40F,
    dark:    0x2B2D31,
    blurple: 0x5865F2,
  },
};

export function validateConfig() {
  const required = ['token', 'clientId', 'guildId'];
  const missing = required.filter(key => !config[key]);
  if (missing.length > 0) {
    throw new Error(`❌ المتغيرات التالية مفقودة في ملف .env: ${missing.map(k => k.toUpperCase()).join(', ')}`);
  }
}
