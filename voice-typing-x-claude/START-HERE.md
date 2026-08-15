# Start here

Copy everything in the box below and paste it as your first message to
Claude (Claude Code, or any Claude that can read files and run terminal
commands). It's written so Claude has enough context to run the whole
thing well — including the 1.6 GB model download, which is the step where
an unprepared setup goes wrong.

---

> I want to set up voicetype — the push-to-talk dictation tool that types
> what I say into whatever window I'm in, built for dictating prompts into
> the Claude Code CLI. [Say whether this is a fresh machine, or you've
> used it before and something's broken.] I'm not very technical, so
> please explain things in plain English and go step by step.
>
> There's a documentation folder here: `README.md`, a setup walkthrough
> (`SETUP-VOICETYPE.md`), a page about the AI model (`THE-MODEL.md`), a
> usage reference (`USING-IT.md`), and three starter vocabulary files in
> `vocab/`. The tool's own code isn't here — it lives in its own repo,
> linked from the README. Here's what I'd like you to do:
>
> 1. Read `README.md` and `THE-MODEL.md` before we start. The model is a
>    1.6 GB download that is deliberately not in the repo, and I'd rather
>    understand that upfront than hit it as a surprise.
> 2. **Check my disk space before anything else** — this needs about 4 GB
>    across two locations, and the model goes to my C: drive by default
>    even if the project is on another drive. If C: is tight, tell me
>    before I start downloading, and walk me through moving the cache.
> 3. Walk me through `SETUP-VOICETYPE.md` step by step. Tell me when a
>    step is going to take several minutes so I don't think it's frozen.
> 4. When we get to the first run, tell me what "normal" looks like —
>    what it prints, how long the model download takes, and how I know
>    it's actually listening rather than stuck.
> 5. Once it works, help me set up `vocab.txt` from `vocab/`. Ask me what
>    words I actually say a lot — my projects, clients, place names, the
>    jargon in my field — rather than guessing. Remind me the tool has to
>    be restarted after every edit to that file.
> 6. After I've used it for a bit, help me read `history.jsonl` to find
>    what it's really mishearing, and turn that into new vocab lines.
>
> Two things to know so you don't try to "fix" them: the tool never
> presses Enter, on purpose — that's a safety rule, not a missing feature.
> And if it falls back to running on my processor instead of my graphics
> card, that's a deliberate fallback, so tell me it's working-but-slow
> rather than broken.
>
> Take it one step at a time and check in with me before anything that
> downloads gigabytes.

---

That's it. Everything else happens in the conversation that follows.

## If you're the one editing the tool, not just running it

Different job, and this folder isn't the right starting point — the repo's
own `CLAUDE.md` is. It documents four things in the code that look wrong
and are deliberate, each of which was a real bug that gets reintroduced
the moment someone "tidies" it. Read that before changing anything in
`voicetype.py`, `overlay.py`, or `aurora.py`.
