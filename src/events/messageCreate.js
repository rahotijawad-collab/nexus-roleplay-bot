import { levelDB } from '../utils/database.js';
import { getXpProgress, randomXp } from '../utils/xp.js';
import { levelUpEmbed } from '../utils/embeds.js';
import { config } from '../config.js';

export default {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    const xpChannelId = config.channels.xpOnly;
    if (xpChannelId && message.channel.id !== xpChannelId) return;

    const now = Math.floor(Date.now() / 1000);
    const userId = message.author.id;
    const guildId = message.guild.id;

    let userData = levelDB.get(userId, guildId);
    if (!userData) {
      userData = { user_id: userId, guild_id: guildId, xp: 0, level: 0, total_messages: 0, last_xp_time: 0 };
    }

    if (now - userData.last_xp_time < config.xp.cooldown) return;

    const gainedXp = randomXp(config.xp.min, config.xp.max);
    const newXp    = userData.xp + gainedXp;
    const oldLevel = userData.level;
    const progress = getXpProgress(newXp);
    const newLevel = progress.level;

    levelDB.upsert(userId, guildId, newXp, newLevel, userData.total_messages + 1, now);

    if (newLevel > oldLevel) {
      const { embeds, files } = levelUpEmbed(message.member, oldLevel, newLevel);
      const levelChannelId = config.channels.level;
      const channel = levelChannelId
        ? (message.guild.channels.cache.get(levelChannelId) || message.channel)
        : message.channel;
      await channel.send({ content: `${message.author}`, embeds, files });
    }
  },
};
