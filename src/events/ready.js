import { ActivityType } from 'discord.js';
import { joinVoiceChannel, entersState, VoiceConnectionStatus } from '@discordjs/voice';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { config } from '../config.js';
import { giveawayDB } from '../utils/database.js';
import { giveawayEndedEmbed } from '../utils/embeds.js';

export default {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ البوت شغال! مسجل كـ ${client.user.tag}`);
    client.user.setActivity('/ للأوامر', { type: ActivityType.Listening });
    connectToVoice(client);
    startGiveawayTimer(client);
  },
};

function connectToVoice(client) {
  const voiceChannelId = config.channels.voice;
  if (!voiceChannelId) return;
  const guild = client.guilds.cache.get(config.guildId);
  if (!guild) return;
  const voiceChannel = guild.channels.cache.get(voiceChannelId);
  if (!voiceChannel) { console.warn('⚠️ القناة الصوتية غير موجودة.'); return; }

  const tryConnect = async () => {
    try {
      const connection = joinVoiceChannel({
        channelId: voiceChannelId,
        guildId: config.guildId,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf: true,
        selfMute: true,
      });
      connection.on(VoiceConnectionStatus.Disconnected, () => setTimeout(tryConnect, 5000));
      connection.on(VoiceConnectionStatus.Destroyed,   () => setTimeout(tryConnect, 5000));
      await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
      console.log(`🔊 متصل بالقناة الصوتية: ${voiceChannel.name}`);
      client._voiceConnection = connection;
    } catch (err) {
      console.error('❌ فشل الاتصال الصوتي:', err.message);
      setTimeout(tryConnect, 10000);
    }
  };
  tryConnect();
}

function startGiveawayTimer(client) {
  setInterval(async () => {
    const now = Math.floor(Date.now() / 1000);
    for (const giveaway of giveawayDB.getAllActive()) {
      if (giveaway.ends_at <= now) await endGiveaway(client, giveaway);
    }
  }, 10_000);
}

export async function endGiveaway(client, giveaway) {
  const entries      = giveawayDB.getEntries(giveaway.id);
  const winnersCount = Math.min(giveaway.winners_count, entries.length);
  const winners      = entries.sort(() => Math.random() - 0.5).slice(0, winnersCount).map(e => e.user_id);
  giveawayDB.end(giveaway.id, winners);

  try {
    const channel = await client.channels.fetch(giveaway.channel_id);
    if (!channel) return;
    const message = await channel.messages.fetch(giveaway.message_id).catch(() => null);

    const { embeds, files } = giveawayEndedEmbed(giveaway, winners);
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`giveaway_ended_${giveaway.id}`)
        .setLabel('🎊 انتهى الـ Giveaway')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );

    if (message) await message.edit({ embeds, files, components: [row] });

    const announceTxt = winners.length > 0
      ? `🎊 مبروك للفائزين: ${winners.map(w => `<@${w}>`).join(', ')}\n🏆 الجائزة: **${giveaway.prize}**`
      : '😢 انتهى الـ Giveaway بدون فائزين (لم يشارك أحد).';
    await channel.send(announceTxt);
  } catch (err) {
    console.error('❌ خطأ في إنهاء الـ Giveaway:', err.message);
  }
}
