import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { config, validateConfig } from './config.js';
import { loadCommands } from './handlers/commandHandler.js';
import { loadEvents } from './handlers/eventHandler.js';

validateConfig();

process.on('unhandledRejection', err => {
  console.error('⚠️ unhandledRejection:', err?.message || err);
});
process.on('uncaughtException', err => {
  console.error('⚠️ uncaughtException:', err?.message || err);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.User],
});

await loadEvents(client);
await loadCommands(client);

client.login(config.token);
