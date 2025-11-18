const express = require("express");
const { Rcon } = require("rcon-client");

const app = express();

// Middleware agar Sociabuzz tidak error
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// =============================================================
// KONFIGURASI (AMAN - Dibaca dari "Variables" Railway)
// =============================================================

// Ambil variabel dari hosting Anda (dari tab "Variables")
const RCON_HOST = process.env.RCON_HOST;
const RCON_PORT = process.env.RCON_PORT;
const RCON_PASSWORD = process.env.RCON_PASSWORD;
const SOCIABUZZ_WEBHOOK_TOKEN = process.env.SOCIABUZZ_WEBHOOK_TOKEN;
const RCON_SPAWN_COORDS = process.env.RCON_SPAWN_COORDS || "0 150 0"; // Koordinat default

// Ini membaca port (8080) yang diberikan oleh Railway
const NODE_PORT = process.env.PORT || 3000; 

// Cek apakah variabel penting ada saat server start
if (!RCON_PASSWORD || !SOCIABUZZ_WEBHOOK_TOKEN || !RCON_HOST || !RCON_PORT) {
  console.error("================================================================");
  console.error("FATAL ERROR: 'Variables' di Railway belum di-setting!");
  console.error("Pastikan RCON_HOST, RCON_PORT, RCON_PASSWORD, dan SOCIABUZZ_WEBHOOK_TOKEN sudah diisi.");
  console.error("================================================================");
  process.exit(1); 
}

// =============================================================
// ENDPOINT TEST NOTIFIKASI (WAJIB ADA)
// =============================================================
// Alamat DIPERBAIKI (tanpa /webhook/)
app.post("/sociabuzz/test", (req, res) => {
  console.log("📩 Test Notifikasi diterima:", req.body);
  return res.status(200).send("Test Notifikasi OK");
});

// =============================================================
// MIDDLEWARE TOKEN
// =============================================================
function verifySociabuzzToken(req, res, next) {
  // Webhook test tidak butuh token
  if (req.path === "/sociabuzz/test") {
    console.log("Bypass token untuk test webhook");
    return next();
  }

  // Ambil token dari semua kemungkinan tempat
  const tokenHeader = req.headers["authorization"]?.replace("Bearer ", "").trim();
  const tokenSBHeader = req.headers["sb-webhook-token"];
  const tokenBody1 = req.body?.token;
  const tokenBody2 = req.body?.webhook_token;
  const tokenBody3 = req.body?.["sb-webhook-token"];

  console.log("TOKEN HEADER:", tokenHeader);
  console.log("TOKEN_SB_HEADER:", tokenSBHeader);
  console.log("TOKEN BODY:", tokenBody1, tokenBody2, tokenBody3);

  const valid =
    tokenHeader === SOCIABUZZ_WEBHOOK_TOKEN ||
    tokenSBHeader === SOCIABUZZ_WEBHOOK_TOKEN ||
    tokenBody1 === SOCIABUZZ_WEBHOOK_TOKEN ||
    tokenBody2 === SOCIABUZZ_WEBHOOK_TOKEN ||
    tokenBody3 === SOCIABUZZ_WEBHOOK_TOKEN;

  if (!valid) {
    console.warn("❌ Auth GAGAL: Token tidak cocok atau tidak dikirim.");
    return res.status(403).send("Forbidden: Token salah atau tidak ada");
  }

  console.log("✅ Token valid");
  return next();
}

// =============================================================
// FUNGSI RCON
// =============================================================
async function sendMinecraftCommand(cmd) {
  if (!cmd) return; 
  if (!RCON_PASSWORD) {
    console.error("RCON GAGAL: RCON_PASSWORD server belum di-setting.");
    return;
  }

  console.log(`[RCON] Mengirim ke ${RCON_HOST}:${RCON_PORT} -> ${cmd}`);
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
// Alamat DIPERBAIKI (tanpa /webhook/)
app.post("/sociabuzz", verifySociabuzzToken, (req, res) => {
  const data = req.body;
  console.log("✅ Donasi masuk:", JSON.stringify(data, null, 2));

  const amount = data.amount || data.amount_raw || 0;
  const donatorName = data.name || data.supporter_name || "Seseorang";
  let minecraftCommand = "";

  // ===== Logic donasi (LENGKAP) =====
  if (amount >= 200000) {
    minecraftCommand = "kill @p";
    sendMinecraftCommand(`tellraw @a {"text":"☠️ ${donatorName} men-trigger /kill!","color":"dark_red"}`);
  } 
  else if (amount >= 100000) {
    minecraftCommand = "clear @a";
    sendMinecraftCommand(`tellraw @a {"text":"💨 Inventori @a dihapus!","color":"red"}`);
  }
  else if (amount >= 50000) {
    minecraftCommand = `tp @a ${RCON_SPAWN_COORDS}`; 
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

  // Kirim perintah utama (jika ada)
  sendMinecraftCommand(minecraftCommand);

  // Kirim balasan 'OK' ke Sociabuzz
  res.status(200).send("Webhook berhasil diterima!");
});

// =============================================================
// MENJALANKAN SERVER
// =============================================================
app.listen(NODE_PORT, () => {
  console.log("====================================================");
  console.log(`🚀 Server berjalan di port ${NODE_PORT}`); 
  console.log("====================================================");
});


