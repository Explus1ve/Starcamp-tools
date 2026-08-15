# Start here

Copy everything in the box below and paste it as your first message to
Claude (Claude Code, or any Claude that can read files and run terminal
commands in this folder). It's written so Claude has enough context to run
the whole thing well, including the two decisions — which model, what
scale — that actually determine whether the result looks good.

---

> I want to upscale some images — [describe what they are: old family
> photos, product shots, a logo, anime screenshots, game textures — and
> what you want out of them: printing, a website, just seeing them
> bigger]. I'm not very technical, so please explain things in plain
> English and go step by step — don't assume I know what a "model" or a
> "command line" means unless you've just told me.
>
> There's a guide in this folder for Real-ESRGAN, a free local AI
> upscaler: `README.md`, a setup walkthrough (`SETUP-UPSCALER.md`), a
> reference for using it (`USING-IT.md`), and three ready-made presets in
> `presets/`. The tool itself isn't here — it downloads from the link in
> the README. Here's what I'd like you to do:
>
> 1. Read `README.md` and `presets/README.md` so you understand what's
>    here before we start.
> 2. Walk me through `SETUP-UPSCALER.md` step by step — tell me exactly
>    where to click and what to unzip where, and warn me about the
>    Windows security popup before I hit it rather than after.
> 3. Ask me to describe or show you a sample of what I'm upscaling before
>    picking anything. The photo model and the anime model produce very
>    different results on the same image, and it's not a preference —
>    it's a right and wrong answer per image type.
> 4. Help me pick the closest preset from `presets/`, then fill in the
>    paths at the top of it with me. Don't guess at my folder paths — ask.
> 5. Run one test image first and have me look at it at 100% zoom before
>    we commit to a whole batch. If it looks wrong, help me work out
>    whether it's the model, the scale, or the source image itself.
> 6. If it fails with an out-of-memory error or produces a black image,
>    check `USING-IT.md` — the tile-size fix is in there — rather than
>    assuming my PC can't do it.
>
> Take this slowly, one step at a time, and tell me roughly how long a
> batch will take before we start one, so I'm not sitting there wondering
> if it's frozen.

---

That's it. Everything else — the actual downloading, the actual choosing —
happens in the conversation that follows.
