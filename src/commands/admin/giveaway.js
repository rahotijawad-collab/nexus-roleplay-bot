import {
  SlashCommandBuilder, ActionRowBuilder, ButtonBuilder,
  ButtonStyle, ChannelType,
} from 'discord.js';
import { giveawayDB } from '../../utils/database.js';
import { giveawayEmbed } from '../../utils/embeds.js';
import { requireGiveaway } from '../../utils/permissions.js';
import { endGiveaway } from '../../events/ready.js';

export default {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('🎉 إدارة سحوبات الجوائز')
    .addSubcommand(sub =>
      sub.setName('create')
        .setDescription('إنشاء سحب جائزة جديد')
        .addChannelOption(opt =>
          opt.setName('channel').setDescription('القناة التي سيُنشر فيها الـ Giveaway')
            .addChannelTypes(ChannelType.GuildText).setRequired(true))
        .addIntegerOption(opt =>
          opt.setName('winners').setDescription('عدد الفائزين').setRequired(true).setMinValue(1).setMaxValue(20))
        .addStringOption(opt =>
          opt.setName('duration').setDescription('مدة السحب (أمثلة: 1h · 30m · 2d · 1h30m)').setRequired(true))
        .addStringOption(opt =>
          opt.setName('name').setDescription('اسم الجائزة').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('end')
        .setDescription('إنهاء سحب جائزة مبكراً')
        .addIntegerOption(opt => opt.setName('id').setDescription('رقم الـ Giveaway').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('reroll')
        .setDescription('إعادة سحب الفائزين')
        .addIntegerOption(opt => opt.setName('id').setDescription('رقم الـ Giveaway').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('list').setDescription('عرض الـ Giveaways النشطة')
    ),

  async execute(interaction) {
    if (!requireGiveaway(interaction)) return;
    const sub = interaction.options.getSubcommand();
    if      (sub === 'create') await handleCreate(interaction);
    else if (sub === 'end')    await handleEnd(interaction);
    else if (sub === 'reroll') await handleReroll(interaction);
    else if (sub === 'list')   await handleList(interaction);
  },
};

async function handleCreate(interaction) {
  const channel      = interaction.options.getChannel('channel');
  const winnersCount = interaction.options.getInteger('winners');
  const durationStr  = interaction.options.getString('duration');
  const prize        = interaction.options.getString('name');

  const durationMs = parseDuration(durationStr);
  if (!durationMs) {
    return interaction.reply({
      embeds: [{ color: 0xED4245, title: '❌ صيغة المدة غير صحيحة',
        description: 'أمثلة:\n`1h` ساعة\n`30m` 30 دقيقة\n`2d` يومان\n`1h30m` ساعة و30 دقيقة' }],
      ephemeral: true,
    });
  }

  const endsAt = Math.floor((Date.now() + durationMs) / 1000);
  const id = giveawayDB.create(interaction.guild.id, channel.id, interaction.user.id, prize, winnersCount, endsAt);
  const giveaway = giveawayDB.getById(id);
  const { embeds, files } = giveawayEmbed(giveaway, 0);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`giveaway_enter_${id}`).setLabel('🎉 شارك').setStyle(ButtonStyle.Primary)
  );

  const msg = await channel.send({ content: '@everyone', embeds, files, components: [row] });
  giveawayDB.setMessage(id, msg.id);

  await interaction.reply({
    embeds: [{
      color: 0x57F287, title: '✅ تم إنشاء الـ Giveaway بنجاح!',
      fields: [
        { name: '🎁 الجائزة',          value: prize,             inline: true },
        { name: '🏆 عدد الفائزين',     value: `${winnersCount}`, inline: true },
        { name: '⏰ ينتهي',            value: `<t:${endsAt}:R>`, inline: true },
        { name: '📌 القناة',           value: `${channel}`,      inline: true },
        { name: '🔢 رقم الـ Giveaway', value: `#${id}`,          inline: true },
      ],
    }],
    ephemeral: true,
  });
}

async function handleEnd(interaction) {
  const id = interaction.options.getInteger('id');
  const giveaway = giveawayDB.getById(id);
  if (!giveaway || giveaway.guild_id !== interaction.guild.id)
    return interaction.reply({ content: '❌ لم يتم إيجاد هذا الـ Giveaway.', ephemeral: true });
  if (giveaway.ended)
    return interaction.reply({ content: '⚠️ هذا الـ Giveaway انتهى بالفعل.', ephemeral: true });
  await endGiveaway(interaction.client, giveaway);
  await interaction.reply({ content: `✅ تم إنهاء الـ Giveaway **#${id}** وتم إعلان الفائزين.`, ephemeral: true });
}

async function handleReroll(interaction) {
  const id = interaction.options.getInteger('id');
  const giveaway = giveawayDB.getById(id);
  if (!giveaway || giveaway.guild_id !== interaction.guild.id)
    return interaction.reply({ content: '❌ لم يتم إيجاد هذا الـ Giveaway.', ephemeral: true });
  if (!giveaway.ended)
    return interaction.reply({ content: '⚠️ الـ Giveaway لم ينتهِ بعد. استخدم `/giveaway end` أولاً.', ephemeral: true });

  const entries = giveawayDB.getEntries(id);
  const count = Math.min(giveaway.winners_count, entries.length);
  if (count === 0)
    return interaction.reply({ content: '❌ لا يوجد مشاركون لإعادة السحب.', ephemeral: true });

  const winners = entries.sort(() => Math.random() - 0.5).slice(0, count).map(e => e.user_id);
  const channel = interaction.guild.channels.cache.get(giveaway.channel_id) || interaction.channel;
  await channel.send({
    embeds: [{
      color: 0xF1C40F, title: '🔄 إعادة سحب الـ Giveaway!',
      description: `**${giveaway.prize}**`,
      fields: [{ name: '🏆 الفائزون الجدد', value: winners.map(w => `<@${w}>`).join(', ') }],
    }],
  });
  await interaction.reply({ content: `✅ تمت إعادة السحب للـ Giveaway **#${id}**.`, ephemeral: true });
}

async function handleList(interaction) {
  const active = giveawayDB.getActive(interaction.guild.id);
  if (active.length === 0)
    return interaction.reply({ content: '📭 لا يوجد سحوبات نشطة حالياً.', ephemeral: true });
  await interaction.reply({
    embeds: [{
      color: 0x5865F2, title: '🎉 الـ Giveaways النشطة',
      fields: active.map(g => ({
        name: `#${g.id} — ${g.prize}`,
        value: `الفائزون: ${g.winners_count} | ينتهي: <t:${g.ends_at}:R> | القناة: <#${g.channel_id}>`,
        inline: false,
      })),
    }],
    ephemeral: true,
  });
}

function parseDuration(str) {
  const regex = /(\d+)\s*(d|h|m|s)/gi;
  let total = 0, match;
  while ((match = regex.exec(str)) !== null) {
    const v = parseInt(match[1]);
    switch (match[2].toLowerCase()) {
      case 'd': total += v * 86400000; break;
      case 'h': total += v * 3600000;  break;
      case 'm': total += v * 60000;    break;
      case 's': total += v * 1000;     break;
    }
  }
  return total > 0 ? total : null;
}
