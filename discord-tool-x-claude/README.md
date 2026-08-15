# Discord Tool × Claude

A free toolkit for standing up a fully configured Discord community
server — roles, categories, channels, permissions, moderation, a
rules-agreement gate, and onboarding — in one run. It was thought up and
built together with Claude, and it does the job as well as (often better
than) the paid third-party bots that offer the same setup, without a
subscription, without an always-on bot, and without a dashboard login. It
was inspired by an earlier Discord setup that used this exact approach.

You run one script, once. It talks to Discord directly and builds
everything. Run it again any time and it repairs anything that's drifted
instead of duplicating things. A second, read-only script lets you (or
Claude) inspect exactly what's live on your server whenever you want a
second opinion.

No coding required on your end — Claude does the writing and the running;
you do the clicking inside Discord and the deciding on what things are
called.

## What it does

- Builds a role ladder, categories, and channels from a template you pick
  and customize.
- Sets channel-by-channel permissions (who can see what, who can post
  where, staff-only or paid-only areas) and slow-mode on busy channels.
- Turns on two free AutoMod rules (a blocked-keyword filter, a mention-spam
  guard).
- Sets the rules-agreement gate people check off before they can chat.
- Sets the one onboarding question new members answer, which grants them
  their starting role automatically.
- Posts and pins your welcome/rules copy — but only into channels that are
  still empty, so it never overwrites anything you've written by hand.
- Adopts the "rules" and "moderator-only" channels Discord auto-creates the
  moment you turn on Community mode, instead of leaving duplicates next to
  your own.
- Everything is free — no Discord Nitro, no server boost required.

## What's inside

| File | What it's for |
|---|---|
| `START-HERE.md` | The prompt — paste it as your first message to Claude. |
| `SETUP-BOT.md` | Click-by-click walkthrough for the one part that happens inside Discord itself: creating the bot that runs the script. |
| `discord-setup.mjs` | The builder. Reads `config.mjs`, builds/repairs your server. |
| `discord-inspect.mjs` | The read-only twin. Prints exactly what's live on your server right now — roles, permissions, the actual rules text, onboarding setup — without changing anything. |
| `templates/` | Three starting configs to pick from and customize — see `templates/README.md`. |
| `env.local.example` | Copy to `.env.local` and fill in your bot's token and server ID there — never in the terminal, never in a chat. |

## Quick start

1. Read `templates/README.md`, pick a template, copy it to `config.mjs` in
   this folder.
2. Follow `SETUP-BOT.md` to create your bot and get its token.
3. `node discord-setup.mjs` — read what it prints.
4. `node discord-inspect.mjs` before you delete the bot, to confirm the
   real state with a second, independent check.

Or skip straight to `START-HERE.md` and hand the whole thing to Claude.

## A word on the token

The bot token you'll get while following `SETUP-BOT.md` is a password —
whoever has it can control your server. Keep it in `.env.local` only,
never in a chat, never typed into a terminal command directly (that's how
it ends up in shell history or a screenshot). If it's ever exposed
anywhere it shouldn't be, reset it immediately in Discord's Developer
Portal — that's an instant, free fix, and the only one that actually
matters once a token's been seen somewhere it shouldn't.
