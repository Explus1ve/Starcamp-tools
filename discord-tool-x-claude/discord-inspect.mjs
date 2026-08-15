/**
 * Read-only snapshot of the live Discord server — roles, channels and their
 * permissions, AutoMod, the membership screening (rules gate) text as it
 * actually is right now, and onboarding. Makes NO changes to anything; safe
 * to run as often as you like, including right up until the setup bot gets
 * deleted (this is the reverse of discord-setup.mjs: that one pushes desired
 * state TO Discord, this one just reads what's actually there).
 *
 * Usage: same .env.local as discord-setup.mjs (see SETUP-BOT.md).
 *   node discord-inspect.mjs
 *
 * Paste the output back to Claude to get help reading it or deciding what to
 * change next.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const API = "https://discord.com/api/v10";

async function loadLocalEnvFile() {
  const envPath = path.join(SCRIPT_DIR, ".env.local");
  let contents;
  try {
    contents = await readFile(envPath, "utf8");
  } catch {
    return;
  }
  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && !(key in process.env)) process.env[key] = value;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function discordFetch(token, path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json", ...options.headers },
  });
  if (res.status === 429) {
    const body = await res.json().catch(() => ({}));
    await sleep((body.retry_after ?? 1) * 1000);
    return discordFetch(token, path, options);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GET ${path} → ${res.status}: ${body}`);
  }
  return res.json();
}

// Common permission bits (discord.com/developers/docs/topics/permissions) —
// enough to read most setups clearly. A bitfield with bits outside this
// list still shows up, flagged as "+other bits", so nothing is silently hidden.
const PERM_NAMES = [
  [1n << 3n, "ADMINISTRATOR"],
  [1n << 4n, "MANAGE_CHANNELS"],
  [1n << 5n, "MANAGE_GUILD"],
  [1n << 6n, "ADD_REACTIONS"],
  [1n << 10n, "VIEW_CHANNEL"],
  [1n << 11n, "SEND_MESSAGES"],
  [1n << 13n, "MANAGE_MESSAGES"],
  [1n << 14n, "EMBED_LINKS"],
  [1n << 15n, "ATTACH_FILES"],
  [1n << 16n, "READ_MESSAGE_HISTORY"],
  [1n << 17n, "MENTION_EVERYONE"],
  [1n << 20n, "CONNECT"],
  [1n << 21n, "SPEAK"],
  [1n << 22n, "MUTE_MEMBERS"],
  [1n << 23n, "DEAFEN_MEMBERS"],
  [1n << 24n, "MOVE_MEMBERS"],
  [1n << 28n, "MANAGE_ROLES"],
  [1n << 29n, "MANAGE_WEBHOOKS"],
  [1n << 40n, "MODERATE_MEMBERS"],
];
const ALL_KNOWN_BITS = PERM_NAMES.reduce((acc, [bit]) => acc | bit, 0n);

function decodePerm(value) {
  const bits = BigInt(value ?? 0);
  if (bits === 0n) return "(none)";
  const named = PERM_NAMES.filter(([bit]) => (bits & bit) === bit).map(([, name]) => name);
  const leftover = bits & ~ALL_KNOWN_BITS;
  return named.join(", ") + (leftover !== 0n ? ` (+other bits set: ${leftover.toString(2)})` : "");
}

function describeOverwrite(ow, roleNameById, everyoneId) {
  const who = ow.id === everyoneId ? "@everyone" : roleNameById.get(ow.id) ?? `role ${ow.id}`;
  const allow = decodePerm(ow.allow);
  const deny = decodePerm(ow.deny);
  const parts = [];
  if (allow !== "(none)") parts.push(`allow: ${allow}`);
  if (deny !== "(none)") parts.push(`deny: ${deny}`);
  return `${who} — ${parts.join("; ") || "(no explicit perms)"}`;
}

async function main() {
  await loadLocalEnvFile();
  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!token || !guildId) {
    console.error(
      "DISCORD_BOT_TOKEN and DISCORD_GUILD_ID must both be set.\n" +
      "Copy env.local.example to .env.local and fill both in there.",
    );
    process.exit(1);
  }

  const guild = await discordFetch(token, `/guilds/${guildId}`);
  const roles = await discordFetch(token, `/guilds/${guildId}/roles`);
  const channels = await discordFetch(token, `/guilds/${guildId}/channels`);
  const automod = await discordFetch(token, `/guilds/${guildId}/auto-moderation/rules`).catch((err) => {
    console.error(`(could not read AutoMod: ${err.message})`);
    return [];
  });
  const screening = await discordFetch(token, `/guilds/${guildId}/member-verification`).catch((err) => {
    console.error(`(could not read membership screening: ${err.message})`);
    return null;
  });
  const onboarding = await discordFetch(token, `/guilds/${guildId}/onboarding`).catch((err) => {
    console.error(`(could not read onboarding: ${err.message})`);
    return null;
  });

  const roleNameById = new Map(roles.map((r) => [r.id, r.name]));
  const channelNameById = new Map(channels.map((c) => [c.id, c.name]));

  console.log(`=== ${guild.name} ===`);
  console.log(`Community mode: ${guild.features?.includes("COMMUNITY") ? "ON" : "OFF"}`);
  console.log(`Verification level: ${guild.verification_level}`);
  console.log(`Rules channel: #${channelNameById.get(guild.rules_channel_id) ?? "(none set)"}`);
  console.log(`Community updates channel: #${channelNameById.get(guild.public_updates_channel_id) ?? "(none set)"}`);

  console.log(`\n--- Roles (top to bottom = highest to lowest authority) ---`);
  for (const r of [...roles].sort((a, b) => b.position - a.position)) {
    const label = r.name === "@everyone" ? "@everyone" : `${r.name} (#${r.color.toString(16).padStart(6, "0")})`;
    console.log(`  ${label} — ${decodePerm(r.permissions)}`);
  }

  console.log(`\n--- Channels ---`);
  const categories = channels.filter((c) => c.type === 4).sort((a, b) => a.position - b.position);
  const childrenOf = (parentId) =>
    channels.filter((c) => c.type !== 4 && c.parent_id === parentId).sort((a, b) => a.position - b.position);

  for (const cat of categories) {
    console.log(`\n${cat.name}`);
    for (const ow of cat.permission_overwrites ?? []) console.log(`  [category] ${describeOverwrite(ow, roleNameById, guildId)}`);
    for (const chan of childrenOf(cat.id)) {
      const kind = chan.type === 2 ? "voice" : "text";
      const extras = [chan.topic ? `"${chan.topic}"` : null, chan.rate_limit_per_user ? `slow-mode ${chan.rate_limit_per_user}s` : null]
        .filter(Boolean)
        .join(" · ");
      console.log(`  #${chan.name} (${kind})${extras ? ` — ${extras}` : ""}`);
      for (const ow of chan.permission_overwrites ?? []) console.log(`    ${describeOverwrite(ow, roleNameById, guildId)}`);
    }
  }

  const orphaned = channels.filter((c) => c.type !== 4 && !c.parent_id);
  if (orphaned.length > 0) {
    console.log(`\nUncategorized`);
    for (const chan of orphaned) {
      console.log(`  #${chan.name}${chan.topic ? ` — "${chan.topic}"` : ""}`);
      for (const ow of chan.permission_overwrites ?? []) console.log(`    ${describeOverwrite(ow, roleNameById, guildId)}`);
    }
  }

  console.log(`\n--- AutoMod ---`);
  if (automod.length === 0) console.log("  (none)");
  for (const rule of automod) {
    const exempt = (rule.exempt_roles ?? []).map((id) => roleNameById.get(id) ?? id).join(", ") || "(none)";
    console.log(`  ${rule.name} — ${rule.enabled ? "enabled" : "disabled"}, exempt: ${exempt}`);
  }

  console.log(`\n--- Membership screening (rules gate) ---`);
  if (!screening?.enabled) {
    console.log("  OFF");
  } else {
    console.log("  ON — text currently shown to joiners:");
    for (const field of screening.form_fields ?? []) {
      (field.values ?? []).forEach((v, i) => console.log(`    ${i + 1}. ${v}`));
    }
  }

  console.log(`\n--- Onboarding ---`);
  if (!onboarding?.enabled) {
    console.log("  OFF");
  } else {
    console.log(`  ON — mode ${onboarding.mode === 1 ? "ADVANCED" : "DEFAULT"}`);
    const defaults = (onboarding.default_channel_ids ?? []).map((id) => channelNameById.get(id) ?? id).join(", ") || "(none)";
    console.log(`  Default channels: ${defaults}`);
    for (const p of onboarding.prompts ?? []) {
      console.log(`  Question: "${p.title}"${p.required ? " (required)" : ""}`);
      for (const o of p.options ?? []) {
        const grants = (o.role_ids ?? []).map((id) => roleNameById.get(id) ?? id);
        console.log(`    - ${o.title}${grants.length ? ` → grants: ${grants.join(", ")}` : ""}`);
      }
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
