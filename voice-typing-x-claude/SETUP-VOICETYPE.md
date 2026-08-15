# Setting it up — step by step

Getting voicetype running on a Windows machine from nothing. About twenty
minutes, most of it waiting on two downloads.

**What you'll need:** Windows, an Nvidia graphics card (it works without
one, just slower), and about **4 GB of free disk space** — 2.2 GB of
libraries and 1.6 GB for the AI model.

**Before you start,** read the first half of `THE-MODEL.md` if your C:
drive is tight or the machine has no internet. Both are easy to handle,
but much easier *before* you start than halfway through.

## 1. Install uv

`uv` is the tool that handles Python and all the libraries for you — you
don't need Python installed first, it brings its own. In PowerShell:

```bash
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

**Close that terminal and open a new one** when it finishes, or the next
step won't find it. Check it worked:

```bash
uv --version
```

## 2. Get the code

```bash
git clone https://github.com/Explus1ve/voice-typing.git D:\Projects\voice-typing
```

If the repo is private, you'll need to be signed in to GitHub as the owner
— either through the GitHub CLI (`gh auth login`) or Git Credential
Manager, which prompts you in a browser the first time.

## 3. Let it build its environment

```bash
cd D:\Projects\voice-typing
uv sync
```

This reads `uv.lock` and installs the exact library versions the tool was
built against — including the CUDA pieces that let it use your graphics
card. **It's about 2.2 GB and takes a few minutes.** It creates a `.venv`
folder inside the project; that folder is machine-specific and isn't in
git, which is why this step exists at all.

## 4. First run — this is where the model downloads

```bash
uv run voicetype.py
```

The first run fetches the Whisper model, **about 1.6 GB, once**. It goes
into a shared cache in your user folder, not into the project — see
`THE-MODEL.md` for exactly where and why.

While it's loading you'll see it name the model and the device it's using.
When it's ready it says so and starts listening.

**Leave this window open.** It's the program. Closing it stops the tool.
`Ctrl+C` in that window is the clean way to quit.

## 5. Allow the microphone

Windows may pop up a microphone permission request the first time. Allow
it. If you miss it: Settings → Privacy & security → Microphone → make sure
desktop apps are allowed.

The tool uses your **Windows default input device**. If you have several
microphones, set the right one as default in Windows sound settings —
there's no device picker in the tool.

## 6. Test it

Click into any text box — Notepad is fine for a first try. Hold **Right
Ctrl**, say a full sentence, release.

A small glowing ring appears on the desktop and spins while you hold the
key and while it's thinking. A second or two after you let go, your words
appear at the cursor.

Three things to know from the very first test:

- **It will never press Enter.** That's deliberate and permanent. Read
  what arrived, then send it yourself.
- **Very short taps are ignored** — under about a third of a second is
  treated as a stray keypress, not speech. Say a whole sentence.
- **The terminal window prints every result** with timings. If nothing
  appeared at your cursor, look there first — it usually explains why.

## 7. Make it easy to launch

You'll want this without typing commands. Right-click your desktop → New →
Shortcut, and point it at the `pythonw.exe` inside the project's `.venv`
followed by the path to `voicetype.py`. The repo includes an icon
(`voicetype.ico`) you can set on the shortcut's properties.

Ask Claude to do this bit with you if shortcut targets aren't your idea of
fun — it's fiddly to describe and trivial to do.

## 8. Teach it your words

Out of the box it's good at English and bad at your project names. Copy a
starter file from this folder's `vocab/` over the tool's `vocab.txt`, then
add your own lines as you go. This is the step that makes it genuinely
better than Windows' built-in dictation, and it takes about a minute a
week. See `vocab/README.md` and the vocabulary section of `USING-IT.md`.

**The file is read at startup only** — restart the tool after editing it.

## What you'll still do by hand

- Set your default microphone, if it isn't already the one you want.
- Restart the tool after every `vocab.txt` edit.
- Start it after a reboot. There's no run-at-login setup; the ring on the
  desktop is how you know it's running.
