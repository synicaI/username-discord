import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

let running = false;

function generateName() {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  let name = "";
  for (let i = 0; i < 4; i++) {
    name += letters[Math.floor(Math.random() * letters.length)];
  }
  return name;
}

// 🚫 Discord does NOT allow username availability checks
async function checkAvailability(name) {
  return "UNKNOWN"; // placeholder
}

async function loop(channel) {
  while (running) {
    const name = generateName();
    const status = await checkAvailability(name);

    await channel.send(`🔤 **${name}** → ${status}`);
    await new Promise(r => setTimeout(r, 5000)); // 5 sec delay
  }
}

client.on("messageCreate", async (msg) => {
  if (!msg.content.startsWith("!")) return;

  if (msg.content === "!start") {
    if (running) return msg.reply("Already running.");
    running = true;
    msg.reply("Started generating usernames.");
    loop(msg.channel);
  }

  if (msg.content === "!stop") {
    running = false;
    msg.reply("Stopped.");
  }
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
