import { SlashCommandBuilder } from 'discord.js';
import { levelDB } from '../../utils/database.js';
import { leaderboardEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('🏆 عرض لوحة المتصدرين — أعلى 10 أعضاء في نقاط XP'),

  async execute(interaction) {
    await interaction.deferReply();
    const entries = levelDB.getTopByGuild(interaction.guild.id, 10);
    const { embeds, files } = leaderboardEmbed(entries, interaction.guild);
    await interaction.editReply({ embeds, files });
  },
};
