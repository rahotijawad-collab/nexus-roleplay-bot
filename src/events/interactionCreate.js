import { suggestionDB, giveawayDB } from '../utils/database.js';
import { suggestionEmbed, giveawayEmbed } from '../utils/embeds.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { canUseSuggestionAdmin } from '../utils/permissions.js';
import { showSuggestModal, processSuggestion } from '../commands/general/suggest.js';

export default {
  name: 'interactionCreate',
  async execute(interaction) {

    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (err) {
        console.error(`❌ خطأ في /${interaction.commandName}:`, err);
        try {
          const reply = { embeds: [{ color: 0xED4245, title: '❌ حدث خطأ', description: 'حاول مرة أخرى.' }], flags: 64 };
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(reply);
          } else {
            await interaction.reply(reply);
          }
        } catch { }
      }
      return;
    }

    if (interaction.isButton()) {
      const id = interaction.customId;

      if (id === 'suggest_panel_open') {
        await showSuggestModal(interaction); return;
      }
      if (id.startsWith('suggest_up_') || id.startsWith('suggest_down_')) {
        const [, type, sid] = id.split('_');
        await handleSuggestionVote(interaction, type, parseInt(sid)); return;
      }
      if (id.startsWith('suggestion_accept_') || id.startsWith('suggestion_reject_')) {
        const parts = id.split('_');
        await handleSuggestionManage(interaction, parts[1], parseInt(parts[2])); return;
      }
      if (id.startsWith('giveaway_enter_')) {
        await handleGiveawayEnter(interaction, parseInt(id.replace('giveaway_enter_', ''))); return;
      }
    }

    if (interaction.isModalSubmit() && interaction.customId === 'suggest_submit_modal') {
      await processSuggestion(interaction);
    }
  },
};

async function handleSuggestionVote(interaction, voteType, id) {
  const suggestion = suggestionDB.getById(id);
  if (!suggestion) return interaction.reply({ content: '❌ الاقتراح غير موجود.', ephemeral: true });
  if (suggestion.status !== 'pending')
    return interaction.reply({ content: '⚠️ لا يمكن التصويت على اقتراح تمت مراجعته.', ephemeral: true });

  const result = suggestionDB.vote(id, interaction.user.id, voteType === 'up' ? 'up' : 'down');
  if (result.same)
    return interaction.reply({ content: '⚠️ صوّتت بالفعل بنفس الاختيار. اضغط الزر الآخر لتغيير تصويتك.', ephemeral: true });

  let final = suggestionDB.getById(id);
  if (final.upvotes >= 10)   suggestionDB.updateStatus(id, 'accepted');
  if (final.downvotes >= 10) suggestionDB.updateStatus(id, 'rejected');
  final = suggestionDB.getById(id);

  const { embeds, files } = suggestionEmbed(final, id);
  await interaction.update({ embeds, files, components: [buildSuggestionButtons(id, final.status)] });
}

async function handleGiveawayEnter(interaction, id) {
  const giveaway = giveawayDB.getById(id);
  if (!giveaway || giveaway.ended)
    return interaction.reply({ content: '❌ هذا الـ Giveaway انتهى أو غير موجود.', ephemeral: true });
  if (giveaway.ends_at <= Math.floor(Date.now() / 1000))
    return interaction.reply({ content: '❌ انتهى وقت الـ Giveaway.', ephemeral: true });

  const already = giveawayDB.hasEntered(id, interaction.user.id);
  if (already) {
    giveawayDB.leave(id, interaction.user.id);
  } else {
    giveawayDB.enter(id, interaction.user.id);
  }
  const count = giveawayDB.getEntryCount(id);
  const { embeds, files } = giveawayEmbed(giveaway, count);
  await interaction.update({ embeds, files });
  await interaction.followUp({
    content: already ? '↩️ تم **إلغاء** مشاركتك.' : '🎉 تم تسجيل مشاركتك! حظاً موفقاً 🍀',
    ephemeral: true,
  });
}

async function handleSuggestionManage(interaction, action, id) {
  if (!canUseSuggestionAdmin(interaction.member))
    return interaction.reply({ content: '❌ ليس لديك صلاحية لإدارة الاقتراحات.', ephemeral: true });

  const status = action === 'accept' ? 'accepted' : 'rejected';
  suggestionDB.updateStatus(id, status);
  const updated = suggestionDB.getById(id);
  const { embeds, files } = suggestionEmbed(updated, id);
  await interaction.update({ embeds, files, components: [buildSuggestionButtons(id, status)] });
  await interaction.followUp({
    content: `✅ تم **${status === 'accepted' ? 'قبول' : 'رفض'}** الاقتراح #${id}.`,
    ephemeral: true,
  });
}

export function buildSuggestionButtons(id, status) {
  const disabled = status !== 'pending';
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`suggest_up_${id}`).setLabel('موافق').setEmoji('👍').setStyle(ButtonStyle.Success).setDisabled(disabled),
    new ButtonBuilder().setCustomId(`suggest_down_${id}`).setLabel('مش موافق').setEmoji('👎').setStyle(ButtonStyle.Danger).setDisabled(disabled),
    new ButtonBuilder().setCustomId(`suggestion_accept_${id}`).setLabel('قبول').setEmoji('✅').setStyle(ButtonStyle.Primary).setDisabled(disabled),
    new ButtonBuilder().setCustomId(`suggestion_reject_${id}`).setLabel('رفض').setEmoji('❌').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
  );
}
