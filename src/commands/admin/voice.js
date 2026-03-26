import { SlashCommandBuilder, ChannelType } from 'discord.js';
import { joinVoiceChannel, entersState, VoiceConnectionStatus, getVoiceConnection } from '@discordjs/voice';
import { requireVoice } from '../../utils/permissions.js';
import { config } from '../../config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('voice')
    .setDescription('🔊 التحكم في نظام التواجد الصوتي 24/7')
    .addSubcommand(sub =>
      sub.setName('join')
        .setDescription('الانضمام إلى القناة الصوتية')
        .addChannelOption(opt =>
          opt.setName('channel')
            .setDescription('القناة الصوتية (اتركها فارغة لاستخدام القناة الافتراضية)')
            .addChannelTypes(ChannelType.GuildVoice)
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub.setName('leave')
        .setDescription('مغادرة القناة الصوتية')
    )
    .addSubcommand(sub =>
      sub.setName('status')
        .setDescription('عرض حالة الاتصال الصوتي')
    ),

  async execute(interaction) {
    if (!requireVoice(interaction)) return;

    const sub = interaction.options.getSubcommand();

    if (sub === 'join') {
      const targetChannel = interaction.options.getChannel('channel')
        || (config.channels.voice ? interaction.guild.channels.cache.get(config.channels.voice) : null);

      if (!targetChannel) {
        return interaction.reply({
          embeds: [{
            color: 0xED4245,
            title: '❌ لم يتم تحديد قناة صوتية',
            description: 'حدد قناة صوتية أو اضبط `VOICE_CHANNEL_ID` في ملف `.env`.',
          }],
          ephemeral: true,
        });
      }

      try {
        const connection = joinVoiceChannel({
          channelId: targetChannel.id,
          guildId: interaction.guild.id,
          adapterCreator: interaction.guild.voiceAdapterCreator,
          selfDeaf: true,
          selfMute: true,
        });

        connection.on(VoiceConnectionStatus.Disconnected, () => {
          setTimeout(() => tryReconnect(interaction.client, interaction.guild, targetChannel.id), 5000);
        });

        await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
        interaction.client._voiceConnection = connection;
        config.channels.voice = targetChannel.id;

        await interaction.reply({
          embeds: [{
            color: 0x57F287,
            title: '🔊 تم الانضمام بنجاح!',
            description: `البوت متصل الآن بـ **${targetChannel.name}** وسيبقى متصلاً 24/7.`,
          }],
          ephemeral: true,
        });
      } catch (err) {
        await interaction.reply({
          embeds: [{
            color: 0xED4245,
            title: '❌ فشل الاتصال',
            description: `تأكد من أن البوت لديه صلاحية الوصول للقناة الصوتية.\n\`${err.message}\``,
          }],
          ephemeral: true,
        });
      }
    }

    else if (sub === 'leave') {
      const connection = getVoiceConnection(interaction.guild.id);
      if (!connection) {
        return interaction.reply({ content: '⚠️ البوت غير متصل بأي قناة صوتية.', ephemeral: true });
      }
      connection.destroy();
      interaction.client._voiceConnection = null;
      await interaction.reply({
        embeds: [{
          color: 0xFEE75C,
          title: '👋 تم المغادرة',
          description: 'غادر البوت القناة الصوتية. استخدم `/voice join` للعودة.',
        }],
        ephemeral: true,
      });
    }

    else if (sub === 'status') {
      const connection = getVoiceConnection(interaction.guild.id);
      const channelId = config.channels.voice;
      const channel = channelId ? interaction.guild.channels.cache.get(channelId) : null;
      await interaction.reply({
        embeds: [{
          color: connection ? 0x57F287 : 0xED4245,
          title: connection ? '🟢 متصل بالصوت' : '🔴 غير متصل',
          fields: channel ? [{ name: '📍 القناة', value: channel.name, inline: true }] : [],
          description: connection ? 'البوت متصل بالقناة الصوتية.' : 'البوت غير متصل بأي قناة. استخدم `/voice join`.',
        }],
        ephemeral: true,
      });
    }
  },
};

async function tryReconnect(client, guild, channelId) {
  try {
    const channel = guild.channels.cache.get(channelId);
    if (!channel) return;
    const connection = joinVoiceChannel({
      channelId,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: true,
      selfMute: true,
    });
    await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
    client._voiceConnection = connection;
    connection.on(VoiceConnectionStatus.Disconnected, () => {
      setTimeout(() => tryReconnect(client, guild, channelId), 5000);
    });
  } catch {
    setTimeout(() => tryReconnect(client, guild, channelId), 10000);
  }
}
