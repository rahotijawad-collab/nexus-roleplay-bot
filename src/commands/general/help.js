import { SlashCommandBuilder } from 'discord.js';
import { helpEmbed } from '../../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('📋 عرض قائمة جميع أوامر البوت'),

  async execute(interaction) {
    const { embeds, files } = helpEmbed(interaction.member);
    await interaction.reply({ embeds, files, ephemeral: true });
  },
};
