# Start here

Copy everything in the box below and paste it as your first message to
Claude (Claude Code, or any Claude that can read files and run terminal
commands in this folder). It's written so Claude has enough context to run
the whole thing well, including the token-safety habits that matter most
when a bot's password is involved.

---

> I want to set up a Discord server for [describe your project or community
> in a sentence or two]. Please explain things in plain English and go
> step by step — don't assume I know what a "bot token" or "API" means
> unless you've just told me.
>
> There's a toolkit in this folder already worked out: an engine script
> (`discord-setup.mjs`) plus a read-only inspector (`discord-inspect.mjs`),
> and three starter templates in `templates/`. Here's what I'd like you to
> do:
>
> 1. Read `README.md` and `templates/README.md` so you understand what's
>    here before we start.
> 2. Help me pick the template that's the closest starting point for what
>    I'm building, then walk me through customizing it — role names,
>    channel names, topics, the rules text, the one onboarding question.
>    Ask me what I want rather than guessing at anything people will
>    actually read.
> 3. Walk me through `SETUP-BOT.md` step by step to create the Discord bot
>    and get it invited — tell me exactly where to click, I'll tell you
>    when I'm stuck.
> 4. Before I create the bot: remind me clearly that the token is a
>    password, it goes in a local file, never in our chat. If I ever paste
>    one into our conversation by accident anyway, stop me immediately and
>    have me reset it before we do anything else.
> 5. Have me run the setup script without `--yes` first. That is a
>    preview: it changes nothing and prints what it would do. Go through
>    that plan with me in plain words, and only once I say it looks right,
>    have me run it again with `--yes`. Then help me read the output and
>    fix anything that failed.
> 6. Before I delete the setup bot, remind me to run `discord-inspect.mjs`
>    for a full read-only snapshot — then walk me through deleting the bot
>    and the local token file.
>
> Take this slowly, one step at a time, and check in with me before
> anything that changes my live server in a way I'd actually notice.

---

That's it. Everything else — the actual clicking, the actual customizing —
happens in the conversation that follows.
