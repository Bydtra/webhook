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
// Anda HARUS mengatur ini di "Variables" Railway
const RCON_HOST = process.env.RCON_HOST;
const RCON_PORT = process.env.RCON_PORT;
const RCON_PASSWORD = process.env.RCON_PASSWORD;
const SOCIABUZZ_WEBHOOK_TOKEN = process.env.SOCIABUZZ_WEBHOOK_TOKEN;
const RCON_SPAWN_COORDS = process.env.RCON_SPAWN_COORDS || "0 100 0";
const NODE_PORT = process.env.PORT || 3000;

// Cek apakah variabel penting ada saat server start
if (!RCON_PASSWORD || !SOCIABUZZ_WEBHOOK_TOKEN || !RCON_HOST || !RCON_PORT) {
  console.error("================================================================");
  console.error("FATAL ERROR: Satu atau lebih variabel (RCON_HOST, RCON_PORT,");
  console.error("RCON_PASSWORD, SOCIABUZZ_WEBHOOK_TOKEN) tidak diatur");
  console.error("di tab 'Variables' Railway!");
  console.error("================================================================");
  // Hentikan server jika konfigurasi penting hilang
  process.exit(1); 
}

// =============================================================
// ENDPOINT TEST NOTIFIKASI (WAJIB ADA)
// =============================================================
// Sociabuzz akan mengirim ke /webhook/sociabuzz/test
app.post("sociabuzz/test", (req, res) => {
  console.log("📩 Test Notifikasi diterima:", req.body);
  return res.status(200).send("Test Notifikasi OK");
});

// LOG
app.post("/sociabuzz", (req, res) => {
  console.log("DEBUG HEADERS:", req.headers);
  console.log("DEBUG BODY:", req.body);
  return res.status(200).send("Debug OK");
});

// =============================================================
// MIDDLEWARE TOKEN
// =============================================================
function verifySociabuzzToken(req, res, next) {
  // Jika endpoint test, jangan cek token
  if (req.path === "/sociabuzz/test") {
    console.log("Bypass token untuk test");
    return next();
  }

  const header = req.headers["authorization"];
  const tokenFromHeader = header ? header.replace("Bearer ", "").trim() : null;

  const tokenFromBody = req.body?.token || req.body?.webhook_token;

  console.log("TOKEN HEADER:", tokenFromHeader);
  console.log("TOKEN BODY:", tokenFromBody);

  if (
    tokenFromHeader === SOCIABUZZ_WEBHOOK_TOKEN ||
    tokenFromBody === SOCIABUZZ_WEBHOOK_TOKEN
  ) {
    return next();
  }

  console.warn(" Auth GAGAL: Token tidak cocok atau tidak dikirim.");
  return res.status(403).send("Forbidden: Token salah atau tidak ada");
}

// =============================================================
// FUNGSI RCON
// =============================================================
async function sendMinecraftCommand(cmd) {
  if (!cmd) return; // Jangan kirim jika perintah kosong
  
  // Pastikan password ada di 'Variables' dulu
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
// Sociabuzz akan mengirim ke /webhook/sociabuzz
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
    // Membaca koordinat spawn dari "Variables"
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
  // Ini akan menampilkan port yang benar (misal: 8080)
  console.log(`🚀 Server berjalan di port ${NODE_PORT}`); 
  console.log("====================================================");
});

