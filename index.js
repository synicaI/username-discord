import { Client, GatewayIntentBits } from "discord.js";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

/**
 * Credits: suenerve (https://github.com/suenerve/DSV)
 * Locked to 4L (Letters Only) - 20s Delay
 */

// --- CONFIGURATION ---
// These will try to load from your Environment Variables first
const TOKEN = process.env.DISCORD_TOKEN?.trim(); 
const TARGET_CHANNEL_ID = process.env.CHANNEL_ID || "PASTE_YOUR_CHANNEL_ID_HERE";
const CHECK_DELAY = 20000; 
// ---------------------

// CRITICAL: Stop the bot if the token is missing before it crashes the container
if (!TOKEN) {
  console.error("❌ ERROR: DISCORD_TOKEN is missing in your environment variables!");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
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

async function checkAvailability(name) {
  const url = "https://discord.com/api/v9/users/@me/pomelo-attempt";
  try {
    const response = await axios.post(
      url,
      { username: name },
      {
        headers: {
          "Content-Type": "application/json",
          "Origin": "https://discord.com/",
          "Authorization": TOKEN, // Note: pomelo-attempt usually fails with Bot tokens
        },
      }
    );
    return response.data.taken ? "❌ TAKEN" : "✅ AVAILABLE";
  } catch (error) {
    if (error.response?.status === 429) return "⚠️ RATE LIMITED";
    if (error.response?.status === 401) return "🚫 AUTH ERROR (Invalid Token)";
    return `❓ ERROR (${error.response?.status || "Conn Fail"})`;
  }
}

async function loop(channel) {
  while (running) {
    const name = generateName();
    const status = await checkAvailability(name);

    await channel.send(`🔤 **${name}** → ${status}`);
    await new Promise(r => setTimeout(r, CHECK_DELAY));
  }
}

client.on("messageCreate", async (msg) => {
  if (msg.channel.id !== TARGET_CHANNEL_ID) return;
  if (msg.author.bot) return;

  if (msg.content === "!start") {
    if (running) return msg.reply("Already running.");
    running = true;
    msg.reply(`🚀 Checking 4L names every ${CHECK_DELAY / 1000}s. Credits to suenerve.`);
    loop(msg.channel);
  }

  if (msg.content === "!stop") {
    running = false;
    msg.reply("🛑 Stopped.");
  }
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`📺 Watching Channel ID: ${TARGET_CHANNEL_ID}`);
});

client.login(TOKEN).catch(err => {
  console.error("❌ Login failed! Check if your token is correct.");
  process.exit(1);
});
