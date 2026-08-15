/**
 * TEMPLATE: Minimal — a lean starter for a brand-new server.
 *
 * 6 channels, 2 roles. Research on new-community layouts is consistent on
 * this: 5–10 visible channels is the sweet spot before new joiners feel
 * overwhelmed and bounce. Start here, add channels only once real
 * conversation demands them — not before.
 *
 * To use: copy this file to ../config.mjs, then edit the parts marked
 * [CUSTOMIZE] before running discord-setup.mjs.
 */

export const ROLES = [
  // Lowest to highest — position is assigned from this order.
  { name: "Member", color: 0x3498db, hoist: true, permissions: 0n },
  { name: "Admin", color: 0xe67e22, hoist: true, permissions: 1n << 3n /* ADMINISTRATOR */, exemptFromAutomod: true },
];

export const CATEGORIES = [
  {
    name: "📍 Start Here",
    channels: [
      { name: "👋welcome", type: "text", readOnly: true, postableBy: ["Admin"], topic: "Read #rules, then say hi." },
      // `adopts` + `guildField`: Discord auto-creates its own "rules" channel
      // when Community mode is turned on, if none is designated yet. This
      // adopts that one instead of leaving a duplicate — keep this pairing
      // on whichever channel you want as your actual rules channel.
      { name: "📜rules", type: "text", readOnly: true, postableBy: ["Admin"], adopts: ["rules"], guildField: "rules_channel_id", topic: "The one page everyone reads first." },
    ],
  },
  {
    name: "💬 Community",
    channels: [
      { name: "💬general", type: "text", topic: "Say whatever." },
      { name: "🗯️off-topic", type: "text", topic: "Everything that isn't on-topic anywhere else." },
    ],
  },
  {
    name: "🔊 Voice",
    channels: [{ name: "🎧 Hangout", type: "voice" }],
  },
  {
    name: "⚙️ Admin",
    restricted: true,
    viewableBy: ["Admin"],
    channels: [
      // Same adopt pattern for Discord's other auto-created default — the
      // "moderator-only" / community-updates channel.
      { name: "🛡️admin-notes", type: "text", adopts: ["moderator-only"], guildField: "public_updates_channel_id", topic: "Admin only." },
    ],
  },
];

// [CUSTOMIZE] — the checklist people agree to before they can chat.
export const RULES_GATE_VALUES = [
  "Be respectful. No harassment, hate speech, or personal attacks.",
  "No spam, scams, or unsolicited self-promotion.",
  "Illegal content or NSFW material: zero tolerance.",
];

// [CUSTOMIZE] — one question, asked once, right after someone agrees to the rules.
export const ONBOARDING_QUESTION = {
  id: "0",
  title: "What brings you here?",
  options: [
    { id: "1", title: "👀 Just looking around", description: "" },
    { id: "2", title: "💬 Here to chat", description: "" },
    { id: "3", title: "🙋 A friend invited me", description: "" },
  ],
};
export const ONBOARDING_GRANTS_ROLE = "Member"; // whichever option they pick, they get this role

export const DEFAULT_CHANNELS = ["👋welcome", "📜rules", "💬general"];

// [CUSTOMIZE] — replace [Server Name] and the bracketed bits. Posted once,
// pinned automatically; won't re-post if you've already written something
// in these channels by hand.
export const PINNED_MESSAGES = {
  "👋welcome": `👋 **Welcome to [Server Name]**

This is [one sentence about what this place is for].

Start here:
📜 rules — the one page, read it once
💬 general — say hi, jump in

Glad you're here.`,
  "📜rules": `📜 **[Server Name] — the rules**

1. Be respectful. No harassment, hate speech, or personal attacks.
2. No spam, scams, or unsolicited self-promotion.
3. Illegal content or NSFW material: zero tolerance.

Break these and expect a warning, then a timeout, then removal — depends how bad it is.`,
};
