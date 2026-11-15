# Voice Typing × Claude

Hold a key, speak, let go, and the text appears wherever your cursor already was. Made for talking prompts into Claude Code, where typing out a long instruction is the slow part.

It runs on your own PC and stays there. No account, no bill, no per-minute meter. The speech recognition is **Whisper** (`large-v3-turbo`), OpenAI's free speech-to-text model, running on your own graphics card. That is why it costs nothing and why it hears you better than the dictation built into Windows.

The working code is here, in `voicetype/`, along with everything you need to set it up, use it well, and handle the one piece that downloads separately: the model.

## The three pieces, and where each one lives

Worth understanding first, because it also answers "why is this folder so small when the tool is so big?"

| Piece | Size | Where it lives |
|---|---|---|
| **The code**: five small Python files | about 35 KB | `voicetype/`, right here |
| **The libraries**: Python, the graphics-card drivers it needs, audio | about 2.2 GB | A folder called `.venv`, built on your computer from the list in `uv.lock` |
| **The Whisper model**: the AI itself | about 1.6 GB | A shared folder on your computer, downloaded once, by you |

The model is the piece too big to travel in a folder. You fetch it once with a single command, and from then on the tool loads it from your disk and never goes online.

**`THE-MODEL.md` is the full story**: where the model sits on disk, how to download it, how to carry it to a computer with no internet, and how to keep it on a different drive if C: is tight.

## What it does

- **Push to talk.** Hold Right Ctrl, speak, release. The text lands in whatever window you are in: a terminal, a browser, an editor, anything.
- **You press Enter.** The text arrives in the prompt line and waits. You read it and send it yourself. It is talking into an assistant that edits files and runs commands, so sending always stays your decision. This is how it is built, on purpose.
- **Learns your words.** A plain text file of your own words and fixes: project names, jargon, the things it keeps mishearing. This is what makes it better than Windows' own dictation.
- **Quiet.** A small aurora ring floats on the desktop. It spins while it listens and thinks, then settles when your text lands.
- **Keeps a local log** of your last 500 dictations, so you can recover a long one you lost before sending, and see what it really mishears.
- **Drops phantom lines.** In near silence, Whisper can "hear" a subtitle credit. The tool spots those and leaves them out.
- **Stays offline.** After the one-time model download, it loads everything from your disk.

## Good to know before you start

- **It types what you say.** It is dictation, so your words go in as text.
- **It runs on Windows.**
- **It is fastest on an Nvidia graphics card.** On any other PC it runs on the processor, which works and takes longer per sentence.
- **It listens to one microphone**: whichever is your Windows default.

## What's inside

| File | What it's for |
|---|---|
| `START-HERE.md` | The message to paste as your first one to Claude. |
| `voicetype/` | **The tool itself.** Five Python files, the list of exact library versions (`uv.lock`), the icon, and `NOTES.md`, which you read before changing any code. |
| `SETUP-VOICETYPE.md` | Getting it running from nothing: uv (the free tool that installs Python and the libraries for you), the model download, the first run, a desktop shortcut. |
| `THE-MODEL.md` | **The model.** Downloading it, where it lands, computers with no internet, keeping it off C:. |
| `USING-IT.md` | Daily use: the hotkey, teaching it words, reading the log, the ring, tuning, fixes. |
| `vocab/` | Three starter word lists to copy and grow. See `vocab/README.md`. |

## Quick start

1. Read `THE-MODEL.md` first if disk space is tight or the computer has no internet.
2. Follow `SETUP-VOICETYPE.md`. The two big downloads, 2.2 GB of libraries and the 1.6 GB model, happen once.
3. Copy a starter list from `vocab/` into the code folder as `vocab.txt` and add your own words.
4. Keep `USING-IT.md` close for the first week. The word list is what takes it from quite good to faster than typing.

Or start with `START-HERE.md` and hand the whole thing to Claude.

## If you want to change the code

Read `voicetype/NOTES.md` first. It explains four things in the code that look like mistakes and are deliberate. Each one fixed a real bug, and each bug comes back the moment someone tidies it away. It also states the one rule the tool keeps: it never presses Enter.
