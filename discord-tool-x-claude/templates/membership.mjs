/**
 * TEMPLATE: Membership — a free public area plus a role-gated area for
 * paying/verified members. Demonstrates a pattern the other two templates
 * don't: a whole CATEGORY hidden from everyone except specific roles
 * (`restricted: true, viewableBy: [...]`), the same mechanism a staff area
 * uses, just pointed at a different role.
 *
 * The "Paid Member" role isn't auto-granted by anything here — nothing in
 * Discord's own API can verify a payment. Assign it by hand for now
 * (Server Settings → Members → find them → add role), or, once you have a
 * real payment/membership system elsewhere, sync it from there.
 *
 * To use: copy this file to ../config.mjs, then edit the parts marked
 * [CUSTOMIZE] before running discord-setup.mjs.
 */

export const ROLES = [
  // Lowest to highest — position is assigned from this order.
  { name: "Free Member", color: 0x3498db, hoist: true, permissions: 0n },
  { name: "Paid Member", color: 0x9b59b6, hoist: true, permissions: 0n },
  { name: "Staff", color: 0xf39c12, hoist: true, permissions: 1n << 13n /* MANAGE_MESSAGES */, exemptFromAutomod: true },
  { name: "Admin", color: 0xe74c3c, hoist: true, permissions: 1n << 3n /* ADMINISTRATOR */, exemptFromAutomod: true },
];

export const CATEGORIES = [
  {
    name: "📍 Start Here",
    channels: [
      { name: "👋welcome", type: "text", readOnly: true, postableBy: ["Admin", "Staff"], topic: "Read #rules, then say hi in #introductions." },
      { name: "📜rules", type: "text", readOnly: true, postableBy: ["Admin", "Staff"], adopts: ["rules"], guildField: "rules_channel_id", topic: "The one page everyone reads first." },
    ],
  },
  {
    name: "💬 Community",
    channels: [
      { name: "💬general", type: "text", topic: "Open to everyone.", slowModeSeconds: 5 },
      { name: "🙋introductions", type: "text", topic: "New here? Say hi." },
    ],
  },
  {
    name: "🔒 Members-Only",
    restricted: true,
    viewableBy: ["Paid Member", "Staff", "Admin"],
    channels: [
      { name: "💎perks-and-drops", type: "text", readOnly: true, postableBy: ["Admin", "Staff"], topic: "Paid-member perks, early access, drops." },
      { name: "💬member-chat", type: "text", topic: "Paid members only." },
    ],
  },
  {
    name: "⚙️ Staff",
    restricted: true,
    viewableBy: ["Admin", "Staff"],
    channels: [
      { name: "🛡️staff-room", type: "text", adopts: ["moderator-only"], guildField: "public_updates_channel_id", topic: "Admin + staff only." },
    ],
  },
];

// [CUSTOMIZE] — the checklist people agree to before they can chat.
export const RULES_GATE_VALUES = [
  "Be respectful. No harassment, hate speech, or personal attacks.",
  "No spam, scams, or unsolicited self-promotion.",
  "Don't share Members-Only content outside this server.",
  "Illegal content or NSFW material: zero tolerance.",
];

// [CUSTOMIZE] — one question, asked once, right after someone agrees to the
// rules. This can't detect payment status — everyone lands as Free Member;
// upgrade to Paid Member is a separate, deliberate step (see file header).
export const ONBOARDING_QUESTION = {
  id: "0",
  title: "What brings you here?",
  options: [
    { id: "1", title: "👀 Just checking it out", description: "" },
    { id: "2", title: "💎 I'm interested in membership", description: "" },
    { id: "3", title: "🙋 A friend invited me", description: "" },
  ],
};
export const ONBOARDING_GRANTS_ROLE = "Free Member";

export const DEFAULT_CHANNELS = ["👋welcome", "📜rules", "💬general", "🙋introductions"];

// [CUSTOMIZE] — replace [Server Name] and the bracketed bits. Posted once,
// pinned automatically; won't re-post if you've already written something
// in these channels by hand.
export const PINNED_MESSAGES = {
  "👋welcome": `👋 **Welcome to [Server Name]**

[One or two sentences about what this is and what membership unlocks.]

Start here:
📜 rules — the one page, read it once
🙋 introductions — say hi

Everyone gets the free side. 💎 Members-Only opens up once you're a paid member — see #general for how.

Glad you're here.`,
  "📜rules": `📜 **[Server Name] — the rules**

1. Be respectful. No harassment, hate speech, or personal attacks.
2. No spam, scams, or unsolicited self-promotion.
3. Don't share Members-Only content outside this server.
4. Illegal content or NSFW material: zero tolerance.

Break these and expect a warning, then a timeout, then removal — depends how bad it is.`,
};
