# Setting up your Discord server — step by step

This walks through creating your Discord server and running
`discord-setup.mjs`, the script that builds your whole server structure —
roles, categories, channels, permissions, moderation, rules gate, onboarding
— in one go instead of clicking through it by hand.

**Security note:** the bot token you'll get in step 3 is a password for
that bot — anyone with it can control your server. Never paste it into a
Claude chat, an email, or anywhere else. It goes into a local file (step 8),
never into the terminal itself — that way there's nothing on screen to
screenshot or leak by accident. If it ever does end up somewhere it
shouldn't, reset it immediately (Developer Portal → your app → Bot → Reset
Token) — resetting is instant, free, and the only real fix once a token's
been seen somewhere it shouldn't.

## Before you start: Node.js
The two scripts run on Node.js, a free program that runs JavaScript on
your computer. You need version 18 or newer. Check in a terminal:

```
node --version
```

If it prints `v18` or higher, you're set. If it prints an older number or
"not recognized", install the LTS version (the long-term, stable one) from
**nodejs.org**, then close and reopen your terminal and check again.
Claude can walk you through it.

## 1. Pick a template
Read `templates/README.md`, pick the one closest to what you're building,
copy it to `config.mjs` in this folder, and customize the parts marked
`[CUSTOMIZE]` — with Claude's help if you want, just describe what's
different about your community.

## 2. Create the server (if you haven't already)
Discord app → the `+` at the bottom of the left server rail → **Create My
Own** → name it whatever you're calling this community.

## 3. Create a setup bot
This is a throwaway bot that exists only to run the script — you'll remove
it once the server's built.

1. Go to **discord.com/developers/applications** (sign in with the same
   Discord account) → **New Application** → name it something like
   `my-setup-bot` → Create.
2. Left sidebar → **Bot** → **Reset Token** (or **Add Bot** if you don't see
   a token yet) → **Copy**. This is the token — save it somewhere private for
   a minute (a note app is fine, just not this chat). You won't be able to
   see it again after you navigate away, only reset it.
3. Still on the Bot page: no toggles need to be turned on here — the script
   doesn't need any of the optional "Privileged Gateway Intents."

## 4. Invite the bot to your server
1. Left sidebar → **OAuth2** → **URL Generator**.
2. Under **Scopes**, tick `bot`.
3. Under **Bot Permissions**, tick **Administrator**. (This is temporary —
   you're removing the bot right after the script runs, so the shortcut of
   one broad permission beats debugging a maze of partial ones.)
4. Copy the **Generated URL** at the bottom, paste it into a new browser tab,
   pick your server, **Authorize**.

## 5. Move the bot's role to the top
Server Settings (click the server name → dropdown) → **Roles** → find the
bot's role (named after your application, e.g. `my-setup-bot`) → drag it to
the very top of the list, above everything else. This lets it create and
order your roles correctly — skip this and the role-ordering step in the
script will fail (channels still work fine either way).

## 6. Turn on Community
Server Settings → **Enable Community**. A short guided wizard — defaults are
fine for everything it asks. This is required before the rules gate and
onboarding steps will work; do it before running the script, not after.

## 7. Get your server's ID
Discord app → User Settings (gear icon) → **Advanced** → turn on
**Developer Mode**. Then right-click your server's icon in the left rail →
**Copy Server ID**.

## 8. Put the token and server ID in a file — not the terminal
Typing a token into the terminal is exactly how it ends up in shell history
or an accidental screenshot. Do this instead:

1. Copy `env.local.example` to `.env.local` (same folder, exactly that name,
   starting with a dot).
2. Open `.env.local` in Notepad (or any text editor), replace the two
   placeholder lines with your real token and server ID, save.
3. This file stays on your machine only — never commit it, never share it.

## 9. Run the script — preview first, then for real
In your own terminal, from this folder:

```
node discord-setup.mjs
```

This first run is a preview. It picks up the token and server ID from
`.env.local` automatically, reads your server, and prints every change a
real run would make — and changes nothing. Read it through (paste it to
Claude if you want it explained). When it looks right, make the changes:

```
node discord-setup.mjs --yes
```

That run changes your live server. It prints what it's doing as it goes,
and a summary at the end — created vs. already-existed vs. failed. It's
safe to run more than once: it won't
duplicate channels or roles, but it does re-apply permissions, topics, and
slow-mode every run — so if anything drifts from your `config.mjs` (a
permission changed by hand, a topic edited), running it again puts it back.

## 10. Before you clean up — take a snapshot
While the bot still has access, run `node discord-inspect.mjs` (same
`.env.local`, makes no changes) — it prints every role, channel, and
permission exactly as it actually is right now, plus the live rules-gate
text and onboarding setup. Paste that to Claude any time you want help
reading the server or deciding what to change, even after the bot's gone.

## 11. Clean up
Back in the Developer Portal → your application → **Bot** → **Delete App**
(or just kick the bot from the server: right-click its name in the member
list → Kick). It's done its one job. Also delete your local `.env.local`
file now that it's served its purpose — no reason to leave a live token
sitting on disk longer than needed.

## 12. What you'll still do by hand
The script builds structure, not every finishing touch:
- Assign yourself the Admin role (Server Settings → Members → find yourself
  → add role).
- If you want a proper "browse channels" resource screen (Discord calls this
  the Server Guide) — Server Settings → Community → Server Guide — that's a
  newer feature without a stable public API yet, so it's a manual add.
- Test the actual join flow before inviting anyone for real: open your
  invite link in an incognito/private browser window (logged out of
  Discord) and walk through it yourself.
