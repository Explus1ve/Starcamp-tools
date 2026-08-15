# Using it — the reference

Daily use, once it's set up. Read `SETUP-VOICETYPE.md` first if it isn't
running yet.

## The basic loop

Hold **Right Ctrl** → speak → release → the text appears at your cursor.

That's the whole interface. It listens globally, so it works in any
window: a terminal, a browser, an editor, a chat box. Right Ctrl also
still works as a normal modifier key — the tool watches it, it doesn't
take it over.

**It never presses Enter.** Not configurable, and that's the point: it's
dictating into an agent that edits files and runs commands, so the
decision to actually send something stays a human one. Read it, then send
it.

## What the ring is telling you

A small aurora ring floats on the desktop. It's the entire feedback
system, because the tool makes no sound at all — no beeps, no chimes,
nothing to be embarrassing on a call.

| Ring | Meaning |
|---|---|
| Spinning while you hold the key | Listening |
| Still spinning after you release | Whisper is working |
| Settled | Done — your text has landed |

Drag it anywhere; it remembers where you left it. Clicking it never steals
focus from whatever you were typing into. If you want the default corner
back, delete `overlay-position.json` from the project folder.

If the ring isn't on screen at all, the tool isn't running. That's its
second job.

## Teaching it your words — the part that matters

Out of the box it's excellent at English and hopeless at your project
names. Fixing that takes a minute a week and is the difference between
"quite good" and "faster than typing".

Edit **`vocab.txt`** in the project folder. Two kinds of line:

```
Supabase                 # a bias term — helps it hear the word correctly
sue pa base -> Supabase  # a correction — fixes the transcript afterwards
```

**Use both, for the same word.** They work at different moments and each
catches what the other misses: the bias term nudges Whisper while it's
listening, the correction cleans up the text after the fact. Corrections
are case-insensitive. Blank lines and anything after a `#` are ignored.

**Restart the tool after editing** — the file is read at startup only.

Three starter files live in this folder's `vocab/`. See `vocab/README.md`.

### Don't guess at what to add

The temptation is to sit and imagine what it might get wrong. Don't — you
have the actual data. `history.jsonl` in the project folder logs every
utterance with the raw transcript next to the corrected one:

```bash
Get-Content history.jsonl | ConvertFrom-Json | Select-Object -Last 20 raw, final
```

Read the last twenty, find the words it keeps mangling, add those. Repeat
occasionally. That's the entire maintenance ritual.

**One trap worth knowing:** if a shorter correction rule is contained
inside a longer one, ordering can bite. The tool handles this properly in
one pass rather than repeated passes — but when you add a new rule that
overlaps an existing one, test a sentence containing both before trusting
it.

## The history log

`history.jsonl` is a rolling window of the **last 500 dictations** —
newest at the bottom, oldest dropped off the top. It settles at roughly
400 KB and never grows past it, however long you use the tool. It's local,
and it's gitignored.

Its most valuable use isn't vocabulary tuning — it's **recovering a long
dictation you lost before sending.** If you dictate three paragraphs into
a prompt and then close the window by accident, it's in there.

## Tuning

Set as environment variables, or edited at the top of the project's files:

| What | Where | Notes |
|---|---|---|
| Which AI model | `VOICETYPE_MODEL` env var | See `THE-MODEL.md` for the options |
| The hotkey | constants at the top of `voicetype.py` | |
| Minimum utterance length | same | Default ~0.35 s; raise it if stray taps trigger it |
| Clipboard restore delay | same (`PASTE_RESTORE`) | Raise it if a paste ever comes out truncated |
| Ring size, glow, spin rate | top of `overlay.py` | |

## Known limits

- **Clipboard:** the tool pastes, so it borrows your clipboard and puts it
  back. Text is restored. **If you had an image copied, it's lost** — it
  can only restore text.
- **Under ~0.35 s is ignored** as a stray keypress.
- **One microphone** — the Windows default. Change it in Windows sound
  settings, not in the tool.
- **Windows only.**

## What goes wrong

**Nothing appears at the cursor.** Look at the terminal window — it prints
every result. If it shows text there but nothing landed, the target window
didn't accept the paste; click properly into the text field and retry. If
it shows nothing, nothing was heard: check the ring actually spun, and
that your default microphone is the one you're talking into.

**It's slow — many seconds per sentence.** It's running on the processor
rather than the graphics card. The tool tests CUDA at startup and falls
back deliberately rather than crashing, so this is working-but-slow, not
broken. It's the graphics driver or CUDA libraries. `THE-MODEL.md` covers
it, and a smaller model is the quick workaround.

**It mishears one word constantly.** That's `vocab.txt`, and it's the
expected way to use the tool rather than a fault. Add both a bias term and
a correction.

**The ring vanished but the tool is running.** Delete
`overlay-position.json` and restart — it may have been dragged to a screen
that's no longer connected.

**A paste comes out truncated.** Raise `PASTE_RESTORE` in `voicetype.py`;
the clipboard was restored before the target window finished reading it.

## Deliberately not built

Worth knowing so nobody re-litigates it:

- **A cleanup pass** — routing the transcript through a local model to
  punctuate and de-ramble it — is the one genuinely appealing addition,
  on a second hotkey.
- **Run at login** is minor; the ring already answers "is it running?"
- **Voice commands are a different product.** Resist. This types what you
  say; it doesn't act on it, and that boundary is what makes it safe to
  point at an agent that runs commands.
