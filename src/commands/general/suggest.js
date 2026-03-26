import { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { suggestionDB } from '../../utils/database.js';
import { suggestionEmbed } from '../../utils/embeds.js';
import { buildSuggestionButtons } from '../../events/interactionCreate.js';
import { config } from '../../config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('suggest')
    .setDescription('💡 إرسال اقتراح للإدارة'),
  async execute(interaction) {
    await showSuggestModal(interaction);
  },
};

export async function showSuggestModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('suggest_submit_modal')
    .setTitle('💡 اكتب اقتراحك');
  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('suggest_content')
        .setLabel('الاقتراح')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('اكتب اقتراحك هنا بوضوح ومختصر...')
        .setMinLength(10)
        .setMaxLength(1000)
        .setRequired(true)
    )
  );
  await interaction.showModal(modal);
}

export async function processSuggestion(submitted) {
  const content = submitted.fields.getTextInputValue('suggest_content');
  const id = suggestionDB.create(
    submitted.guild.id, submitted.user.id, submitted.user.tag, content
  );
  const suggestion = suggestionDB.getById(id);
  const { embeds, files } = suggestionEmbed(suggestion, id);
  const row = buildSuggestionButtons(id, 'pending');

  const channelId = config.channels.suggestions;
  const channel = (channelId && submitted.guild.channels.cache.get(channelId)) || submitted.channel;
  const msg = await channel.send({ embeds, files, components: [row] });
  suggestionDB.setMessage(id, msg.id, channel.id);

  await submitted.reply({
    embeds: [{
      color: 0x57F287, title: '✅ تم إرسال اقتراحك!',
      description: `اقتراحك رقم **#${id}** تم نشره في ${channel}.\nشكراً على مساهمتك! 💙`,
    }],
    ephemeral: true,
  });
}
