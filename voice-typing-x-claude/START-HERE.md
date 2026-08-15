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
> Everything is in this folder: the tool's code in `voicetype/`, a
> `README.md`, a setup walkthrough (`SETUP-VOICETYPE.md`), a page about the
> AI model (`THE-MODEL.md`), a usage reference (`USING-IT.md`), and three
> starter vocabulary files in `vocab/`. Nothing has to be downloaded from
> anywhere except the libraries and the model, and both fetch themselves.
> Here's what I'd like you to do:
>
> 1. Read `README.md` and `THE-MODEL.md` before we start. The model is a
>    1.6 GB download that cannot ship in a folder, and I'd rather
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
> 5. Once it works, help me create my `vocab.txt` from one of the starter
>    files in `vocab/` — there isn't one yet, I make it. Ask me what words
>    I actually say a lot — my projects, clients, place names, the jargon
>    in my field — rather than guessing. Remind me the tool has to be
>    restarted after every edit to that file.
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

## If you're changing the tool, not just running it

Different job, and it starts at `voicetype/NOTES.md`. It documents four
things in the code that look wrong and are deliberate — each was a real
bug, and each comes back the moment someone tidies it. It also states the
one rule the tool must never break. Read it before touching
`voicetype.py`, `overlay.py`, or `aurora.py`.

Point your assistant at that file first:

> Before we change anything, read `voicetype/NOTES.md`. It lists four
> things in this code that look like mistakes and are not. Tell me which
> of them my change would touch before you write any of it.
