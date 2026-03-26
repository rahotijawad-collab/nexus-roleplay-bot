import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } from 'discord.js';
import { requireSuggestionAdmin } from '../../utils/permissions.js';
import { suggestionPanelEmbed } from '../../utils/embeds.js';
import { config } from '../../config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('suggest-panel')
    .setDescription('📌 نشر لوحة نظام الاقتراحات في القناة')
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('القناة (اختياري، الافتراضي هو قناة الاقتراحات)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),

  async execute(interaction) {
    if (!requireSuggestionAdmin(interaction)) return;

    const targetChannel = interaction.options.getChannel('channel')
      || (config.channels.suggestions ? interaction.guild.channels.cache.get(config.channels.suggestions) : null)
      || interaction.channel;

    const { embeds, files } = suggestionPanelEmbed(interaction.guild);
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('suggest_panel_open')
        .setLabel('💡 اكتب اقتراحك')
        .setStyle(ButtonStyle.Primary)
    );

    await targetChannel.send({ embeds, files, components: [row] });
    await interaction.reply({
      content: `✅ تم نشر لوحة الاقتراحات في ${targetChannel}.`,
      ephemeral: true,
    });
  },
};
