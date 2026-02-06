import { Client, GatewayIntentBits } from "discord.js";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent // Required to read !start/!stop
  ]
});

let running = false;

// Generates 4-letter names using ONLY lowercase letters
function generateName() {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  let name = "";
  for (let i = 0; i < 4; i++) {
    name += letters[Math.floor(Math.random() * letters.length)];
  }
  return name;
}

// Logic based on suenerve's DSV (pomelo-attempt)
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
          // WARNING: This endpoint usually requires a USER TOKEN, not a bot token
          "Authorization": process.env.DISCORD_TOKEN, 
        },
      }
    );

    // If 'taken' is true, it's unavailable. If false, it's available.
    return response.data.taken ? "❌ TAKEN" : "✅ AVAILABLE";

  } catch (error) {
    if (error.response) {
      if (error.response.status === 429) return "⚠️ RATE LIMITED (Slow down)";
      if (error.response.status === 401) return "🚫 INVALID TOKEN (User Token Required)";
      return `❓ ERROR (${error.response.status})`;
    }
    return "🌐 CONNECTION ERROR";
  }
}

async function loop(channel) {
  while (running) {
    const name = generateName();
    const status = await checkAvailability(name);

    const timestamp = new Date().toLocaleTimeString();
    await channel.send(`[${timestamp}] 🔤 **${name}** → ${status}`);
    
    // 20-second delay as requested
    await new Promise(r => setTimeout(r, 20000)); 
  }
}

client.on("messageCreate", async (msg) => {
  if (msg.author.bot || !msg.content.startsWith("!")) return;

  if (msg.content === "!start") {
    if (running) return msg.reply("Check is already running.");
    running = true;
    msg.reply("🚀 Started checking 4-letter usernames (20s delay).");
    loop(msg.channel);
  }

  if (msg.content === "!stop") {
    running = false;
    msg.reply("🛑 Stopped checking.");
  }
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log("Credit to suenerve for the DSV logic.");
});

client.login(process.env.DISCORD_TOKEN);
