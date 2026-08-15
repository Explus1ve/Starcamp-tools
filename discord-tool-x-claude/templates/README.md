# Picking a template

Each file here is a complete, working starting point — roles, categories,
channels, the rules-agreement text, the one onboarding question, and the
welcome/rules messages. Copy whichever fits closest to `../config.mjs`, edit
the parts marked `[CUSTOMIZE]`, then follow `../SETUP-BOT.md`.

| Template | Roles | Channels | Best for |
|---|---|---|---|
| `minimal.mjs` | 2 (Member, Admin) | 6 | A brand-new server where you'd rather add structure as real conversation demands it than guess upfront. |
| `community.mjs` | 3 (Member, Staff, Admin) | 13 | A community with actual content behind it — streams, posts, drops, events — and enough people that moderation needs its own tier. |
| `membership.mjs` | 4 (Free Member, Paid Member, Staff, Admin) | 11 | Anywhere with a free public side and a gated area for paying or verified members — shows the "hide a whole category from everyone except these roles" pattern the other two don't need. |

Don't feel locked in — these are starting points, not finished products. The
easiest way to customize one is to just tell Claude what's different about
your community and have it edit the copied `config.mjs` with you, rather
than hand-editing the JavaScript yourself.

**A note if you're mixing pieces from two templates:** every category and
channel that's meant to survive Discord auto-creating its own defaults
carries an `adopts` + `guildField` pair (see any template's rules channel).
Keep exactly one channel per `guildField` value (`rules_channel_id` and
`public_updates_channel_id`) across your whole config, or the last one
processed wins.
