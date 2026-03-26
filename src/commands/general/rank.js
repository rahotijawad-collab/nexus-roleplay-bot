import { SlashCommandBuilder } from 'discord.js';
import { levelDB } from '../../utils/database.js';
import { getXpProgress } from '../../utils/xp.js';
import { rankEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('📊 اعرض مستواك ونقاط XP الخاصة بك')
    .addUserOption(opt =>
      opt.setName('user').setDescription('اعرض مستوى عضو آخر (اختياري)').setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!member) return interaction.reply({ content: '❌ لم أتمكن من إيجاد هذا العضو.', ephemeral: true });

    const data = levelDB.get(target.id, interaction.guild.id);
    if (!data) {
      return interaction.reply({
        embeds: [{ title: '📊 لا توجد بيانات', description: `${target} لم يبدأ بالتفاعل بعد.`, color: 0x5865F2 }],
        ephemeral: true,
      });
    }

    const progress = getXpProgress(data.xp);
    const rank = levelDB.getRank(target.id, interaction.guild.id);
    const { embeds, files } = rankEmbed(member, data, rank, progress);
    await interaction.reply({ embeds, files });
  },
};
