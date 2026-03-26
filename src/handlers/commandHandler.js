import { Collection } from 'discord.js';
import { readdirSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function loadCommands(client) {
  client.commands = new Collection();
  const commandsDir = join(__dirname, '..', 'commands');
  const categories = readdirSync(commandsDir);

  for (const category of categories) {
    const files = readdirSync(join(commandsDir, category)).filter(f => f.endsWith('.js'));
    for (const file of files) {
      const filePath = join(commandsDir, category, file);
      const command = (await import(pathToFileURL(filePath).href)).default;
      if (command?.data && command?.execute) {
        client.commands.set(command.data.name, command);
        console.log(`✅ أمر محمّل: /${command.data.name}`);
      }
    }
  }

  console.log(`📋 تم تحميل ${client.commands.size} أمر`);
}
