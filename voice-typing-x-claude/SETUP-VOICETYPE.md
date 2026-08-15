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

## 2. Put the code where you want to keep it

Nothing to download — the tool is in the `voicetype/` folder right here.
Five Python files, a lockfile and an icon.

Copy that folder somewhere you'll keep it long term, because this is what
you'll run every day and it will grow your own `vocab.txt` alongside it:

```bash
Copy-Item -Recurse voicetype C:\Tools\voicetype
```

Anywhere is fine. Avoid a folder that syncs to the cloud — the environment
you're about to build in step 3 is 2.2 GB of machine-specific binaries and
you do not want that uploading anywhere.

You can also just run it in place if you're only trying it out.

## 3. Let it build its environment

```bash
cd C:\Tools\voicetype
uv sync
```

This reads `uv.lock` and installs the exact library versions the tool was
built against — including the CUDA pieces that let it use your graphics
card. **It's about 2.2 GB and takes a few minutes.** It creates a `.venv`
folder inside the project. That folder is machine-specific, which is why it
is built here rather than shipped with the code.

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
followed by the path to `voicetype.py`. The code folder includes an icon
(`voicetype.ico`) you can set on the shortcut's properties, and
`make_icon.py` regenerates it if you want a different one — edit the
script, not the icon.

Ask Claude to do this bit with you if shortcut targets aren't your idea of
fun — it's fiddly to describe and trivial to do.

## 8. Teach it your words

Out of the box it's good at English and bad at your project names.

**There is no `vocab.txt` yet — you make one.** Copy a starter file from
this folder's `vocab/` into your code folder, named exactly `vocab.txt`:

```bash
Copy-Item vocab\starter-claude-code.txt C:\Tools\voicetype\vocab.txt
```

Then add your own lines as you go. This is the step that makes it genuinely
better than Windows' built-in dictation, and it takes about a minute a
week. See `vocab/README.md` and the vocabulary section of `USING-IT.md`.

**The file is read at startup only** — restart the tool after editing it.

## What you'll still do by hand

- Set your default microphone, if it isn't already the one you want.
- Restart the tool after every `vocab.txt` edit.
- Start it after a reboot. There's no run-at-login setup; the ring on the
  desktop is how you know it's running.
