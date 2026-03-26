import { SlashCommandBuilder, ChannelType } from 'discord.js';
import { requireAdmin } from '../../utils/permissions.js';
import { config } from '../../config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('ضبط إعدادات البوت (للإدارة)')
    .addSubcommand(sub =>
      sub.setName('level-channel')
        .setDescription('تعيين قناة رسائل Level Up')
        .addChannelOption(opt =>
          opt.setName('channel').setDescription('القناة المطلوبة').setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand(sub =>
      sub.setName('suggestions-channel')
        .setDescription('تعيين قناة الاقتراحات')
        .addChannelOption(opt =>
          opt.setName('channel').setDescription('القناة المطلوبة').setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand(sub =>
      sub.setName('giveaway-channel')
        .setDescription('تعيين قناة الـ Giveaway')
        .addChannelOption(opt =>
          opt.setName('channel').setDescription('القناة المطلوبة').setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand(sub =>
      sub.setName('xp-channel')
        .setDescription('تحديد قناة XP (اتركها فارغة لتفعيل XP في جميع القنوات)')
        .addChannelOption(opt =>
          opt.setName('channel').setDescription('القناة المطلوبة (اختياري)').setRequired(false)
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand(sub =>
      sub.setName('view')
        .setDescription('عرض الإعدادات الحالية')
    ),

  async execute(interaction) {
    if (!requireAdmin(interaction)) return;

    const sub = interaction.options.getSubcommand();

    if (sub === 'view') {
      return interaction.reply({
        embeds: [{
          title: '⚙️ إعدادات البوت الحالية',
          color: 0x5865F2,
          fields: [
            { name: '📊 قناة Level Up', value: config.channels.level ? `<#${config.channels.level}>` : 'غير محدد', inline: true },
            { name: '💡 قناة الاقتراحات', value: config.channels.suggestions ? `<#${config.channels.suggestions}>` : 'غير محدد', inline: true },
            { name: '🎉 قناة Giveaway', value: config.channels.giveaway ? `<#${config.channels.giveaway}>` : 'غير محدد', inline: true },
            { name: '🔊 القناة الصوتية', value: config.channels.voice ? `<#${config.channels.voice}>` : 'غير محدد', inline: true },
            { name: '💬 قناة XP', value: config.channels.xpOnly ? `<#${config.channels.xpOnly}>` : 'جميع القنوات', inline: true },
            { name: '🛡️ رولات الإدارة', value: config.adminRoleIds.length ? config.adminRoleIds.map(r => `<@&${r}>`).join(', ') : 'Administrator فقط', inline: false },
          ],
          footer: { text: 'لتغيير الإعدادات يجب تعديل ملف .env وإعادة تشغيل البوت' },
        }],
        ephemeral: true,
      });
    }

    const channel = interaction.options.getChannel('channel');
    let updated = '';

    if (sub === 'level-channel') {
      config.channels.level = channel?.id || null;
      updated = channel ? `✅ تم تعيين قناة Level Up إلى ${channel}` : '✅ تم إلغاء قناة Level Up';
    } else if (sub === 'suggestions-channel') {
      config.channels.suggestions = channel?.id || null;
      updated = channel ? `✅ تم تعيين قناة الاقتراحات إلى ${channel}` : '✅ تم إلغاء قناة الاقتراحات';
    } else if (sub === 'giveaway-channel') {
      config.channels.giveaway = channel?.id || null;
      updated = channel ? `✅ تم تعيين قناة Giveaway إلى ${channel}` : '✅ تم إلغاء قناة Giveaway';
    } else if (sub === 'xp-channel') {
      config.channels.xpOnly = channel?.id || null;
      updated = channel ? `✅ تم تحديد قناة XP إلى ${channel}` : '✅ XP مفعّل الآن في جميع القنوات';
    }

    await interaction.reply({ content: updated, ephemeral: true });
  },
};
