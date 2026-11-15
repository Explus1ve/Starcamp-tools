# The model — the one piece that isn't in this folder

The AI that turns your voice into text is a 1.6 GB file. It cannot travel
in a folder or live in git, and this page is the whole story of how that's
handled.

**The short version: you download it once, by hand, with one command, and
from then on the tool loads it from your disk and never goes online.**
Nothing was bodged around, nothing is missing. If you start the tool before
the model is there, it stops and prints the exact command to run. The
command is under "Downloading it" below. Everything after that is for the
cases that need a little more: a machine with no internet, a full C: drive,
or a different model.

## Why it can't be in git

Three separate reasons, any one of which would be enough:

1. **Size.** GitHub warns above 50 MB and refuses above 100 MB per file.
   The model is 1.6 GB — about sixteen times over the hard limit.
2. **Git stores every version forever.** Even if it fit, git keeps the
   full history of a file. Swapping the model once would put 3.2 GB in
   the repo permanently, and it would stay there after deletion, in every
   clone anyone ever makes.
3. **It isn't ours.** It's a published model with its own licence, its own
   home, and its own versioning. Vendoring someone else's 1.6 GB artefact
   into your repo means maintaining a stale copy of it by hand.

This is the standard rule, not a quirk of this project: **git is for
things you wrote; large binary artefacts get fetched, not committed.**

## Where it actually is

Not in the project folder. It lives in a shared, machine-wide cache that
every Hugging Face-based tool on your PC uses:

```
C:\Users\<you>\.cache\huggingface\hub\
```

specifically, in this project's case:

```
models--mobiuslabsgmbh--faster-whisper-large-v3-turbo\
```

The name `large-v3-turbo` that appears in the code is a shorthand;
`faster-whisper` resolves it to that published repository.

Two things follow from it being shared rather than per-project:

- **Deleting the project folder doesn't delete the model**, and won't
  reclaim the 1.6 GB. To actually remove it, delete that
  `models--mobiuslabsgmbh--...` folder.
- **Cloning the project again doesn't re-download it.** The second clone
  finds it already cached and starts instantly.

Inside the cache, files under `snapshots\` are links pointing into
`blobs\`, where the real data sits. That's normal, and it's the reason
copying the cache folder by hand to another machine sometimes arrives as a
folder of tiny broken files. If you need it on another machine, use the
proper export below rather than dragging the cache across.

## Downloading it — once, before the first run

The tool never downloads anything itself, so this step is yours, and it
is required. Do it once, after `uv sync` has built the environment. From
the `voicetype` folder:

```bash
uv run python -c "from faster_whisper.utils import download_model; print(download_model('large-v3-turbo'))"
```

This is the same command the tool prints if you start it without the
model. It fetches about 1.6 GB into the shared cache above, prints a
progress bar, and takes a few minutes on a normal connection. When it
finishes it prints the folder the model landed in. It is safe to
interrupt and re-run: it resumes rather than starting over.

This is the only step that goes online. Run it again only when you
want a newer copy of the model.

## Putting the cache on a different drive

The default location is on C:, which is often the smallest drive. To move
it, set one environment variable — this affects every Hugging Face tool on
the machine, not just this one, which is usually what you want:

```bash
setx HF_HOME "D:\ai-models\huggingface"
```

Close and reopen your terminal afterwards for it to take effect. Anything
already downloaded stays where it was; move the old `hub` folder into the
new location if you want it found rather than re-fetched.

## Getting it onto a machine with no internet

Don't copy the cache folder — copy a proper export. On a machine that
does have internet:

```bash
uv run hf download mobiuslabsgmbh/faster-whisper-large-v3-turbo --local-dir D:\whisper-turbo
```

`--local-dir` writes real files rather than the linked cache layout, so
the folder survives being put on a USB stick. It's about 1.6 GB.

On the offline machine, copy that folder somewhere permanent and point the
tool at it by path instead of by name:

```bash
setx VOICETYPE_MODEL "D:\whisper-turbo"
```

When that variable holds a folder, the tool loads the model straight from
it and skips the cache entirely. Reopen your terminal and start the tool.
It makes no network call here either; it never makes one anywhere.

## Choosing a different model

Same variable, a name instead of a path:

| Value | Size | Trade-off |
|---|---|---|
| `large-v3-turbo` | ~1.6 GB | The default. Best accuracy for the speed. |
| `distil-large-v3` | ~1.5 GB | Noticeably faster, slightly worse. |
| `small` | ~0.5 GB | For a weak or missing GPU. Accuracy drops enough to notice on names and jargon. |
| `tiny` | ~0.08 GB | Testing that the plumbing works. Not for real use. |

```bash
setx VOICETYPE_MODEL "small"
```

Each new name is its own download, done by hand like the first one: run
the command from "Downloading it" with the new name in place of
`large-v3-turbo`. They don't replace each other, so trying three leaves
three in the cache.

## When something's wrong with the model

**"It stops at start and says the model is not on disk, but I already
downloaded it."** Either `HF_HOME` moved after the download, or you
changed `VOICETYPE_MODEL` to a model you haven't fetched yet. Check that
variable first. The message prints the exact download command for the
name it was looking for.

**The download command sits silent for a while.** Some connections take
a minute before the progress bar appears. Give it a few minutes before
assuming it's stuck.

**It loads but runs on the processor instead of the GPU.** The tool tries
CUDA, proves it with a real transcription, and drops to CPU rather than
crashing if that fails — so this is a working fallback, not a broken
install. It's the graphics driver or the CUDA libraries, not the model.
Everything still works, just slower.

**The download failed halfway.** Re-run it; it resumes. If it's genuinely
corrupt, delete the `models--mobiuslabsgmbh--faster-whisper-large-v3-turbo`
folder from the cache and run the download command again to start clean.

## The rule to carry to other projects

Whenever a tool needs a large artefact — an AI model, a dataset, a big
binary — the pattern is the same three parts:

1. **The repo holds the code and a lockfile**, nothing heavy.
2. **The artefact is fetched by name from where it's published**, once,
   by hand, into a shared cache outside the project. The tool itself only
   reads it from disk, so it never goes online and never changes under
   you without your say.
3. **A single environment variable can override it**, so an offline
   machine, a different drive, or a different version needs no code change.

Voicetype follows all three. It's a good shape to copy.
