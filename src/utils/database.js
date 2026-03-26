import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', '..', 'data');
mkdirSync(dataDir, { recursive: true });

function loadDB(name) {
  const file = join(dataDir, `${name}.json`);
  if (!existsSync(file)) {
    writeFileSync(file, JSON.stringify({}), 'utf8');
  }
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return {};
  }
}

function saveDB(name, data) {
  const file = join(dataDir, `${name}.json`);
  writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function getAutoId(obj) {
  const keys = Object.keys(obj).map(Number).filter(n => !isNaN(n));
  return keys.length === 0 ? 1 : Math.max(...keys) + 1;
}

export const levelDB = {
  get(userId, guildId) {
    const db = loadDB('levels');
    return db[`${guildId}:${userId}`] || null;
  },
  upsert(userId, guildId, xp, level, totalMessages, lastXpTime) {
    const db = loadDB('levels');
    db[`${guildId}:${userId}`] = { user_id: userId, guild_id: guildId, xp, level, total_messages: totalMessages, last_xp_time: lastXpTime };
    saveDB('levels', db);
  },
  getTopByGuild(guildId, limit = 10) {
    const db = loadDB('levels');
    return Object.values(db)
      .filter(e => e.guild_id === guildId)
      .sort((a, b) => b.xp - a.xp)
      .slice(0, limit);
  },
  getRank(userId, guildId) {
    const db = loadDB('levels');
    const user = db[`${guildId}:${userId}`];
    if (!user) return 1;
    return Object.values(db).filter(e => e.guild_id === guildId && e.xp > user.xp).length + 1;
  },
};

export const suggestionDB = {
  create(guildId, userId, userTag, content) {
    const db = loadDB('suggestions');
    const id = getAutoId(db);
    db[id] = {
      id,
      guild_id: guildId,
      user_id: userId,
      user_tag: userTag,
      content,
      message_id: null,
      channel_id: null,
      upvotes: 0,
      downvotes: 0,
      status: 'pending',
      votes: {},
      created_at: Date.now(),
    };
    saveDB('suggestions', db);
    return id;
  },
  setMessage(id, messageId, channelId) {
    const db = loadDB('suggestions');
    if (db[id]) {
      db[id].message_id = messageId;
      db[id].channel_id = channelId;
      saveDB('suggestions', db);
    }
  },
  getById(id) {
    const db = loadDB('suggestions');
    return db[id] || null;
  },
  getByMessageId(messageId) {
    const db = loadDB('suggestions');
    return Object.values(db).find(s => s.message_id === messageId) || null;
  },
  updateStatus(id, status) {
    const db = loadDB('suggestions');
    if (db[id]) {
      db[id].status = status;
      db[id].updated_at = Date.now();
      saveDB('suggestions', db);
    }
  },
  vote(id, userId, voteType) {
    const db = loadDB('suggestions');
    const s = db[id];
    if (!s) return { changed: false };
    const existing = s.votes[userId];
    if (existing === voteType) return { changed: false, same: true };
    s.votes[userId] = voteType;
    s.upvotes = Object.values(s.votes).filter(v => v === 'up').length;
    s.downvotes = Object.values(s.votes).filter(v => v === 'down').length;
    saveDB('suggestions', db);
    return { changed: true, upvotes: s.upvotes, downvotes: s.downvotes, previousVote: existing };
  },
  getUserVote(id, userId) {
    const db = loadDB('suggestions');
    return db[id]?.votes?.[userId] || null;
  },
};

export const giveawayDB = {
  create(guildId, channelId, hostId, prize, winnersCount, endsAt) {
    const db = loadDB('giveaways');
    const id = getAutoId(db);
    db[id] = {
      id,
      guild_id: guildId,
      channel_id: channelId,
      message_id: null,
      host_id: hostId,
      prize,
      winners_count: winnersCount,
      ends_at: endsAt,
      ended: false,
      winners: [],
      entries: [],
    };
    saveDB('giveaways', db);
    return id;
  },
  setMessage(id, messageId) {
    const db = loadDB('giveaways');
    if (db[id]) { db[id].message_id = messageId; saveDB('giveaways', db); }
  },
  getById(id) {
    const db = loadDB('giveaways');
    return db[id] || null;
  },
  getByMessageId(messageId) {
    const db = loadDB('giveaways');
    return Object.values(db).find(g => g.message_id === messageId) || null;
  },
  getActive(guildId) {
    const db = loadDB('giveaways');
    return Object.values(db).filter(g => g.guild_id === guildId && !g.ended);
  },
  getAllActive() {
    const db = loadDB('giveaways');
    return Object.values(db).filter(g => !g.ended);
  },
  enter(id, userId) {
    const db = loadDB('giveaways');
    if (!db[id]) return false;
    if (db[id].entries.includes(userId)) return false;
    db[id].entries.push(userId);
    saveDB('giveaways', db);
    return true;
  },
  leave(id, userId) {
    const db = loadDB('giveaways');
    if (!db[id]) return false;
    const before = db[id].entries.length;
    db[id].entries = db[id].entries.filter(u => u !== userId);
    saveDB('giveaways', db);
    return db[id].entries.length < before;
  },
  hasEntered(id, userId) {
    const db = loadDB('giveaways');
    return db[id]?.entries?.includes(userId) || false;
  },
  getEntries(id) {
    const db = loadDB('giveaways');
    return (db[id]?.entries || []).map(user_id => ({ user_id }));
  },
  getEntryCount(id) {
    const db = loadDB('giveaways');
    return db[id]?.entries?.length || 0;
  },
  end(id, winners) {
    const db = loadDB('giveaways');
    if (db[id]) { db[id].ended = true; db[id].winners = winners; saveDB('giveaways', db); }
  },
};

export const configDB = {
  get(guildId, key) {
    const db = loadDB('config');
    return db[`${guildId}:${key}`] || null;
  },
  set(guildId, key, value) {
    const db = loadDB('config');
    db[`${guildId}:${key}`] = value;
    saveDB('config', db);
  },
};
