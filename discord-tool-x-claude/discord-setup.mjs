/**
 * Discord server builder — reads its identity (roles, categories, channels,
 * rules text, onboarding question, pinned copy) from ./config.mjs, then
 * builds and repairs that structure via the Discord REST API. Everything
 * here is free — no server boost / Nitro required.
 *
 * Safe to re-run: matches existing roles/categories/channels/AutoMod rules
 * by name. Roles are left alone once they exist (so manual color/permission
 * tweaks in Discord aren't clobbered); categories and channels have their
 * permissions/topic/slow-mode re-applied every run, so if something drifts
 * (a permission changed by hand, a topic edited) this puts it back — that's
 * also what makes discord-inspect.mjs's report meaningful proof, not just a
 * log of what this script assumes happened.
 *
 * Usage:
 *   1. Pick a template from templates/ and copy it to config.mjs (same
 *      folder as this file) — customize it first, or after, your call.
 *   2. Copy env.local.example to .env.local, fill in your bot token + server
 *      ID there (never on the command line — that's how it ends up in shell
 *      history or a screenshot).
 *   3. node discord-setup.mjs
 *
 * Bot setup steps (Discord Developer Portal + server) are in SETUP-BOT.md.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as config from "./config.mjs";

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

// Discord permission bit flags (discord.com/developers/docs/topics/permissions).
const PERM = {
  VIEW_CHANNEL: 1n << 10n,
  SEND_MESSAGES: 1n << 11n,
  READ_MESSAGE_HISTORY: 1n << 16n,
  CONNECT: 1n << 20n,
  SPEAK: 1n << 21n,
  MANAGE_MESSAGES: 1n << 13n,
  ADMINISTRATOR: 1n << 3n,
};

// A sane default if a template doesn't define its own AUTOMOD_RULES — free
// on every server, no boost/Nitro needed, useful regardless of server type.
const DEFAULT_AUTOMOD_RULES = [
  {
    name: "Blocked keywords",
    event_type: 1, // MESSAGE_SEND
    trigger_type: 4, // KEYWORD_PRESET
    trigger_metadata: { presets: [1, 2, 3] }, // profanity, sexual content, slurs
    actions: [{ type: 1, metadata: {} }], // BLOCK_MESSAGE
    enabled: true,
  },
  {
    name: "Mention spam guard",
    event_type: 1,
    trigger_type: 5, // MENTION_SPAM
    trigger_metadata: { mention_total_limit: 5, mention_raid_protection_enabled: true },
    actions: [{ type: 1, metadata: {} }],
    enabled: true,
  },
];

const ROLES = config.ROLES;
const CATEGORIES = config.CATEGORIES;
const AUTOMOD_RULES = config.AUTOMOD_RULES ?? DEFAULT_AUTOMOD_RULES;
const RULES_GATE_VALUES = config.RULES_GATE_VALUES;
const ONBOARDING_QUESTION = config.ONBOARDING_QUESTION;
const ONBOARDING_GRANTS_ROLE = config.ONBOARDING_GRANTS_ROLE;
const DEFAULT_CHANNELS = config.DEFAULT_CHANNELS ?? [];
const PINNED_MESSAGES = config.PINNED_MESSAGES ?? {};

const CHANNEL_TYPE = { text: 0, voice: 2, category: 4 };

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
    const retryAfter = (body.retry_after ?? 1) * 1000;
    console.log(`  rate limited, waiting ${Math.ceil(retryAfter)}ms…`);
    await sleep(retryAfter);
    return discordFetch(token, path, options);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${options.method ?? "GET"} ${path} → ${res.status}: ${body}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

function overwrite(roleId, { allow = 0n, deny = 0n } = {}) {
  return { id: roleId, type: 0, allow: allow.toString(), deny: deny.toString() };
}

// Finds an existing item by its current desired name, falling back to any of
// its previousNames — so a rename converges onto the same object instead of
// creating a new one next to the old one.
function findExisting(map, name, previousNames = []) {
  return map.get(name) ?? previousNames.map((n) => map.get(n)).find(Boolean);
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
  if (!ROLES || !CATEGORIES) {
    console.error("config.mjs is missing ROLES or CATEGORIES — copy one of templates/*.mjs to config.mjs first.");
    process.exit(1);
  }

  const summary = {
    rolesCreated: 0, rolesReused: 0,
    categoriesCreated: 0, categoriesSynced: 0,
    channelsCreated: 0, channelsSynced: 0,
    automodCreated: 0, automodReused: 0,
    messagesPosted: 0, messagesSkipped: 0,
    errors: [],
  };

  // ---- roles ----
  console.log("Roles");
  const existingRoles = await discordFetch(token, `/guilds/${guildId}/roles`);
  const roleByName = new Map(existingRoles.map((r) => [r.name, r]));

  for (const role of ROLES) {
    const existing = findExisting(roleByName, role.name, role.previousNames);
    try {
      if (existing) {
        if (existing.name !== role.name) {
          await discordFetch(token, `/guilds/${guildId}/roles/${existing.id}`, {
            method: "PATCH",
            body: JSON.stringify({ name: role.name }),
          });
          console.log(`  renamed "${existing.name}" → "${role.name}"`);
        } else {
          console.log(`  ${role.name} — already exists, reusing`);
        }
        roleByName.set(role.name, { ...existing, name: role.name });
        summary.rolesReused += 1;
      } else {
        const created = await discordFetch(token, `/guilds/${guildId}/roles`, {
          method: "POST",
          body: JSON.stringify({
            name: role.name,
            color: role.color,
            hoist: role.hoist,
            permissions: (role.permissions ?? 0n).toString(),
            mentionable: true,
          }),
        });
        roleByName.set(role.name, created);
        console.log(`  ${role.name} — created`);
        summary.rolesCreated += 1;
      }
      await sleep(350);
    } catch (err) {
      console.error(`  ${role.name} — FAILED: ${err.message}`);
      summary.errors.push(`role ${role.name}: ${err.message}`);
    }
  }

  // Reorder so the first role in ROLES ends up on top. Requires the bot's
  // own role to already sit above all of these in the server's role list
  // (see SETUP-BOT.md) — if this fails, drag the roles into order by hand
  // in Server Settings → Roles.
  try {
    const positions = [...ROLES].reverse().filter((r) => roleByName.has(r.name)).map((r, i) => ({
      id: roleByName.get(r.name).id,
      position: i + 1,
    }));
    if (positions.length > 0) {
      await discordFetch(token, `/guilds/${guildId}/roles`, { method: "PATCH", body: JSON.stringify(positions) });
      console.log(`  reordered ${ROLES.map((r) => r.name).join(" → ")}`);
    }
  } catch (err) {
    console.error(`  reorder FAILED (fix by hand in Server Settings → Roles): ${err.message}`);
    summary.errors.push(`role reorder: ${err.message}`);
  }

  const everyoneId = guildId; // Discord fact: @everyone's role ID always equals the guild ID.

  // ---- categories + channels ----
  const existingChannels = await discordFetch(token, `/guilds/${guildId}/channels`);
  const categoryByName = new Map(existingChannels.filter((c) => c.type === CHANNEL_TYPE.category).map((c) => [c.name, c]));
  const channelKey = (name, parentId) => `${parentId ?? "none"}::${name}`;
  const channelByKey = new Map(existingChannels.filter((c) => c.type !== CHANNEL_TYPE.category).map((c) => [channelKey(c.name, c.parent_id), c]));
  const findExistingChannel = (parentId, name, previousNames = []) =>
    channelByKey.get(channelKey(name, parentId)) ?? previousNames.map((n) => channelByKey.get(channelKey(n, parentId))).find(Boolean);
  const channelByAnyName = new Map(existingChannels.filter((c) => c.type !== CHANNEL_TYPE.category).map((c) => [c.name, c])); // for `adopts` only
  const channelIdByName = new Map(); // filled in below; used later for onboarding defaults + pinned messages

  for (const [catIndex, category] of CATEGORIES.entries()) {
    console.log(`\n${category.name}`);

    // `restricted` + `viewableBy` gates a whole category to specific roles —
    // works the same for a staff-only area or a paid-members-only area,
    // whatever the template calls for.
    const categoryRoleIds = (category.viewableBy ?? []).map((n) => roleByName.get(n)?.id).filter(Boolean);
    const staffOverwrites = category.restricted && categoryRoleIds.length > 0
      ? [overwrite(everyoneId, { deny: PERM.VIEW_CHANNEL }), ...categoryRoleIds.map((id) => overwrite(id, { allow: PERM.VIEW_CHANNEL }))]
      : [];

    let cat = findExisting(categoryByName, category.name, category.previousNames);
    try {
      if (cat) {
        await discordFetch(token, `/channels/${cat.id}`, {
          method: "PATCH",
          body: JSON.stringify({ name: category.name, permission_overwrites: staffOverwrites }),
        });
        console.log(cat.name === category.name ? `  (category already existed — permissions synced)` : `  renamed "${cat.name}" → "${category.name}"`);
        summary.categoriesSynced += 1;
      } else {
        cat = await discordFetch(token, `/guilds/${guildId}/channels`, {
          method: "POST",
          body: JSON.stringify({ name: category.name, type: CHANNEL_TYPE.category, position: catIndex, permission_overwrites: staffOverwrites }),
        });
        categoryByName.set(category.name, cat);
        console.log(`  (category created)`);
        summary.categoriesCreated += 1;
      }
      await sleep(350);
    } catch (err) {
      console.error(`  category FAILED: ${err.message}`);
      summary.errors.push(`category ${category.name}: ${err.message}`);
      continue;
    }

    for (const chan of category.channels) {
      let existing = findExistingChannel(cat.id, chan.name, chan.previousNames);

      // `adopts`: Discord itself auto-creates a "rules" and/or "moderator-only"
      // channel when Community mode is turned on, if none are designated yet.
      // Rather than leave a duplicate sitting next to ours, we rename +
      // relocate Discord's original into place (and repoint whichever
      // guild-level designation it holds, via `guildField`, onto its new
      // self) — BEFORE deleting our own duplicate, since Discord refuses to
      // delete whichever channel currently holds that designation.
      if (chan.adopts) {
        const adoptTarget = chan.adopts.map((n) => channelByAnyName.get(n)).find(Boolean);
        if (adoptTarget && adoptTarget.id !== existing?.id) {
          try {
            await discordFetch(token, `/channels/${adoptTarget.id}`, {
              method: "PATCH",
              body: JSON.stringify({ name: chan.name, parent_id: cat.id }),
            });
            if (chan.guildField) {
              await discordFetch(token, `/guilds/${guildId}`, {
                method: "PATCH",
                body: JSON.stringify({ [chan.guildField]: adoptTarget.id }),
              });
            }
            if (existing) {
              await discordFetch(token, `/channels/${existing.id}`, { method: "DELETE" });
              console.log(`  deleted our duplicate #${existing.name} — adopted Discord's own "${adoptTarget.name}" as #${chan.name} instead`);
            } else {
              console.log(`  adopted Discord's own "${adoptTarget.name}" as #${chan.name}`);
            }
            await sleep(350);
          } catch (err) {
            console.error(`  adopt FAILED for ${chan.name}: ${err.message}`);
            summary.errors.push(`adopt ${chan.name}: ${err.message}`);
          }
          existing = adoptTarget;
        }
      }

      const viewRoleIds = (chan.viewableBy ?? []).map((n) => roleByName.get(n)?.id).filter(Boolean);
      const postRoleIds = (chan.postableBy ?? []).map((n) => roleByName.get(n)?.id).filter(Boolean);
      const overwrites = [...staffOverwrites];
      if (chan.viewableBy) {
        overwrites.push(overwrite(everyoneId, { deny: PERM.VIEW_CHANNEL }));
        viewRoleIds.forEach((id) => overwrites.push(overwrite(id, { allow: PERM.VIEW_CHANNEL })));
      }
      if (chan.readOnly && postRoleIds.length > 0) {
        overwrites.push(overwrite(everyoneId, { deny: PERM.SEND_MESSAGES }));
        postRoleIds.forEach((id) => overwrites.push(overwrite(id, { allow: PERM.SEND_MESSAGES })));
      }

      const desired = { name: chan.name, parent_id: cat.id, permission_overwrites: overwrites };
      if (chan.type === "text") {
        desired.topic = chan.topic ?? "";
        desired.rate_limit_per_user = chan.slowModeSeconds ?? 0;
      }

      try {
        if (existing) {
          await discordFetch(token, `/channels/${existing.id}`, { method: "PATCH", body: JSON.stringify(desired) });
          console.log(existing.name === chan.name ? `  #${chan.name} — already existed, permissions/topic/slow-mode synced` : `  renamed "${existing.name}" → "${chan.name}" and moved into ${category.name}`);
          summary.channelsSynced += 1;
          channelIdByName.set(chan.name, existing.id);
        } else {
          const created = await discordFetch(token, `/guilds/${guildId}/channels`, {
            method: "POST",
            body: JSON.stringify({ type: CHANNEL_TYPE[chan.type], parent_id: cat.id, ...desired }),
          });
          console.log(`  #${chan.name} — created`);
          summary.channelsCreated += 1;
          channelIdByName.set(chan.name, created.id);
        }
        await sleep(350);
      } catch (err) {
        console.error(`  #${chan.name} — FAILED: ${err.message}`);
        summary.errors.push(`channel ${chan.name}: ${err.message}`);
      }
    }
  }

  // ---- AutoMod (free on every server) ----
  console.log("\nAutoMod");
  try {
    const exemptRoles = ROLES.filter((r) => r.exemptFromAutomod).map((r) => roleByName.get(r.name)?.id).filter(Boolean);
    const existingAutomod = await discordFetch(token, `/guilds/${guildId}/auto-moderation/rules`);
    const automodByName = new Map(existingAutomod.map((r) => [r.name, r]));

    for (const rule of AUTOMOD_RULES) {
      if (automodByName.has(rule.name)) {
        console.log(`  ${rule.name} — already exists, reusing`);
        summary.automodReused += 1;
        continue;
      }
      try {
        await discordFetch(token, `/guilds/${guildId}/auto-moderation/rules`, {
          method: "POST",
          body: JSON.stringify({ ...rule, exempt_roles: exemptRoles }),
        });
        console.log(`  ${rule.name} — created`);
        summary.automodCreated += 1;
        await sleep(350);
      } catch (err) {
        console.error(`  ${rule.name} — FAILED: ${err.message}`);
        summary.errors.push(`automod ${rule.name}: ${err.message}`);
      }
    }
  } catch (err) {
    console.error(`  could not read existing AutoMod rules: ${err.message}`);
    summary.errors.push(`automod list: ${err.message}`);
  }

  // ---- membership screening (rules gate) — requires Community mode already on ----
  if (RULES_GATE_VALUES?.length) {
    console.log("\nMembership screening (rules gate)");
    try {
      await discordFetch(token, `/guilds/${guildId}/member-verification`, {
        method: "PATCH",
        body: JSON.stringify({
          enabled: true,
          form_fields: [{ field_type: "TERMS", label: "Community rules", values: RULES_GATE_VALUES, required: true }],
        }),
      });
      console.log("  rules gate — set");
    } catch (err) {
      console.error(`  FAILED (needs Community mode on first — Server Settings → Enable Community): ${err.message}`);
      summary.errors.push(`membership screening: ${err.message}`);
    }
  }

  // ---- onboarding (welcome question + default channels) ----
  if (ONBOARDING_QUESTION) {
    console.log("\nOnboarding");
    try {
      const grantRoleId = roleByName.get(ONBOARDING_GRANTS_ROLE)?.id;
      const defaultChannelIds = DEFAULT_CHANNELS.map((n) => channelIdByName.get(n)).filter(Boolean);
      const missing = DEFAULT_CHANNELS.filter((n) => !channelIdByName.has(n));

      if (missing.length > 0) {
        console.error(`  skipped — missing channel id(s) for: ${missing.join(", ")}`);
        summary.errors.push(`onboarding: missing channel ids for ${missing.join(", ")}`);
      } else {
        await discordFetch(token, `/guilds/${guildId}/onboarding`, {
          method: "PUT",
          body: JSON.stringify({
            prompts: [
              {
                id: ONBOARDING_QUESTION.id,
                type: 0, // MULTIPLE_CHOICE
                title: ONBOARDING_QUESTION.title,
                single_select: true,
                required: true,
                in_onboarding: true,
                options: ONBOARDING_QUESTION.options.map((o) => ({
                  id: o.id,
                  title: o.title,
                  description: o.description ?? "",
                  channel_ids: [],
                  role_ids: grantRoleId ? [grantRoleId] : [],
                })),
              },
            ],
            default_channel_ids: defaultChannelIds,
            enabled: true,
            mode: 0, // ONBOARDING_DEFAULT
          }),
        });
        console.log(`  welcome question + default channels — set (every answer grants ${ONBOARDING_GRANTS_ROLE})`);
      }
    } catch (err) {
      console.error(`  FAILED (needs Community mode on; if this keeps failing, finish it by hand in Server Settings → Onboarding — no harm done): ${err.message}`);
      summary.errors.push(`onboarding: ${err.message}`);
    }
  }

  // ---- pinned channel copy — posts once, skips a channel that already has any message ----
  if (Object.keys(PINNED_MESSAGES).length > 0) {
    console.log("\nPinned channel copy");
    for (const [chanName, content] of Object.entries(PINNED_MESSAGES)) {
      const chanId = channelIdByName.get(chanName);
      if (!chanId) {
        console.error(`  #${chanName} — FAILED: channel id not found`);
        summary.errors.push(`pinned message ${chanName}: channel id not found`);
        continue;
      }
      try {
        const existingMessages = await discordFetch(token, `/channels/${chanId}/messages?limit=1`);
        if (existingMessages.length > 0) {
          console.log(`  #${chanName} — already has messages, skipping`);
          summary.messagesSkipped += 1;
          continue;
        }
        const message = await discordFetch(token, `/channels/${chanId}/messages`, { method: "POST", body: JSON.stringify({ content }) });
        await discordFetch(token, `/channels/${chanId}/pins/${message.id}`, { method: "PUT" });
        console.log(`  #${chanName} — posted + pinned`);
        summary.messagesPosted += 1;
        await sleep(350);
      } catch (err) {
        console.error(`  #${chanName} — FAILED: ${err.message}`);
        summary.errors.push(`pinned message ${chanName}: ${err.message}`);
      }
    }
  }

  // ---- permission check — proof, not just a log of what should have happened ----
  console.log("\nPermission check (what's actually hidden from @everyone right now):");
  try {
    const finalChannels = await discordFetch(token, `/guilds/${guildId}/channels`);
    for (const c of finalChannels.filter((c) => c.type !== CHANNEL_TYPE.category).sort((a, b) => a.name.localeCompare(b.name))) {
      const ow = (c.permission_overwrites ?? []).find((o) => o.id === everyoneId);
      const deny = ow ? BigInt(ow.deny) : 0n;
      const hidden = (deny & PERM.VIEW_CHANNEL) === PERM.VIEW_CHANNEL;
      const readOnlyForEveryone = (deny & PERM.SEND_MESSAGES) === PERM.SEND_MESSAGES;
      const label = hidden ? "hidden from everyone" : readOnlyForEveryone ? "visible, read-only for everyone" : "visible, everyone can post";
      console.log(`  #${c.name} — ${label}`);
    }
  } catch (err) {
    console.error(`  could not verify: ${err.message}`);
    summary.errors.push(`permission check: ${err.message}`);
  }

  console.log("\n— done —");
  console.log(`roles: ${summary.rolesCreated} created, ${summary.rolesReused} reused`);
  console.log(`categories: ${summary.categoriesCreated} created, ${summary.categoriesSynced} synced`);
  console.log(`channels: ${summary.channelsCreated} created, ${summary.channelsSynced} synced`);
  console.log(`automod rules: ${summary.automodCreated} created, ${summary.automodReused} reused`);
  console.log(`pinned messages: ${summary.messagesPosted} posted, ${summary.messagesSkipped} already had content`);
  if (summary.errors.length > 0) {
    console.log(`\n${summary.errors.length} error(s):`);
    summary.errors.forEach((e) => console.log(`  - ${e}`));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
