# Voice Typing × Claude

Hold a key, speak, let go — the text appears wherever your cursor already
was. Built for dictating prompts into the Claude Code CLI, where typing
out a long instruction is the slow part of the loop.

It runs entirely on your own PC. Nothing is uploaded, nothing is billed,
there's no account and no per-minute meter. The speech recognition is
OpenAI's **Whisper** (`large-v3-turbo`) running locally on your graphics
card, which is why it's both free and better than the dictation built into
Windows.

This folder is the **documentation shelf** for it — how to set it up on a
machine, how to use it well, and how to handle the one piece nobody can
ship you. **The working code is here too, in `voicetype/`.**

## The three pieces, and where each one lives

This is the part worth understanding before anything else, because it's
also the answer to "why is this folder so small if the tool is so big?"

| Piece | Size | Where it lives |
|---|---|---|
| **The code** — five small Python files | ~33 KB | `voicetype/`, right here |
| **The libraries** — Python, CUDA, audio | ~2.2 GB | A `.venv` built on your machine from `uv.lock` |
| **The Whisper model** — the AI itself | ~1.6 GB | A shared cache in your user folder, fetched on first run |

The model is the piece that could never travel in a folder, and the good
news is the tool was built so it doesn't have to. It downloads itself from
Hugging Face the first time you run it, into a machine-wide cache that
other AI tools share.

**`THE-MODEL.md` in this folder is the full explanation** — where it
actually sits on disk, how to pre-download it before you need it, how to
move it to a machine with no internet, and how to put it on a different
drive if your C: is tight. If you only read one file here beyond setup,
read that one.

## What it does

- **Push-to-talk:** hold Right Ctrl, speak, release. Text lands in
  whatever window has focus — terminal, browser, editor, anything.
- **Never presses Enter.** By design, not a setting. The text arrives in
  the prompt line and stops; you read it and send it yourself. It's
  dictating into an agent that edits files and runs commands, so a
  misheard sentence must never be able to submit itself.
- **Learns your vocabulary.** A plain text file of your own words and
  fixes — project names, jargon, the things it reliably mishears. This is
  the part that makes it beat `Win+H`.
- **Silent.** No beeps. A small aurora ring floats on the desktop and
  spins while it's listening and thinking, then settles when your text
  lands.
- **Logs everything locally** so you can recover a long dictation you
  lost before sending, and see what it actually mishears rather than
  guessing.

## What it doesn't do

- **Not voice commands.** It types what you say. It doesn't act on it.
- **Windows only.** The paste mechanism and the ring are Win32-specific.
- **Wants an Nvidia GPU.** It falls back to the processor and still
  works, but a few seconds becomes considerably longer.
- **One microphone** — whichever is your Windows default.

## What's inside

| File | What it's for |
|---|---|
| `START-HERE.md` | The prompt — paste it as your first message to Claude. |
| `voicetype/` | **The tool itself.** Five Python files, the lockfile, the icon, and `NOTES.md` — read that before changing any of the code. |
| `SETUP-VOICETYPE.md` | Getting it running from nothing: uv, the environment, first run, the desktop shortcut. |
| `THE-MODEL.md` | **The model question.** Where it lands on disk, pre-fetching, offline machines, moving the cache off C:. |
| `USING-IT.md` | Daily use — the hotkey, teaching it words, reading the log, the ring, tuning, what goes wrong. |
| `vocab/` | Three starter vocabulary files to copy and grow — see `vocab/README.md`. |

## Quick start

1. Read `THE-MODEL.md` first if you're setting this up somewhere with
   limited disk or no internet. Otherwise skip it for now.
2. Follow `SETUP-VOICETYPE.md`. First run downloads 1.6 GB, once.
3. Copy a starter file from `vocab/` into the code folder as `vocab.txt`
   and add your own words to it.
4. Keep `USING-IT.md` around for the first week — the vocabulary loop is
   the whole difference between "quite good" and "better than typing".

Or skip straight to `START-HERE.md` and hand the whole thing to Claude.

## If you want to change the code

Read `voicetype/NOTES.md` first. It documents four things in the code that
look like mistakes and are not — each one was a real bug, and each comes
back the moment someone tidies it. It also states the one rule the tool
must never break.
