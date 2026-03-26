import { SlashCommandBuilder } from 'discord.js';
import { suggestionDB } from '../../utils/database.js';
import { suggestionEmbed } from '../../utils/embeds.js';
import { requireAdmin } from '../../utils/permissions.js';
import { buildSuggestionButtons } from '../../events/interactionCreate.js';

export default {
  data: new SlashCommandBuilder()
    .setName('suggestion')
    .setDescription('إدارة الاقتراحات (للإدارة)')
    .addSubcommand(sub =>
      sub.setName('accept')
        .setDescription('قبول اقتراح')
        .addIntegerOption(opt =>
          opt.setName('id').setDescription('رقم الاقتراح').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('reject')
        .setDescription('رفض اقتراح')
        .addIntegerOption(opt =>
          opt.setName('id').setDescription('رقم الاقتراح').setRequired(true)
        )
    ),

  async execute(interaction) {
    if (!requireAdmin(interaction)) return;

    const sub = interaction.options.getSubcommand();
    const id = interaction.options.getInteger('id');
    const suggestion = suggestionDB.getById(id);

    if (!suggestion || suggestion.guild_id !== interaction.guild.id) {
      return interaction.reply({ content: '❌ لم يتم إيجاد هذا الاقتراح.', ephemeral: true });
    }

    const status = sub === 'accept' ? 'accepted' : 'rejected';
    suggestionDB.updateStatus(id, status);
    const updated = suggestionDB.getById(id);
    const embed = suggestionEmbed(updated, id);
    const row = buildSuggestionButtons(id, status);

    if (suggestion.message_id && suggestion.channel_id) {
      try {
        const channel = interaction.guild.channels.cache.get(suggestion.channel_id);
        if (channel) {
          const msg = await channel.messages.fetch(suggestion.message_id);
          if (msg) await msg.edit({ embeds: [embed], components: [row] });
        }
      } catch {
        // message may have been deleted
      }
    }

    await interaction.reply({
      content: `✅ تم **${status === 'accepted' ? 'قبول' : 'رفض'}** الاقتراح #${id}.`,
      ephemeral: true,
    });
  },
};
