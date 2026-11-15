/**
 * TEMPLATE: Growing Community — for a community with real content behind
 * it (streams, posts, drops — whatever your "we're live/we shipped
 * something" moment is), a moderation tier, and room to actually grow.
 *
 * 13 channels across 5 categories, 3 roles. Still within the "not too many
 * channels" range for a starting server — categories do the organizing
 * work, not sheer channel count.
 *
 * To use: copy this file to ../config.mjs, then edit the parts marked
 * [CUSTOMIZE] before running discord-setup.mjs.
 */

export const ROLES = [
  // Lowest to highest — position is assigned from this order.
  { name: "Member", color: 0x3498db, hoist: true, permissions: 0n },
  { name: "Staff", color: 0xf39c12, hoist: true, permissions: 1n << 13n /* MANAGE_MESSAGES */, exemptFromAutomod: true },
  { name: "Admin", color: 0xe74c3c, hoist: true, permissions: 1n << 3n /* ADMINISTRATOR */, exemptFromAutomod: true },
];

export const CATEGORIES = [
  {
    name: "📍 Start Here",
    channels: [
      { name: "👋welcome", type: "text", readOnly: true, postableBy: ["Admin", "Staff"], topic: "Read #rules, then say hi in #introductions." },
      { name: "📜rules", type: "text", readOnly: true, postableBy: ["Admin", "Staff"], adopts: ["rules"], guildField: "rules_channel_id", topic: "The one page everyone reads first." },
      { name: "📣announcements", type: "text", readOnly: true, postableBy: ["Admin", "Staff"], topic: "Admin + staff only. Big news lands here." },
    ],
  },
  {
    name: "💬 Community",
    channels: [
      { name: "💬general", type: "text", topic: "Open floor.", slowModeSeconds: 5 },
      { name: "🙋introductions", type: "text", topic: "New here? Say hi." },
      { name: "🌟showcase", type: "text", topic: "Share what you've made.", slowModeSeconds: 10 },
      { name: "🔗resources", type: "text", topic: "Curated links — tools, worth-reading picks." },
    ],
  },
  {
    name: "🎥 Live",
    channels: [
      { name: "🎥live-chat", type: "text", topic: "Live chat companion — active whenever a stream's running.", slowModeSeconds: 3 },
      { name: "🗓️schedule", type: "text", topic: "Pinned: when the next stream/event is." },
    ],
  },
  {
    name: "🔊 Voice",
    channels: [
      { name: "🎧 Hangout", type: "voice" },
      { name: "🎙️ Meeting Room", type: "voice" },
    ],
  },
  {
    name: "⚙️ Staff",
    restricted: true,
    viewableBy: ["Admin", "Staff"],
    channels: [
      { name: "🛡️staff-room", type: "text", adopts: ["moderator-only"], guildField: "public_updates_channel_id", topic: "Admin + staff only." },
      { name: "🧭staff-lounge", type: "text", topic: "Admin + staff only." },
    ],
  },
];

// [CUSTOMIZE] — the checklist people agree to before they can chat.
export const RULES_GATE_VALUES = [
  "Be someone people want to spend time next to. No harassment, hate speech, or personal attacks.",
  "Keep it real — no spam, scams, or self-promo dumped without context.",
  "Keep it on-topic per channel — #general is the one exception.",
  "NSFW, gore, and illegal content: zero tolerance, instant ban.",
  "Staff and Admin have final say. Ask if something's unclear.",
];

// [CUSTOMIZE] — one question, asked once, right after someone agrees to the rules.
export const ONBOARDING_QUESTION = {
  id: "0",
  title: "What brings you here?",
  options: [
    { id: "1", title: "🛠️ I want to get involved", description: "" },
    { id: "2", title: "🎥 Here for the stream", description: "" },
    { id: "3", title: "💡 Curious what this is", description: "" },
    { id: "4", title: "👀 Just exploring", description: "" },
  ],
};
export const ONBOARDING_GRANTS_ROLE = "Member"; // whichever option they pick, they get this role

export const DEFAULT_CHANNELS = ["👋welcome", "📜rules", "📣announcements", "💬general", "🙋introductions", "🌟showcase", "🔗resources"];

// [CUSTOMIZE] — replace [Server Name] and the bracketed bits. Posted once,
// pinned automatically; won't re-post if you've already written something
// in these channels by hand.
export const PINNED_MESSAGES = {
  "👋welcome": `👋 **Welcome to [Server Name]**

[One or two sentences about what this community is and why it exists.]

Start here:
📜 rules — the one page, read it once
🙋 introductions — say hi, tell us what you're into
💬 general — open floor

We're building this in public — big news lands in 📣 announcements.

Glad you're here.`,
  "📜rules": `📜 **[Server Name] — the rules**

1. Be someone people want to spend time next to. No harassment, hate speech, or personal attacks.
2. Keep it real — no spam, scams, or self-promo dumped without context.
3. Keep it on-topic per channel — #general is the one exception.
4. NSFW, gore, and illegal content: zero tolerance, instant ban.
5. Staff and Admin have final say. Ask in 🛡️staff-room if something's unclear.

Break these and expect a warning, then a timeout, then removal — depends how bad it is.`,
  "📣announcements": `📣 **Announcements**

Admin and Staff post here — schedule, big news, updates. Everyone else: this one's read-only, but 🎥live-chat and 💬general are where the conversation happens.`,
};
