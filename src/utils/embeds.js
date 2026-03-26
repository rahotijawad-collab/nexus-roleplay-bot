import { EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { config } from '../config.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(__dirname, '..', '..', 'assets');

function asset(name) {
  const p = join(assetsDir, name);
  if (!existsSync(p)) return null;
  return new AttachmentBuilder(p, { name });
}

export function levelUpEmbed(member, oldLevel, newLevel) {
  const avatarUrl = member.user.displayAvatarURL({ size: 256, extension: 'png', forceStatic: true });

  const embed = new EmbedBuilder()
    .setColor(0xF1C40F)
    .setTitle('⬆️  Level-up!')
    .setDescription(
      `مستواك في التفاعل اطور  <@${member.id}>\n` +
      `**المستوى الجديد : ${newLevel}**\n\n` +
      `> استمر في التفاعل لمزيد من الهداية 💙`
    )
    .setImage(avatarUrl)
    .addFields(
      { name: '📊 المستوى السابق', value: `**${oldLevel}**`, inline: true },
      { name: '⭐ المستوى الجديد', value: `**${newLevel}**`, inline: true },
      { name: '\u200b', value: `\`${oldLevel}  •  ${newLevel}\``, inline: true },
    )
    .setFooter({ text: member.user.username })
    .setTimestamp();

  return { embeds: [embed], files: [] };
}

export function rankEmbed(member, data, rank, progress) {
  const bar = buildProgressBar(progress.percentage);
  const embed = new EmbedBuilder()
    .setColor(config.colors.primary)
    .setAuthor({ name: `ملف ${member.user.username}`, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: '🏅 الرتبة',       value: `**#${rank}**`,                              inline: true },
      { name: '⭐ المستوى',       value: `**${progress.level}**`,                     inline: true },
      { name: '💬 الرسائل',      value: `**${data.total_messages}**`,                inline: true },
      { name: '📈 XP',           value: `\`${progress.currentXp} / ${progress.neededXp}\``, inline: false },
      { name: `🔋 التقدم — ${progress.percentage}%`, value: `\`${bar}\``,            inline: false },
    )
    .setFooter({ text: `إجمالي الـ XP: ${data.xp}` })
    .setTimestamp();

  return { embeds: [embed], files: [] };
}

export function leaderboardEmbed(entries, guild) {
  const medals = ['🥇', '🥈', '🥉'];
  const description = entries.length === 0
    ? '> لا يوجد بيانات بعد. ابدأ بالتفاعل لكسب XP!'
    : entries.map((e, i) => {
        const medal = medals[i] || `**${i + 1}.**`;
        return `${medal} <@${e.user_id}> — المستوى **${e.level}** • **${e.xp}** XP`;
      }).join('\n');

  const embed = new EmbedBuilder()
    .setColor(config.colors.gold)
    .setTitle('🏆 لوحة المتصدرين')
    .setDescription(description)
    .setThumbnail(guild.iconURL({ dynamic: true }))
    .setFooter({ text: `${guild.name} • أعلى 10 أعضاء في نقاط XP` })
    .setTimestamp();

  return { embeds: [embed], files: [] };
}

export function suggestionEmbed(suggestion, id) {
  const statusMap = {
    pending:  { label: '⏳ في انتظار المراجعة', color: 0xFEE75C },
    accepted: { label: '✅ تم القبول',           color: 0x57F287 },
    rejected: { label: '❌ تم الرفض',            color: 0xED4245 },
  };
  const status = statusMap[suggestion.status] || statusMap.pending;
  const file = asset('nexus-banner.png');

  const embed = new EmbedBuilder()
    .setColor(status.color)
    .setTitle(`💡 اقتراح جديد | ULG Hub`)
    .addFields(
      { name: '📝 الاقتراح',      value: `> ${suggestion.content}`,    inline: false },
      { name: '👍 موافقين',       value: `**${suggestion.upvotes}**`,  inline: true  },
      { name: '👎 مش موافقين',    value: `**${suggestion.downvotes}**`,inline: true  },
      { name: '🗳️ الحالة',       value: status.label,                 inline: true  },
    )
    .setThumbnail(file ? `attachment://nexus-banner.png` : null)
    .setFooter({ text: `بواسطة: ${suggestion.user_tag} • لما تتجمع 10 أصوات موافقة أو رفض هيتم الحكم أوتوماتيكي` })
    .setTimestamp();

  return { embeds: [embed], files: file ? [file] : [] };
}

export function suggestionPanelEmbed(guild) {
  const file = asset('nexus-banner.png');

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(`💡✨ نظام الاقتراحات | ${guild.name} 💡`)
    .setDescription('> **عندك اقتراح للسيرفر؟**')
    .addFields({
      name: '\u200b',
      value: [
        '> اقتراحاتك مهمة وبتساعدنا نحسن السيرفر!',
        '',
        '> **📌 تعليمات:**',
        '> ✅ اكتب اقتراحك بوضوح',
        '> ✅ الاقتراحات بتراجع من الإدارة',
        '> ✅ الأعضاء بيقدروا يصوتوا على الاقتراحات',
        '',
        '> **اضغط الزر تحت عشان تبعت اقتراحك** 👇',
      ].join('\n'),
    })
    .setImage(file ? 'attachment://nexus-banner.png' : null)
    .setThumbnail(guild.iconURL({ dynamic: true }))
    .setFooter({ text: guild.name, iconURL: guild.iconURL() });

  return { embeds: [embed], files: file ? [file] : [] };
}

export function giveawayEmbed(giveaway, entryCount) {
  const file = asset('giveaway-banner.png');

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('🎉 GIVEAWAY!')
    .setDescription(`## ${giveaway.prize}`)
    .setImage(file ? 'attachment://giveaway-banner.png' : null)
    .addFields(
      { name: '⏰ ينتهي',       value: `<t:${giveaway.ends_at}:R>`,    inline: true },
      { name: '🏆 الفائزون',    value: `**${giveaway.winners_count}**`, inline: true },
      { name: '👥 المشاركون',   value: `**${entryCount}**`,             inline: true },
      { name: '👑 المنظِّم',    value: `<@${giveaway.host_id}>`,        inline: true },
    )
    .setFooter({ text: `اضغط 🎉 للمشاركة • ${entryCount} مشارك` })
    .setTimestamp();

  return { embeds: [embed], files: file ? [file] : [] };
}

export function giveawayEndedEmbed(giveaway, winners) {
  const file = asset('giveaway-banner.png');
  const winnersText = winners.length > 0
    ? winners.map(w => `<@${w}>`).join(', ')
    : '> لم يشارك أحد 😢';

  const embed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle('🎊 انتهى الـ Giveaway!')
    .setDescription(`## ${giveaway.prize}`)
    .setImage(file ? 'attachment://giveaway-banner.png' : null)
    .addFields(
      { name: '🏆 الفائزون',  value: winnersText,             inline: false },
      { name: '👑 المنظِّم',  value: `<@${giveaway.host_id}>`, inline: true  },
    )
    .setFooter({ text: 'شكراً لجميع المشاركين! 🎉' })
    .setTimestamp();

  return { embeds: [embed], files: file ? [file] : [] };
}

export function broadcastEmbed(title, message, guild) {
  const file = asset('nexus-banner.png');

  const embed = new EmbedBuilder()
    .setColor(config.colors.primary)
    .setAuthor({ name: guild.name, iconURL: guild.iconURL({ dynamic: true }) })
    .setTitle(`✅ ${title}`)
    .setDescription(message)
    .setImage(file ? 'attachment://nexus-banner.png' : null)
    .setFooter({ text: `من سيرفر: ${guild.name}` })
    .setTimestamp();

  return { embeds: [embed], files: file ? [file] : [] };
}

export function helpEmbed(member) {
  const embed = new EmbedBuilder()
    .setColor(config.colors.primary)
    .setTitle('📋 قائمة أوامر البوت')
    .setDescription('> اختر أمراً من القائمة أدناه وابدأ التفاعل مع البوت!')
    .addFields(
      {
        name: '👤 أوامر عامة',
        value: [
          '`/rank` — عرض مستواك ونقاط XP',
          '`/leaderboard` — لوحة المتصدرين',
          '`/suggest` — إرسال اقتراح',
          '`/help` — قائمة الأوامر',
        ].join('\n'),
        inline: false,
      },
      {
        name: '🛡️ أوامر الإدارة',
        value: [
          '`/giveaway create` — إنشاء سحب جائزة (channel · winners · duration · name)',
          '`/giveaway end` — إنهاء السحب مبكراً',
          '`/giveaway reroll` — إعادة سحب الفائزين',
          '`/giveaway list` — السحوبات النشطة',
          '`/suggest-panel` — نشر لوحة الاقتراحات',
          '`/suggestion accept/reject` — إدارة الاقتراحات',
          '`/broadcast` — إرسال رسالة DM لجميع الأعضاء',
          '`/voice join/leave/status` — تحكم بالصوت 24/7',
          '`/setlevel` — تعيين مستوى عضو',
          '`/config` — ضبط إعدادات البوت',
        ].join('\n'),
        inline: false,
      },
    )
    .setThumbnail(member?.guild?.iconURL({ dynamic: true }) || null)
    .setFooter({ text: 'استخدم / للبحث عن الأوامر المتاحة' })
    .setTimestamp();

  return { embeds: [embed], files: [] };
}

function buildProgressBar(percentage, length = 18) {
  const filled = Math.min(Math.floor((percentage / 100) * length), length);
  return '▰'.repeat(filled) + '▱'.repeat(length - filled);
}
