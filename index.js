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

// =============================================================
// STRING NBT (DATA TAG) UNTUK ASSASSIN
// Weapon: Netherite Axe Sharpness 5 + Unbreaking 3
// Armor: Diamond Full, Unbreaking 3 (Boots Unbreaking 2)
// Effects: Speed 1, Strength 1
const ASSASSIN_NBT = `{IsBaby:1,equipment:{mainhand:{count:1,id:netherite_axe,components:{enchantments:{sharpness:5,unbreaking:3}}},head:{count:1,id:diamond_helmet,components:{enchantments:{unbreaking:3}}},chest:{count:1,id:diamond_chestplate,components:{enchantments:{unbreaking:3}}},legs:{count:1,id:diamond_leggings,components:{enchantments:{unbreaking:3}}},feet:{count:1,id:diamond_boots,components:{enchantments:{unbreaking:2}}}},CustomName:'"Assassin"',drop_chances:{mainhand:0.2f,head:0.2f,chest:0.2f,legs:0.2f,feet:0.2f},Attributes:[{Name:"minecraft:generic.movement_speed",Base:0.5f},{Name:"minecraft:generic.max_health",Base:40.0f}],active_effects:[{id:speed,amplifier:4,duration:999999},{id:strength,amplifier:2,duration:999999}]}`;

// =============================================================
// STRING NBT (DATA TAG) UNTUK JUGGERNAUT
// =============================================================
// Armor: Netherite Full, Prot 4, Thorns 3
const MINI_JUGGERNAUT = `{IsBaby:1,equipment:{mainhand:{count:1,id:netherite_sword,components:{custom_name:'"juggernaut sword"',enchantments:{unbreaking:3,sharpness:3}}},head:{count:1,id:netherite_helmet,components:{custom_name:'"juggernaut helmet"',enchantments:{protection:4,thorns:3,unbreaking:3}}},chest:{count:1,id:netherite_chestplate,components:{custom_name:'"juggernaut chestplate"',enchantments:{protection:4,thorns:3,unbreaking:3}}},legs:{count:1,id:netherite_leggings,components:{custom_name:'"juggernaut leggings"',enchantments:{protection:4,thorns:3,unbreaking:3}}},feet:{count:1,id:netherite_boots,components:{custom_name:'"juggernaut boots"',enchantments:{protection:4,thorns:3,unbreaking:3}}}},CustomName:'"Mini Juggernaut"',drop_chances:{mainhand:0.2f,head:0.2f,chest:0.2f,legs:0.2f,feet:0.2f}}`;

// Data Juggernaut Spesial (18k) - Syntax 1.20.5+
// Note: Saya menambahkan single quote pada CustomName:'"Juggernaut"' agar nama muncul dengan benar di dalam game
const JUGGERNAUT = `{IsBaby:0,equipment:{mainhand:{count:1,id:netherite_sword,components:{custom_name:'"juggernaut sword"',enchantments:{unbreaking:3,sharpness:3}}},head:{count:1,id:netherite_helmet,components:{custom_name:'"juggernaut helmet"',enchantments:{protection:4,thorns:3,unbreaking:3}}},chest:{count:1,id:netherite_chestplate,components:{custom_name:'"juggernaut chestplate"',enchantments:{protection:4,thorns:3,unbreaking:3}}},legs:{count:1,id:netherite_leggings,components:{custom_name:'"juggernaut leggings"',enchantments:{protection:4,thorns:3,unbreaking:3}}},feet:{count:1,id:netherite_boots,components:{custom_name:'"juggernaut boots"',enchantments:{protection:4,thorns:3,unbreaking:3}}}},CustomName:'"Juggernaut"',drop_chances:{mainhand:0.2f,head:0.2f,chest:0.2f,legs:0.2f,feet:0.2f}}`;

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

    // 30k: Assasin
    else if (amount >= 30000) {
    await sendMinecraftCommand(`tellraw @a {"text":"🧟‍♂️ ${donatorName} mengirim ASSASSIN!","color":"dark_red"}`);
    await sendMinecraftCommand(`execute at @r run summon zombie ~ ~1 ~ ${ASSASSIN_NBT}`);
    }
    // 25k: Mini Juggernaut (1 Baby Zomb)
    else if (amount >= 25000) {
      await sendMinecraftCommand(`tellraw @a {"text":"👶🛡️ ${donatorName} memanggil MINI JUGGERNAUT!","color":"gold"}`);
      await sendMinecraftCommand(`execute at @r run summon zombie ~ ~1 ~ ${MINI_JUGGERNAUT}`);
    }
    // 20k: Juggernaut Spesial (Custom User Command)
    else if (amount >= 20000) {
      await sendMinecraftCommand(`tellraw @a {"text":"🛡️🧟 ${donatorName} memanggil JUGGERNAUT","color":"dark_green"}`);
      // Menggunakan NBT lengkap dari user, dijalankan di dekat player acak (@r)
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
    await sendMinecraftCommand('/give @r diamond_sword[enchantments={sharpness:5}]');
    await sendMinecraftCommand('/give @r diamond_pickaxe[enchantments={efficiency:5}]');
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
    // Skeleton 4k
else if (amount >= 4000) {
  await sendMinecraftCommand(`tellraw @a {"text":"🏹 ${donatorName} mengirim Skeleton!","color":"white"}`);
  for(let i=0;i<5;i++){
    await sendMinecraftCommand(`execute at @r run summon skeleton ~ ~ ~ {ArmorItems:[{id:"minecraft:iron_helmet",Count:1},{},{},{}],ArmorDropChances:[0.0,0.0,0.0,0.0]}`);
  }
}

// Zombie 3k
else if (amount >= 3000) {
  await sendMinecraftCommand(`tellraw @a {"text":"🧟 ${donatorName} mengirim Zombie!","color":"dark_green"}`);
  for(let i=0;i<5;i++){
    await sendMinecraftCommand(`execute at @r run summon zombie ~ ~ ~ {ArmorItems:[{id:"minecraft:iron_helmet",Count:1},{},{},{}],ArmorDropChances:[0.0,0.0,0.0,0.0]}`);
  }
}

    // 2k: 10 Diamond
    else if (amount >= 2000) {
  await sendMinecraftCommand(`tellraw @a {"text":"⛓️ ${donatorName} memberikan Iron Ingot!","color":"gray"}`);
      await sendMinecraftCommand("give @r diamond 10");
  }

    // 1k: 10 Iron
    else if (amount >= 1000) {
      await sendMinecraftCommand(`tellraw @a {"text":"⛓️ ${donatorName} memberikan Iron Ingot!","color":"gray"}`);
      await sendMinecraftCommand("give @r iron_ingot 10");
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
