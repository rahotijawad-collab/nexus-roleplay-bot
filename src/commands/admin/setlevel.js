import { SlashCommandBuilder } from 'discord.js';
import { levelDB } from '../../utils/database.js';
import { getXpForLevel } from '../../utils/xp.js';
import { requireAdmin } from '../../utils/permissions.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setlevel')
    .setDescription('تعيين مستوى عضو يدوياً (للإدارة)')
    .addUserOption(opt =>
      opt.setName('user').setDescription('العضو').setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('level').setDescription('المستوى الجديد').setRequired(true).setMinValue(0).setMaxValue(999)
    ),

  async execute(interaction) {
    if (!requireAdmin(interaction)) return;

    const target = interaction.options.getUser('user');
    const level = interaction.options.getInteger('level');

    let totalXp = 0;
    for (let i = 1; i <= level; i++) {
      totalXp += getXpForLevel(i);
    }

    const existing = levelDB.get(target.id, interaction.guild.id);
    levelDB.upsert(
      target.id,
      interaction.guild.id,
      totalXp,
      level,
      existing?.total_messages || 0,
      existing?.last_xp_time || 0
    );

    await interaction.reply({
      content: `✅ تم تعيين مستوى ${target} إلى **${level}** (XP: ${totalXp}).`,
      ephemeral: true,
    });
  },
};
