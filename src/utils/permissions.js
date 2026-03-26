import { config } from '../config.js';

const ROLE_PERMISSIONS = {
  giveaway:    () => config.roles.giveaway,
  suggestion:  () => config.roles.suggestion,
  broadcast:   () => config.roles.broadcast,
  voice:       () => config.roles.voice,
};

function hasAnyRole(member, roleIds) {
  if (!member) return false;
  if (member.permissions.has('Administrator')) return true;
  if (!roleIds || roleIds.length === 0) return false;
  return roleIds.some(id => member.roles.cache.has(id));
}

export function isAdmin(member) {
  return hasAnyRole(member, config.adminRoleIds);
}

export function canUseGiveaway(member) {
  return hasAnyRole(member, ROLE_PERMISSIONS.giveaway()) || isAdmin(member);
}

export function canUseSuggestionAdmin(member) {
  return hasAnyRole(member, ROLE_PERMISSIONS.suggestion()) || isAdmin(member);
}

export function canUseBroadcast(member) {
  return hasAnyRole(member, ROLE_PERMISSIONS.broadcast()) || isAdmin(member);
}

export function canUseVoice(member) {
  return hasAnyRole(member, ROLE_PERMISSIONS.voice()) || isAdmin(member);
}

function noPermEmbed() {
  return {
    embeds: [{
      title: '🚫 ليس لديك صلاحية',
      description: 'هذا الأمر مخصص لأعضاء الإدارة فقط.',
      color: 0xED4245,
      footer: { text: 'تواصل مع الإدارة إذا تعتقد أن هذا خطأ.' },
    }],
    ephemeral: true,
  };
}

export function requireGiveaway(interaction) {
  if (!canUseGiveaway(interaction.member)) {
    interaction.reply(noPermEmbed());
    return false;
  }
  return true;
}

export function requireSuggestionAdmin(interaction) {
  if (!canUseSuggestionAdmin(interaction.member)) {
    interaction.reply(noPermEmbed());
    return false;
  }
  return true;
}

export function requireBroadcast(interaction) {
  if (!canUseBroadcast(interaction.member)) {
    interaction.reply(noPermEmbed());
    return false;
  }
  return true;
}

export function requireVoice(interaction) {
  if (!canUseVoice(interaction.member)) {
    interaction.reply(noPermEmbed());
    return false;
  }
  return true;
}

export function requireAdmin(interaction) {
  if (!isAdmin(interaction.member)) {
    interaction.reply(noPermEmbed());
    return false;
  }
  return true;
}
