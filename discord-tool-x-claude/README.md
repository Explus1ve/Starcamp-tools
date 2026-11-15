# Discord Tool × Claude

A free toolkit that builds a fully set-up Discord community server in one run: roles, categories, channels, permissions, moderation, a rules gate and a welcome question. It was built together with Claude, and it runs from your own computer, with no subscription, no bot left running and no dashboard to sign in to.

You run one script. It talks to Discord directly and builds everything. Run it again any time and it repairs whatever has drifted, without making copies. A second script only reads: it shows you, or Claude, exactly what is live on your server, whenever you want a second opinion.

Claude does the writing and the running. You do the clicking inside Discord and the deciding on what things are called.

## What it does

- Builds a ladder of roles, then categories and channels, from a template you pick and adjust. (A role is a label on a member that decides what they can see and do. A category is a folder of channels.)
- Sets who can see and post in each channel, including staff-only or members-only areas, and slow-mode on busy channels. (Slow-mode makes people wait a few seconds between messages.)
- Turns on two of Discord's free AutoMod rules, its built-in moderator: one blocks offensive words, one stops someone tagging a crowd of people at once.
- Sets the rules gate, the short list new people agree to before they can chat.
- Sets the one welcome question new members answer, which gives them their starting role automatically.
- Posts and pins your welcome and rules messages, only into channels that are still empty, so anything you wrote by hand stays as it is.
- Takes over the "rules" and "moderator-only" channels Discord makes by itself when you turn on Community mode, so you end up with one of each.
- Uses only Discord's free features. No Nitro, no server boost.

## What it changes, and when it asks

The setup script starts with a preview. `node discord-setup.mjs` reads your server, prints every change a real run would make, and changes nothing. You read the plan, with Claude if you like. When it looks right, `node discord-setup.mjs --yes` makes those changes on your live server: it creates, renames and moves roles and channels, resets each channel's permissions to match your settings, and, where Discord made its own rules channel, removes the duplicate.

The inspector, `discord-inspect.mjs`, only reads. Run it as often as you like.

## What you need

- A Discord account and a server you own, or a new one.
- Node.js, the free program that runs the two scripts, version 18 or newer. Claude can check whether you have it and help you install it.
- About an hour, most of it inside Discord's settings.

## What's inside

| File | What it's for |
|---|---|
| `START-HERE.md` | The message to paste as your first one to Claude. |
| `SETUP-BOT.md` | Click by click, the part that happens inside Discord: creating the bot that runs the script. (A bot is an account a program uses instead of a person.) |
| `discord-setup.mjs` | The builder. Reads `config.mjs`, previews what it would change, and with `--yes` builds or repairs your server. |
| `discord-inspect.mjs` | The reader. Prints exactly what is live on your server right now: roles, permissions, the rules text, the welcome question. It changes nothing. |
| `templates/` | Three starting setups to pick from and adjust. See `templates/README.md`. |
| `env.local.example` | Copy it to `.env.local` and put your bot's token and server ID there, in that one file. |

## Quick start

1. Read `templates/README.md`, pick a template, and copy it to `config.mjs` in this folder.
2. Follow `SETUP-BOT.md` to create your bot and get its token.
3. Run `node discord-setup.mjs` and read the preview it prints.
4. When the plan looks right, run `node discord-setup.mjs --yes` to make the changes.
5. Run `node discord-inspect.mjs` before you remove the bot, for a second, independent check.

Or start with `START-HERE.md` and hand the whole thing to Claude.

## The token is a password

While following `SETUP-BOT.md` you get a bot token. Whoever has it can control your server. It belongs in `.env.local` and nowhere else: keep it out of chats and out of terminal commands, where it can end up in your command history or a screenshot. If it is ever seen somewhere it should not be, reset it in Discord's Developer Portal. That takes a moment, it is free, and it is the fix that counts.
