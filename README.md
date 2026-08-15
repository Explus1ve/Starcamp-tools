# Tools × Claude

A small shelf of tools for jobs that should be simple and are not.

Each one is built to be run by someone who is not a developer, working alongside an AI assistant. You do the deciding and the clicking. The assistant does the reading and the running. No subscriptions, no dashboards, no accounts, nothing phoning home.

## What is here

| Tool | What it does |
|---|---|
| [discord-tool-x-claude](discord-tool-x-claude/) | Stands up a complete Discord community server in one run — roles, categories, channels, permissions, moderation, a rules gate and onboarding. Run it again any time and it repairs what has drifted instead of duplicating it. |
| [upscale-tool-x-claude](upscale-tool-x-claude/) | Enlarges images without them going soft or blocky — old photos, small logos, low-res screenshots, artwork. Runs entirely on your own machine, offline, no watermark, no credit counter. |
| [voice-typing-x-claude](voice-typing-x-claude/) | Hold a key, speak, let go, and the text appears where your cursor already was. Local speech recognition on your own graphics card. Nothing uploaded, nothing billed. |

## How to start

Open the folder of the tool you want and read `START-HERE.md`. It contains a block of text to copy and paste as your first message to Claude, written so the assistant has everything it needs to guide you properly — including the habits that matter when a password is involved.

That is the whole onboarding. Everything else happens in the conversation that follows.

## The shape every tool follows

- **`START-HERE.md`** — what to say to begin.
- **`README.md`** — what the tool is and what it does, in plain English.
- **A setup guide** — every step, including where to click.
- **`USING-IT.md`** — the part people get wrong, and how to get it right.

If a tool cannot be used this way, it does not belong here.

## A word on safety

Some of these talk to services on your behalf and need a token to do it. **A token is a password.** It belongs in a local file that is never committed, never pasted into a chat window, and never caught in a screenshot. If one ever does get exposed, reset it before doing anything else. Each tool repeats this where it matters, because it matters.

Anything that changes something live asks you first.

## License

MIT unless a tool says otherwise in its own folder. Take them, change them, use them for your own thing.

---

Built and used in the making of [Starcamp](https://starcamp.ai).
