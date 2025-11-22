const express = require("express");
const { Rcon } = require("rcon-client");

const app = express();

// Middleware agar Sociabuzz tidak error
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// =============================================================
// KONFIGURASI (AMAN - Dibaca dari "Variables" Railway)
// =============================================================

// Ambil variabel dari hosting Anda
const RCON_HOST = process.env.RCON_HOST;
const RCON_PORT = process.env.RCON_PORT;
const RCON_PASSWORD = process.env.RCON_PASSWORD;
const SOCIABUZZ_WEBHOOK_TOKEN = process.env.SOCIABUZZ_WEBHOOK_TOKEN;
const RCON_SPAWN_COORDS = process.env.RCON_SPAWN_COORDS || "0 150 0"; // Koordinat default

// Port Server
const NODE_PORT = process.env.PORT || 3000; 

// Cek variabel env
if (!RCON_PASSWORD || !SOCIABUZZ_WEBHOOK_TOKEN || !RCON_HOST || !RCON_PORT) {
  console.error("FATAL ERROR: Pastikan Environment Variables (RCON_HOST, dll) sudah diisi!");
  process.exit(1); 
}

// =============================================================
// ENDPOINT TEST NOTIFIKASI
// =============================================================
app.post("/sociabuzz/test", (req, res) => {
  console.log("📩 Test Notifikasi diterima:", req.body);
  return res.status(200).send("Test Notifikasi OK");
});

// =============================================================
// MIDDLEWARE TOKEN
// =============================================================
function verifySociabuzzToken(req, res, next) {
  if (req.path === "/sociabuzz/test") return next();

  const tokenHeader = req.headers["authorization"]?.replace("Bearer ", "").trim();
  const tokenSBHeader = req.headers["sb-webhook-token"];
  const tokenBody1 = req.body?.token;
  const tokenBody2 = req.body?.webhook_token;
  const tokenBody3 = req.body?.["sb-webhook-token"];

  const valid =
    tokenHeader === SOCIABUZZ_WEBHOOK_TOKEN ||
    tokenSBHeader === SOCIABUZZ_WEBHOOK_TOKEN ||
    tokenBody1 === SOCIABUZZ_WEBHOOK_TOKEN ||
    tokenBody2 === SOCIABUZZ_WEBHOOK_TOKEN ||
    tokenBody3 === SOCIABUZZ_WEBHOOK_TOKEN;

  if (!valid) {
    console.warn("❌ Auth GAGAL: Token tidak cocok.");
    return res.status(403).send("Forbidden");
  }
  return next();
}

// =============================================================
// FUNGSI RCON
// =============================================================
async function sendMinecraftCommand(cmd) {
  if (!cmd) return; 
  const rcon = new Rcon({
    host: RCON_HOST,
    port: parseInt(RCON_PORT), 
    password: RCON_PASSWORD,
  });

  try {
    await rcon.connect();
    await rcon.send(cmd);
    await rcon.end();
    console.log(`[RCON] Sukses: ${cmd}`);
  } catch (err) {
    console.error("❌ RCON Error:", err.message);
  }
}

const ASSASSIN_NBT = `{CustomName:"{\\"text\\":\\"Assassin\\"}",IsBaby:0,HandItems:[{id:"minecraft:netherite_axe",Count:1,tag:{Enchantments:[{id:"minecraft:sharpness",lvl:5},{id:"minecraft:unbreaking",lvl:3}]}},{}],ArmorItems:[{id:"minecraft:diamond_helmet",Count:1,tag:{Enchantments:[{id:"minecraft:unbreaking",lvl:3}]}},{id:"minecraft:diamond_chestplate",Count:1,tag:{Enchantments:[{id:"minecraft:unbreaking",lvl:3}]}},{id:"minecraft:diamond_leggings",Count:1,tag:{Enchantments:[{id:"minecraft:unbreaking",lvl:3}]}},{id:"minecraft:diamond_boots",Count:1,tag:{Enchantments:[{id:"minecraft:unbreaking",lvl:2}]}}],HandDropChances:[0.2,0.0],ArmorDropChances:[0.2,0.2,0.2,0.2],ActiveEffects:[{Id:1,Amplifier:0,Duration:999999},{Id:5,Amplifier:0,Duration:999999}]}`

// =============================================================
// STRING NBT (DATA TAG) UNTUK JUGGERNAUT
// =============================================================
// Armor: Netherite Full, Prot 4, Thorns 3
const JUGGERNAUT = `{CustomName:"{\\"text\\":\\"Juggernaut\\"}",IsBaby:0,HandItems:[{id:"minecraft:netherite_sword",Count:1,tag:{Enchantments:[{id:"minecraft:sharpness",lvl:3},{id:"minecraft:unbreaking",lvl:3}]}} ,{}],ArmorItems:[{id:"minecraft:netherite_helmet",Count:1,tag:{Enchantments:[{id:"minecraft:protection",lvl:4},{id:"minecraft:thorns",lvl:3},{id:"minecraft:unbreaking",lvl:3}]}} ,{id:"minecraft:netherite_chestplate",Count:1,tag:{Enchantments:[{id:"minecraft:protection",lvl:4},{id:"minecraft:thorns",lvl:3},{id:"minecraft:unbreaking",lvl:3}]}} ,{id:"minecraft:netherite_leggings",Count:1,tag:{Enchantments:[{id:"minecraft:protection",lvl:4},{id:"minecraft:thorns",lvl:3},{id:"minecraft:unbreaking",lvl:3}]}} ,{id:"minecraft:netherite_boots",Count:1,tag:{Enchantments:[{id:"minecraft:protection",lvl:4},{id:"minecraft:thorns",lvl:3},{id:"minecraft:unbreaking",lvl:3}]}}],HandDropChances:[0.2,0.0],ArmorDropChances:[0.2,0.2,0.2,0.2]}`

// Data Juggernaut Spesial (18k) - Syntax 1.20.5+
// Note: Saya menambahkan single quote pada CustomName:'"Juggernaut"' agar nama muncul dengan benar di dalam game
const MINI_JUGGERNAUT = `{CustomName:"{\\"text\\":\\"Mini Juggernaut\\"}",IsBaby:1,HandItems:[{id:"minecraft:netherite_sword",Count:1,tag:{Enchantments:[{id:"minecraft:unbreaking",lvl:3}]}} ,{}],ArmorItems:[{id:"minecraft:netherite_helmet",Count:1,tag:{Enchantments:[{id:"minecraft:protection",lvl:4},{id:"minecraft:thorns",lvl:3},{id:"minecraft:unbreaking",lvl:3}]}} ,{id:"minecraft:netherite_chestplate",Count:1,tag:{Enchantments:[{id:"minecraft:protection",lvl:4},{id:"minecraft:thorns",lvl:3},{id:"minecraft:unbreaking",lvl:3}]}} ,{id:"minecraft:netherite_leggings",Count:1,tag:{Enchantments:[{id:"minecraft:protection",lvl:4},{id:"minecraft:thorns",lvl:3},{id:"minecraft:unbreaking",lvl:3}]}} ,{id:"minecraft:netherite_boots",Count:1,tag:{Enchantments:[{id:"minecraft:protection",lvl:4},{id:"minecraft:thorns",lvl:3},{id:"minecraft:unbreaking",lvl:3}]}}],HandDropChances:[0.2,0.0],ArmorDropChances:[0.2,0.2,0.2,0.2]}`

// =============================================================
// ENDPOINT WEBHOOK DONASI
// =============================================================
app.post("/sociabuzz", verifySociabuzzToken, async (req, res) => {
  const data = req.body;
  
  let amount = parseInt(data.amount || data.amount_raw || 0);
  let currency = (data.currency || "IDR").toUpperCase();

  // Konversi Mata Uang Sederhana
  if (currency === "MYR") amount = amount * 3500; // Update kurs kasar
  if (currency === "SGD") amount = amount * 11500;
  if (currency === "USD") amount = amount * 15500;

  console.log(`💰 Donasi: ${data.amount} ${currency} (setara ${amount} IDR) dari ${data.name}`);

  const donatorName = data.name || "Seseorang";
  
  // Logic Hadiah (Dari Terbesar ke Terkecil)
  try {
    // 200k: /kill (Chaos)
    if (amount >= 200000) {
      await sendMinecraftCommand(`tellraw @a {"text":"☠️ ${donatorName} MEMBUNUH PLAYER ACAK!","color":"dark_red","bold":true}`);
      await sendMinecraftCommand("kill @r");
    }
    // 100k: TP to Spawn
    else if (amount >= 100000) {
      await sendMinecraftCommand(`tellraw @a {"text":"🔄 ${donatorName} memindahkan semua orang ke Spawn!","color":"light_purple"}`);
      await sendMinecraftCommand(`tp @a ${RCON_SPAWN_COORDS}`);
    }
    // 50k: Elder Guardian
    else if (amount >= 50000) {
      await sendMinecraftCommand(`tellraw @a {"text":"👻 ${donatorName} memanggil ELDER GUARDIAN!","color":"dark_aqua"}`);
      await sendMinecraftCommand("execute at @r run summon elder_guardian ~ ~ ~");
    }
    // 40k: Warden
    else if (amount >= 40000) {
      await sendMinecraftCommand(`tellraw @a {"text":"🔊 ${donatorName} memanggil WARDEN! Sshhh...","color":"dark_blue"}`);
      await sendMinecraftCommand("execute at @r run summon warden ~ ~ ~");
    }

    // 30k: assasin
    else if (amount >= 30000) {
      await sendMinecraftCommand(`tellraw @a {"text":"🧟‍♂️🧟‍♂️ ${donatorName} mengirim ASSASIN!","color":"dark_red"}`);
      await sendMinecraftCommand(`execute at @r run summon zombie ~ ~1 ~ ${ASSASSIN_NBT}`);
      }
    // 20k: Mini Juggernaut (1 Baby Zomb)
    else if (amount >= 25000) {
      await sendMinecraftCommand(`tellraw @a {"text":"👶🛡️ ${donatorName} memanggil MINI JUGGERNAUT!","color":"gold"}`);
      await sendMinecraftCommand(`execute at @r run summon zombie ~ ~1 ~ ${MINI_JUGGERNAUT}`);
    }
    // 18k: Juggernaut Spesial (Custom User Command)
    else if (amount >= 20000) {
      await sendMinecraftCommand(`tellraw @a {"text":"🛡️🧟 ${donatorName} memanggil JUGGERNAUT SPESIAL!","color":"dark_green"}`);
      await sendMinecraftCommand(`execute at @r run summon zombie ~ ~1 ~ ${JUGGERNAUT}`);    
    }
    // 15k: Wither Skeleton (Summon 3)
    else if (amount >= 15000) {
      await sendMinecraftCommand(`tellraw @a {"text":"💀 ${donatorName} mengirim Wither Skeletons!","color":"black"}`);
      for(let i=0; i<3; i++) {
        await sendMinecraftCommand("execute at @r run summon wither_skeleton ~ ~ ~");
      }
    }
    // 13k: Netherite Armor Set
    else if (amount >= 13000) {
      await sendMinecraftCommand(`tellraw @a {"text":"🛡️ ${donatorName} memberikan Full Netherite Armor!","color":"dark_purple"}`);
      await sendMinecraftCommand("give @r netherite_helmet");
      await sendMinecraftCommand("give @r netherite_chestplate");
      await sendMinecraftCommand("give @r netherite_leggings");
      await sendMinecraftCommand("give @r netherite_boots");
    }
    // 10k: Levitation 10 Detik
    else if (amount >= 10000) {
      await sendMinecraftCommand(`tellraw @a {"text":"🎈 ${donatorName} membuat player terbang (Levitation)!","color":"white"}`);
      await sendMinecraftCommand("effect give @r levitation 10 1");
    }
    // 8k: 2 Super Charged Creeper
    else if (amount >= 8000) {
      await sendMinecraftCommand(`tellraw @a {"text":"⚡💣 ${donatorName} mengirim CHARGED CREEPER!","color":"aqua"}`);
      for(let i=0; i<2; i++) {
        await sendMinecraftCommand("execute at @r run summon creeper ~ ~ ~ {powered:1b}");
      }
    }
    // 7k: Diamond Sword Sharp 5 + Pickaxe Eff 5
    else if (amount >= 7000) {
      await sendMinecraftCommand(`tellraw @a {"text":"⚔️⛏️ ${donatorName} memberikan OP Tools!","color":"aqua"}`);
      await sendMinecraftCommand('give @r diamond_sword{Enchantments:[{id:"minecraft:sharpness",lvl:5}]}');
      await sendMinecraftCommand('give @r diamond_pickaxe{Enchantments:[{id:"minecraft:efficiency",lvl:5}]}');
    }
    // 6k: 3 Creeper
    else if (amount >= 6000) {
      await sendMinecraftCommand(`tellraw @a {"text":"💣 ${donatorName} mengirim Creeper!","color":"green"}`);
      for(let i=0; i<3; i++) {
        await sendMinecraftCommand("execute at @r run summon creeper ~ ~ ~");
      }
    }
    // 5k: 5 Chicken Jockey
    else if (amount >= 5000) {
      await sendMinecraftCommand(`tellraw @a {"text":"🐔🧟 ${donatorName} mengirim Chicken Jockeys!","color":"red"}`);
      for(let i=0; i<5; i++) {
        // Cara paling stabil summon jockey: Chicken yang ditumpangi Baby Zombie
        await sendMinecraftCommand("execute at @r run summon chicken ~ ~ ~ {Passengers:[{id:zombie,IsBaby:1b}]}");
      }
    }
    // 4k: 5 Skeleton
    else if (amount >= 4000) {
      await sendMinecraftCommand(`tellraw @a {"text":"🏹 ${donatorName} mengirim Skeleton!","color":"white"}`);
      for(let i=0; i<5; i++) {
        await sendMinecraftCommand("execute at @r run summon skeleton ~ ~ ~");
      }
    }
    // 3k: 5 Zombie
    else if (amount >= 3000) {
      await sendMinecraftCommand(`tellraw @a {"text":"🧟 ${donatorName} mengirim Zombie!","color":"dark_green"}`);
      for(let i=0; i<5; i++) {
        await sendMinecraftCommand("execute at @r run summon zombie ~ ~ ~");
      }
    }
    // 2k: 10 Diamond
    else if (amount >= 2000) {
      await sendMinecraftCommand(`tellraw @a {"text":"💎 ${donatorName} memberikan Diamonds!","color":"aqua"}`);
      await sendMinecraftCommand("give @r diamond 10");
    }
    // 1k: 10 Iron
    else if (amount >= 1000) {
      await sendMinecraftCommand(`tellraw @a {"text":"⛓️ ${donatorName} memanggil JUGGERNAUT!","color":"gray"}`);
      await sendMinecraftCommand(`execute at @r run summon zombie ~ ~1 ~ ${JUGGERNAUT}`);
  }
  
    else {
        console.log("Donasi diterima tapi di bawah 1k IDR, tidak ada trigger.");
    }

  } catch (error) {
    console.error("Error saat memproses donasi:", error);
  }

  // Kirim respon ke Sociabuzz
  res.status(200).send("Webhook Sukses");
});

// =============================================================
// START SERVER
// =============================================================
app.listen(NODE_PORT, () => {
  console.log(`🚀 Server Sociabuzz-Minecraft berjalan di port ${NODE_PORT}`);
});



