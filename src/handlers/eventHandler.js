import { readdirSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function loadEvents(client) {
  const eventsDir = join(__dirname, '..', 'events');
  const files = readdirSync(eventsDir).filter(f => f.endsWith('.js'));

  for (const file of files) {
    const filePath = join(eventsDir, file);
    const event = (await import(pathToFileURL(filePath).href)).default;
    if (!event?.name) continue;
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
    console.log(`✅ حدث محمّل: ${event.name}`);
  }
}
