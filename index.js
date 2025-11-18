const express = require("express");
const { Rcon } = require("rcon-client");

const app = express();

// Agar Sociabuzz bisa mengirim data JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// =============================================================
// KONFIGURASI (ambil dari Railway Variables)
// =============================================================
const RCON_HOST = process.env.RCON_HOST;
const RCON_PORT = process.env.RCON_PORT;
const RCON_PASSWORD = process.env.RCON_PASSWORD;
const SOCIABUZZ_WEBHOOK_TOKEN = process.env.SOCIABUZZ_WEBHOOK_TOKEN;
const RCON_SPAWN_COORDS = process.env.RCON_SPAWN_COORDS || "0 100 0";
const PORT = process.env.PORT || 3000;

// Cek variabel penting
if (!RCON_HOST || !RCON_PORT || !RCON_PASSWORD || !SOCIABUZZ_WEBHOOK_TOKEN) {
  console.error("❌ ERROR: Variabel environment belum lengkap!");
  process.exit(1);
}

// =============================================================
// ENDPOINT TEST (WAJIB ADA UNTUK SOCIABUZZ)
// =============================================================
app.post("/sociabuzz/test", (req, res) => {
  console.log("📩 Test Notifikasi:", req.body);
  return res.status(200).send("Test Notifikasi OK");
});

// =============================================================
// MIDDLEWARE VERIFIKASI TOKEN WEBHOOK
// =============================================================
function verifySociabuzzToken(req, res, next) {
  // Test tidak perlu token
  if (req.path === "/sociabuzz/test") return next();

  const headerAuth = req.headers["authorization"];
  const tokenHeader = headerAuth ? headerAuth.replace("Bearer ", "").trim() : null;

  // Sociabuzz mengirim token di body: sb-webhook-token
  const tokenBody = req.body["sb-webhook-token"];

  console.log("TOKEN HEADER:", tokenHeader);
  console.log("TOKEN BODY:", tokenBody);

  if (tokenHeader === SOCIABUZZ_WEBHOOK_TOKEN || tokenBody === SOCIABUZZ_WEBHOOK_TOKEN) {
    return next();
  }

  console.warn("❌ TOKEN TIDAK VALID");
  return res.status(403).send("Forbidden: Token salah atau tidak ada");
}

// =============================================================
// FUNGSI KIRIM COMMAND RCON
// =============================================================
async function sendMinecraftCommand(cmd) {
  if (!cmd) return;
  console.log(`[RCON] Mengirim: ${cmd}`);

  const rcon = new Rcon({
    host: RCON_HOST,
    port: Number(RCON_PORT),
    password: RCON_PASSWORD,
  });

  try {
    await rcon.connect();
    await rcon.send(cmd);
    await rcon.end();
    console.log("[RCON] OK");
  } catch (e) {
    console.error("❌ RCON Error:", e.message);
  }
}

// =============================================================
// ENDPOINT WEBHOOK DONASI UTAMA
// =============================================================
app.post("/sociabuzz", verifySociabuzzToken, async (req, res) => {
  const data = req.body;

  console.log("✅ Donasi diterima:", data);

  const amount = data.amount || 0;
  const donatorName = data.supporter || "Seseorang";

  let cmd = "";

  if (amount >= 200000) {
    cmd = "kill @p";
    await sendMinecraftCommand(`tellraw @a {"text":"☠️ ${donatorName} men-trigger /kill!","color":"dark_red"}`);
  } else if (amount >= 100000) {
    cmd = "clear @a";
    await sendMinecraftCommand(`tellraw @a {"text":"💨 Inventori dihapus!","color":"red"}`);
  } else if (amount >= 50000) {
    cmd = `tp @a ${RCON_SPAWN_COORDS}`;
    await sendMinecraftCommand(`tellraw @a {"text":"🔄 Teleport semua player!","color":"light_purple"}`);
  } else if (amount >= 1000) {
    cmd = "give @r minecraft:diamond 10";
    await sendMinecraftCommand(`tellraw @a {"text":"💎 Diamond diberikan!","color":"aqua"}`);
  }

  if (cmd !== "") {
    await sendMinecraftCommand(cmd);
  }

  return res.status(200).send("Webhook OK");
});

// =============================================================
// RUN SERVER
// =============================================================
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan pada port ${PORT}`);
});
