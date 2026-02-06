import { Client, GatewayIntentBits } from "discord.js";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

// --- CONFIGURATION ---
const TOKEN = process.env.DISCORD_TOKEN;
const TARGET_CHANNEL_ID = process.env.CHANNEL_ID; // Replace with your channel ID
const CHECK_DELAY = 20000; // 20 seconds
// ---------------------

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

let running = false;

/**
 * Credits: suenerve (https://github.com/suenerve/DSV)
 * Logic: Checks 4-letter (letters only) availability via pomelo-attempt
 */

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
          "Authorization": TOKEN, 
        },
      }
    );
    return response.data.taken ? "❌ TAKEN" : "✅ AVAILABLE";
  } catch (error) {
    if (error.response?.status === 429) return "⚠️ RATE LIMITED";
    if (error.response?.status === 401) return "🚫 AUTH ERROR (Check Token)";
    return "❓ ERROR";
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
  // Only respond in the specific channel defined at the top
  if (msg.channel.id !== TARGET_CHANNEL_ID) return;
  if (msg.author.bot) return;

  if (msg.content === "!start") {
    if (running) return msg.reply("Already running.");
    running = true;
    msg.reply(`🚀 Started checking 4L names every ${CHECK_DELAY / 1000}s.`);
    loop(msg.channel);
  }

  if (msg.content === "!stop") {
    running = false;
    msg.reply("🛑 Stopped.");
  }
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log(`Monitoring Channel: ${TARGET_CHANNEL_ID}`);
});

client.login(TOKEN);
