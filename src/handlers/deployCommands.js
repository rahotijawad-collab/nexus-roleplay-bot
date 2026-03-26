import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function deployCommands() {
  const commands = [];
  const commandsDir = join(__dirname, '..', 'commands');
  const categories = readdirSync(commandsDir);

  for (const category of categories) {
    const files = readdirSync(join(commandsDir, category)).filter(f => f.endsWith('.js'));
    for (const file of files) {
      const filePath = join(commandsDir, category, file);
      const command = (await import(pathToFileURL(filePath).href)).default;
      if (command?.data) {
        commands.push(command.data.toJSON());
        console.log(`📌 إضافة الأمر: /${command.data.name}`);
      }
    }
  }

  const rest = new REST().setToken(process.env.DISCORD_TOKEN);

  try {
    console.log(`🚀 جاري نشر ${commands.length} أمر...`);
    const data = await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );
    console.log(`✅ تم نشر ${data.length} أمر بنجاح!`);
  } catch (err) {
    console.error('❌ خطأ في نشر الأوامر:', err);
  }
}

deployCommands();
