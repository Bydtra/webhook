const express = require("express");
const { Rcon } = require("rcon-client");

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// =============================================================
// KONFIGURASI
// =============================================================

const RCON_HOST = process.env.RCON_HOST;
const RCON_PORT = process.env.RCON_PORT;
const RCON_PASSWORD = process.env.RCON_PASSWORD;
const SOCIABUZZ_WEBHOOK_TOKEN = process.env.SOCIABUZZ_WEBHOOK_TOKEN;
const RCON_SPAWN_COORDS = process.env.RCON_SPAWN_COORDS || "0 150 0"; 
const NODE_PORT = process.env.PORT || 3000; 

if (!RCON_PASSWORD || !SOCIABUZZ_WEBHOOK_TOKEN || !RCON_HOST || !RCON_PORT) {
  console.error("FATAL ERROR: Environment Variables belum diisi!");
  process.exit(1); 
}

// =============================================================
// AUTH & TEST
// =============================================================
app.post("/sociabuzz/test", (req, res) => {
  console.log("📩 Test Notifikasi diterima:", req.body);
  return res.status(200).send("Test Notifikasi OK");
});

function verifySociabuzzToken(req, res, next) {
  if (req.path === "/sociabuzz/test") return next();
  const tokenHeader = req.headers["authorization"]?.replace("Bearer ", "").trim();
  const tokenSBHeader = req.headers["sb-webhook-token"];
  const tokenBody1 = req.body?.token;
  const tokenBody2 = req.body?.webhook_token;
  const tokenBody3 = req.body?.["sb-webhook-token"];

  const valid = [tokenHeader, tokenSBHeader, tokenBody1, tokenBody2, tokenBody3].includes(SOCIABUZZ_WEBHOOK_TOKEN);

  if (!valid) {
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
// NBT DATA (TAGS)
// =============================================================

// 1. TAG HELMET BESI (Untuk Zombie/Skeleton biasa 3k-5k)
// ArmorDropChances 0f agar tidak menuhin inventory player kalau mati
// =============================================================
// STRING NBT (DATA TAG) UNTUK JUGGERNAUT
// =============================================================
// Armor: Netherite Full, Prot 4, Thorns 3
const MINI_JUGGERNAUT = `{IsBaby:1,equipment:{mainhand:{count:1,id:netherite_sword,components:{custom_name:'"juggernaut sword"',enchantments:{unbreaking:3,sharpness:3}}},head:{count:1,id:netherite_helmet,components:{custom_name:'"juggernaut helmet"',enchantments:{protection:4,thorns:3,unbreaking:3}}},chest:{count:1,id:netherite_chestplate,components:{custom_name:'"juggernaut chestplate"',enchantments:{protection:4,thorns:3,unbreaking:3}}},legs:{count:1,id:netherite_leggings,components:{custom_name:'"juggernaut leggings"',enchantments:{protection:4,thorns:3,unbreaking:3}}},feet:{count:1,id:netherite_boots,components:{custom_name:'"juggernaut boots"',enchantments:{protection:4,thorns:3,unbreaking:3}}}},CustomName:'"Juggernaut"',drop_chances:{mainhand:0.2f,head:0.2f,chest:0.2f,legs:0.2f,feet:0.2f}}`;

// Data Juggernaut Spesial (18k) - Syntax 1.20.5+
// Note: Saya menambahkan single quote pada CustomName:'"Juggernaut"' agar nama muncul dengan benar di dalam game
const JUGGERNAUT_18K_NBT = `{IsBaby:0,equipment:{mainhand:{count:1,id:netherite_sword,components:{custom_name:'"juggernaut sword"',enchantments:{unbreaking:3,sharpness:3}}},head:{count:1,id:netherite_helmet,components:{custom_name:'"juggernaut helmet"',enchantments:{protection:4,thorns:3,unbreaking:3}}},chest:{count:1,id:netherite_chestplate,components:{custom_name:'"juggernaut chestplate"',enchantments:{protection:4,thorns:3,unbreaking:3}}},legs:{count:1,id:netherite_leggings,components:{custom_name:'"juggernaut leggings"',enchantments:{protection:4,thorns:3,unbreaking:3}}},feet:{count:1,id:netherite_boots,components:{custom_name:'"juggernaut boots"',enchantments:{protection:4,thorns:3,unbreaking:3}}}},CustomName:'"Juggernaut"',drop_chances:{mainhand:0.2f,head:0.2f,chest:0.2f,legs:0.2f,feet:0.2f}}`;

// =============================================================
// ENDPOINT WEBHOOK
// =============================================================
app.post("/sociabuzz", verifySociabuzzToken, async (req, res) => {
  const data = req.body;
  let amount = parseInt(data.amount || 0);
  let currency = (data.currency || "IDR").toUpperCase();

  if (currency === "MYR") amount = amount * 3500; 
  if (currency === "SGD") amount = amount * 11500;
  if (currency === "USD") amount = amount * 15500;

  console.log(`💰 Donasi: ${amount} IDR dari ${data.name}`);
  const donatorName = data.name || "Seseorang";
  
  try {
    // 200k: KILL
    if (amount >= 200000) {
      await sendMinecraftCommand(`tellraw @a {"text":"☠️ ${donatorName} MEMBUNUH PLAYER ACAK!","color":"dark_red","bold":true}`);
      await sendMinecraftCommand("kill @r");
    }
    // 100k: SPAWN
    else if (amount >= 100000) {
      await sendMinecraftCommand(`tellraw @a {"text":"🔄 ${donatorName} memindahkan semua orang ke Spawn!","color":"light_purple"}`);
      await sendMinecraftCommand(`tp @a ${RCON_SPAWN_COORDS}`);
    }
    // 50k: ELDER GUARDIAN
    else if (amount >= 50000) {
      await sendMinecraftCommand(`tellraw @a {"text":"👻 ${donatorName} memanggil ELDER GUARDIAN!","color":"dark_aqua"}`);
      await sendMinecraftCommand("execute at @r run summon elder_guardian ~ ~ ~");
    }
    // 40k: WARDEN
    else if (amount >= 40000) {
      await sendMinecraftCommand(`tellraw @a {"text":"🔊 ${donatorName} memanggil WARDEN!","color":"dark_blue"}`);
      await sendMinecraftCommand("execute at @r run summon warden ~ ~ ~");
    }
    // 35k: Mini Juggernaut Army (5 Baby Zomb)
    else if (amount >= 35000) {
  await sendMinecraftCommand(`tellraw @a {"text":"👶🧟 ${donatorName} mengirim PASUKAN MINI JUGGERNAUT!","color":"red"}`);
  await sendMinecraftCommand(`
    execute at @r run summon zombie ~ ~ ~ {IsBaby:1b, ${MINI_JUGGERNAUT}};
    execute at @r run summon zombie ~ ~ ~ {IsBaby:1b, ${MINI_JUGGERNAUT}};
    execute at @r run summon zombie ~ ~ ~ {IsBaby:1b, ${MINI_JUGGERNAUT}};
    execute at @r run summon zombie ~ ~ ~ {IsBaby:1b, ${MINI_JUGGERNAUT}};
    execute at @r run summon zombie ~ ~ ~ {IsBaby:1b, ${MINI_JUGGERNAUT}}
  `);
}
    // 30k: Juggernaut Army (5 Zomb)
    else if (amount >= 30000) {
  await sendMinecraftCommand(`tellraw @a {"text":"🧟‍♂️🧟‍♂️ ${donatorName} mengirim PASUKAN JUGGERNAUT!","color":"dark_red"}`);
  await sendMinecraftCommand(`
    execute at @r run summon zombie ~ ~ ~ ${JUGGERNAUT_18K_NBT};
    execute at @r run summon zombie ~ ~ ~ ${JUGGERNAUT_18K_NBT};
    execute at @r run summon zombie ~ ~ ~ ${JUGGERNAUT_18K_NBT};
    execute at @r run summon zombie ~ ~ ~ ${JUGGERNAUT_18K_NBT};
    execute at @r run summon zombie ~ ~ ~ ${JUGGERNAUT_18K_NBT}}
  `);
}
    // 20k: MINI JUGGERNAUT (1 Baby)
    else if (amount >= 20000) {
      await sendMinecraftCommand(`tellraw @a {"text":"👶🛡️ ${donatorName} memanggil MINI JUGGERNAUT!","color":"gold"}`);
      await sendMinecraftCommand(`execute at @r run summon zombie ~ ~ ~ {IsBaby:1b, ${JUGGERNAUT_ITEMS}}`);
    }
    // 18k: JUGGERNAUT SPESIAL (1 Dewasa)
    else if (amount >= 18000) {
      await sendMinecraftCommand(`tellraw @a {"text":"🛡️⚔️ ${donatorName} memanggil JUGGERNAUT SPESIAL!","color":"dark_green","bold":true}`);
      await sendMinecraftCommand(`execute at @r run summon zombie ~ ~1 ~ {IsBaby:0b, ${JUGGERNAUT_ITEMS}}`);
    }
    // 15k: WITHER SKELETON
    else if (amount >= 15000) {
      await sendMinecraftCommand(`tellraw @a {"text":"💀 ${donatorName} mengirim Wither Skeletons!","color":"black"}`);
      for(let i=0; i<3; i++) await sendMinecraftCommand("execute at @r run summon wither_skeleton ~ ~ ~");
    }
    // 13k: NETHERITE ARMOR
    else if (amount >= 13000) {
      await sendMinecraftCommand(`tellraw @a {"text":"🛡️ ${donatorName} memberikan Full Netherite Armor!","color":"dark_purple"}`);
      await sendMinecraftCommand("give @r netherite_helmet");
      await sendMinecraftCommand("give @r netherite_chestplate");
      await sendMinecraftCommand("give @r netherite_leggings");
      await sendMinecraftCommand("give @r netherite_boots");
    }
    // 10k: LEVITATION
    else if (amount >= 10000) {
      await sendMinecraftCommand(`tellraw @a {"text":"🎈 ${donatorName} membuat player terbang!","color":"white"}`);
      await sendMinecraftCommand("effect give @r levitation 10 1");
    }
    // 8k: CHARGED CREEPER
    else if (amount >= 8000) {
      await sendMinecraftCommand(`tellraw @a {"text":"⚡💣 ${donatorName} mengirim CHARGED CREEPER!","color":"aqua"}`);
      for(let i=0; i<2; i++) await sendMinecraftCommand("execute at @r run summon creeper ~ ~ ~ {powered:1b}");
    }
    // 7k: OP TOOLS - SUDAH DIPERBAIKI TANDA KUTIPNYA
    else if (amount >= 7000) {
      await sendMinecraftCommand(`tellraw @a {"text":"⚔️⛏️ ${donatorName} memberikan OP Tools!","color":"aqua"}`);
      // Pakai format Legacy NBT agar aman dari error syntax JS
      await sendMinecraftCommand('give @r diamond_sword[enchantments={sharpness:5}]');
      await sendMinecraftCommand('give @r diamond_pickaxe[enchantments={efficiency:5}]');
    }
    // 6k: CREEPER
    else if (amount >= 6000) {
      await sendMinecraftCommand(`tellraw @a {"text":"💣 ${donatorName} mengirim Creeper!","color":"green"}`);
      for(let i=0; i<3; i++) await sendMinecraftCommand("execute at @r run summon creeper ~ ~ ~");
    }
    // 5k: CHICKEN JOCKEY (Dengan Iron Helmet di Zombie-nya)
    else if (amount >= 5000) {
      await sendMinecraftCommand(`tellraw @a {"text":"🐔🧟 ${donatorName} mengirim Chicken Jockeys!","color":"red"}`);
      for(let i=0; i<5; i++) {
        await sendMinecraftCommand(`execute at @r run summon chicken ~ ~ ~ {Passengers:[{id:zombie,IsBaby:1b,${IRON_GEAR_TAG}}]}`);
      }
    }
    // 4k: SKELETON (Dengan Iron Helmet)
    else if (amount >= 4000) {
      await sendMinecraftCommand(`tellraw @a {"text":"🏹 ${donatorName} mengirim Skeleton!","color":"white"}`);
      for(let i=0; i<5; i++) {
        await sendMinecraftCommand(`execute at @r run summon skeleton ~ ~ ~ {${IRON_GEAR_TAG}}`);
      }
    }
    // 3k: ZOMBIE (Dengan Iron Helmet)
    else if (amount >= 3000) {
      await sendMinecraftCommand(`tellraw @a {"text":"🧟 ${donatorName} mengirim Zombie!","color":"dark_green"}`);
      for(let i=0; i<5; i++) {
        await sendMinecraftCommand(`execute at @r run summon zombie ~ ~ ~ {${IRON_GEAR_TAG}}`);
      }
    }
    // 2k: DIAMOND
    else if (amount >= 2000) {
      await sendMinecraftCommand(`tellraw @a {"text":"🧟‍♂️🧟‍♂️ ${donatorName} mengirim PASUKAN JUGGERNAUT!","color":"dark_red"}`);
      const cmd = `execute at @r run summon zombie ~ ~ ~-4 {IsBaby:0b, ${MINI_JUGGERNAUT}}`;
      for(let i=0; i<5; i++) await sendMinecraftCommand(cmd);
    }
    // 1k: IRON
    else if (amount >= 1000) {
      await sendMinecraftCommand(`tellraw @a {"text":"👶🧟 ${donatorName} mengirim PASUKAN MINI JUGGERNAUT!","color":"red"}`);
      const cmd = `execute at @r run summon zombie ~ ~ ~-4 {IsBaby:1b, ${JUGGERNAUT_18K_NBT}}`;
      for(let i=0; i<5; i++) await sendMinecraftCommand(cmd);
    }
    else {
        console.log("Donasi diterima tapi di bawah 1k IDR.");
    }
  } catch (error) {
    console.error("Error:", error);
  }
  res.status(200).send("OK");
});

app.listen(NODE_PORT, () => console.log(`🚀 Server berjalan di port ${NODE_PORT}`));



