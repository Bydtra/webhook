const express = require("express");
const { Rcon } = require("rcon-client");

const app = express();

// Middleware agar Sociabuzz tidak error
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// =============================================================
// KONFIGURASI
// =============================================================
const RCON_HOST = 'basic-1.alstore.space';
const RCON_PORT = 25858;
const RCON_PASSWORD = 'jakitolol';

const NODE_PORT = process.env.PORT || 3000;
const SOCIABUZZ_WEBHOOK_TOKEN = 'sbwhook-cxaiwecsvyomurvb7bmjdz86';

// =============================================================
// ENDPOINT TEST NOTIFIKASI (WAJIB ADA)
// =============================================================
app.post("/webhook/sociabuzz/test", (req, res) => {
  console.log("📩 Test Notifikasi diterima:", req.body);
  return res.status(200).send("Test Notifikasi OK");
});

// =============================================================
// MIDDLEWARE TOKEN
// =============================================================
function verifySociabuzzToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send("Unauthorized: Token format salah");
  }

  const token = authHeader.split(" ")[1];

  if (token !== SOCIABUZZ_WEBHOOK_TOKEN) {
    return res.status(403).send("Forbidden: Token salah");
  }

  next();
}

// =============================================================
// FUNGSI RCON
// =============================================================
async function sendMinecraftCommand(cmd) {
  console.log("[RCON] Mengirim:", cmd);
  const rcon = new Rcon({
    host: RCON_HOST,
    port: RCON_PORT,
    password: RCON_PASSWORD,
  });

  try {
    await rcon.connect();
    await rcon.send(cmd);
    await rcon.end();
    console.log("[RCON] OK");
  } catch (err) {
    console.error("❌ RCON error:", err.message);
  }
}

// =============================================================
// ENDPOINT WEBHOOK DONASI ASLI
// =============================================================
app.post("/webhook/sociabuzz", verifySociabuzzToken, (req, res) => {
  const data = req.body;

  console.log("✅ Donasi masuk:", JSON.stringify(data, null, 2));

  // FIX: Sociabuzz pakai amount_raw
  const amount = data.amount || data.amount_raw || 0;

  // FIX: Sociabuzz pakai supporter_name
  const donatorName = data.name || data.supporter_name || "Seseorang";

  let minecraftCommand = "";

  // ===== Logic donasi =====
  if (amount >= 200000) {
    minecraftCommand = "kill @p";
    sendMinecraftCommand(`tellraw @a {"text":"☠️ ${donatorName} men-trigger /kill!","color":"dark_red"}`);
  } 
  else if (amount >= 100000) {
    minecraftCommand = "clear @a";
    sendMinecraftCommand(`tellraw @a {"text":"💨 Inventori @a dihapus!","color":"red"}`);
  }
  else if (amount >= 50000) {
    minecraftCommand = "tp @a 0 150 0";
    sendMinecraftCommand(`tellraw @a {"text":"🔄 Teleport semua player!","color":"light_purple"}`);
  }
  else if (amount >= 40000) {
    minecraftCommand = "execute at @r run summon minecraft:elder_guardian ~ ~ ~-4";
    sendMinecraftCommand(`tellraw @a {"text":"🐟 Elder Guardian dipanggil!","color":"blue"}`);
  }
  else if (amount >= 30000) {
    minecraftCommand = "tp @r ~ 150 ~";
    sendMinecraftCommand(`tellraw @a {"text":"✈️ Player random dilempar!","color":"aqua"}`);
  }
  else if (amount >= 20000) {
    minecraftCommand = "execute at @r run summon minecraft:warden ~ ~ ~-4";
    sendMinecraftCommand(`tellraw @a {"text":"👹 Warden dipanggil!","color":"dark_aqua"}`);
  }
  else if (amount >= 15000) {
    minecraftCommand = "";
    sendMinecraftCommand(`tellraw @a {"text":"🛡️ Netherite armor diberikan!","color":"dark_gray"}`);
    sendMinecraftCommand("give @r minecraft:netherite_helmet");
    sendMinecraftCommand("give @r minecraft:netherite_chestplate");
    sendMinecraftCommand("give @r minecraft:netherite_leggings");
    sendMinecraftCommand("give @r minecraft:netherite_boots");
  }
  else if (amount >= 12000) {
    minecraftCommand = "effect give @p minecraft:levitation 60 1";
    sendMinecraftCommand(`tellraw @a {"text":"🕊️ Levitation diberikan!","color":"white"}`);
  }
  else if (amount >= 10000) {
    minecraftCommand = "";
    sendMinecraftCommand(`tellraw @a {"text":"🐝 Lebah marah dipanggil!","color":"yellow"}`);
    for (let i = 0; i < 5; i++) {
      sendMinecraftCommand("execute at @p run summon minecraft:bee ~ ~ ~-4{AngerTime:120}");
    }
  }
  else if (amount >= 7000) {
    minecraftCommand = 'give @r minecraft:diamond_sword{Enchantments:[{id:"minecraft:sharpness",lvl:5}]} 1';
    sendMinecraftCommand(`tellraw @a {"text":"⚔️ Pedang Sharp V diberikan","color":"aqua"}`);
  }
  else if (amount >= 5000) {
    minecraftCommand = "execute at @r run summon minecraft:creeper ~ ~ ~-4";
    sendMinecraftCommand(`tellraw @a {"text":"💣 Creeper dipanggil!","color":"green"}`);
  }
  else if (amount >= 3000) {
    minecraftCommand = "";
    sendMinecraftCommand(`tellraw @a {"text":"🐔 Chicken jockey dipanggil!","color":"red"}`);
    for (let i = 0; i < 5; i++) {
      sendMinecraftCommand("execute at @r run summon minecraft:chicken ~ ~ ~-4 {IsChickenJockey:1b}");
    }
  }
  else if (amount >= 2000) {
    minecraftCommand = "";
    sendMinecraftCommand(`tellraw @a {"text":"🧟 Zombie dipanggil!","color":"dark_green"}`);
    for (let i = 0; i < 5; i++) {
      sendMinecraftCommand("execute at @r run summon minecraft:zombie ~ ~ ~-4");
    }
  }
  else if (amount >= 1000) {
    minecraftCommand = "give @r minecraft:diamond 10";
    sendMinecraftCommand(`tellraw @a {"text":"💎 Diamond diberikan!","color":"aqua"}`);
  }

  if (minecraftCommand) sendMinecraftCommand(minecraftCommand);

  res.status(200).send("Webhook berhasil diterima!");
});

// =============================================================
// MENJALANKAN SERVER
// =============================================================
app.listen(NODE_PORT, () => {
  console.log("====================================================");
  console.log("🚀 Server berjalan di port", NODE_PORT);
  console.log("====================================================");
});

