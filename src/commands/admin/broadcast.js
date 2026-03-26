import { SlashCommandBuilder } from 'discord.js';
import { requireBroadcast } from '../../utils/permissions.js';
import { broadcastEmbed } from '../../utils/embeds.js';

const cooldowns = new Map();
const COOLDOWN_MS = 10 * 60 * 1000;

export default {
  data: new SlashCommandBuilder()
    .setName('broadcast')
    .setDescription('📨 إرسال رسالة خاصة لجميع أعضاء السيرفر')
    .addStringOption(opt =>
      opt.setName('message').setDescription('نص الرسالة').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('title').setDescription('عنوان الرسالة (اختياري)').setRequired(false)
    ),

  async execute(interaction) {
    if (!requireBroadcast(interaction)) return;

    const lastUse = cooldowns.get(interaction.guild.id);
    if (lastUse && Date.now() - lastUse < COOLDOWN_MS) {
      const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - lastUse)) / 60000);
      return interaction.reply({
        embeds: [{ color: 0xFEE75C, title: '⏳ انتظر قليلاً',
          description: `انتظر **${remaining} دقيقة** قبل Broadcast آخر.` }],
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const message = interaction.options.getString('message');
    const title   = interaction.options.getString('title') || 'إشعار من الإدارة';
    const { embeds, files } = broadcastEmbed(title, message, interaction.guild);

    await interaction.guild.members.fetch();
    const members = interaction.guild.members.cache.filter(m => !m.user.bot);

    let sent = 0, failed = 0;
    for (const [, member] of members) {
      try {
        await member.send({ embeds, files });
        sent++;
        await sleep(300);
      } catch {
        failed++;
      }
    }

    cooldowns.set(interaction.guild.id, Date.now());
    await interaction.editReply({
      embeds: [{
        color: 0x57F287, title: '📨 تم إرسال الـ Broadcast!',
        fields: [
          { name: '✅ تم الإرسال',    value: `${sent} عضو`,       inline: true },
          { name: '❌ فشل الإرسال',  value: `${failed} عضو`,     inline: true },
          { name: '📊 المجموع',       value: `${sent+failed} عضو`, inline: true },
        ],
        footer: { text: 'الأعضاء الذين فشل إرسالهم أغلقوا خاصية الـ DM' },
      }],
    });
  },
};

const sleep = ms => new Promise(r => setTimeout(r, ms));
