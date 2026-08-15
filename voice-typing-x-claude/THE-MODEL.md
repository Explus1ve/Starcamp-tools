# The model — the one piece that isn't in this folder

The AI that turns your voice into text is a 1.6 GB file. It cannot travel
in a folder or live in git, and this page is the whole story of how that's
handled.

**The short version: it's already solved, and you don't have to do
anything.** The tool downloads the model itself on first run. Nothing was
bodged around, nothing is missing. Everything below is for
the cases where the automatic behaviour isn't what you want — a machine
with no internet, a full C: drive, or a slow connection you'd rather not
wait on at the worst moment.

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

Two things follow from it being *shared* rather than per-project:

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

## Pre-downloading it, on purpose

Useful when you'd rather do the 1.6 GB now, on a good connection, than
discover it mid-setup. From the project folder:

```bash
uv run python -c "from faster_whisper import WhisperModel; WhisperModel('large-v3-turbo', device='cpu')"
```

That fetches and caches the model without starting the tool. It prints a
progress bar, takes a few minutes on a normal connection, and is safe to
interrupt and re-run — it resumes rather than starting over.

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
*does* have internet:

```bash
uv run huggingface-cli download mobiuslabsgmbh/faster-whisper-large-v3-turbo --local-dir D:\whisper-turbo
```

`--local-dir` writes real files rather than the linked cache layout, so
the folder survives being put on a USB stick. It's about 1.6 GB.

On the offline machine, copy that folder somewhere permanent and point the
tool at it by path instead of by name:

```bash
setx VOICETYPE_MODEL "D:\whisper-turbo"
```

The tool passes whatever's in that variable straight through, so a folder
path works exactly where a model name would. Reopen your terminal, start
the tool, and it loads from disk with no network call at all.

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

Each new name downloads its own copy on first use — they don't replace
each other, so trying three leaves three in the cache.

## When something's wrong with the model

**"It's downloading again and I already have it."** Either `HF_HOME` moved
after the first download, or you changed `VOICETYPE_MODEL` and are
fetching a different model. Check that variable first.

**It hangs at "loading" on first run.** That's the download, and it's
silent for a while before the progress bar appears on some connections.
Give it a few minutes before assuming it's stuck.

**It loads but runs on the processor instead of the GPU.** The tool tries
CUDA, proves it with a real transcription, and drops to CPU rather than
crashing if that fails — so this is a working fallback, not a broken
install. It's the graphics driver or the CUDA libraries, not the model.
Everything still works, just slower.

**The download failed halfway.** Re-run it; it resumes. If it's genuinely
corrupt, delete the `models--mobiuslabsgmbh--faster-whisper-large-v3-turbo`
folder from the cache and let it start clean.

## The rule to carry to other projects

Whenever a tool needs a large artefact — an AI model, a dataset, a big
binary — the pattern is the same three parts:

1. **The repo holds the code and a lockfile**, nothing heavy.
2. **The artefact is fetched by name from where it's published**, at
   first run, into a shared cache outside the project.
3. **A single environment variable can override it**, so an offline
   machine, a different drive, or a different version needs no code change.

Voicetype already follows all three. It's a good shape to copy.
