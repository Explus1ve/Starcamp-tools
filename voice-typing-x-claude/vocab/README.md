# Picking a starter vocabulary

Each file here is a working `vocab.txt` — the file that teaches the tool
your words. Copy whichever fits closest over the project's `vocab.txt`,
then grow it from there.

| File | Covers | Best for |
|---|---|---|
| `starter-claude-code.txt` | Claude Code, terminal, git and agent vocabulary | Dictating prompts into the CLI. The default starting point. |
| `starter-web-dev.txt` | Frameworks, hosts, databases, web jargon | Anyone whose sentences are full of stack names. Stack it on top of the one above. |
| `starter-blank.txt` | Nothing — just the format, explained, with empty sections | Building your own from scratch, or a domain that isn't software at all. |

## How to use one

1. Copy the file into the project folder as `vocab.txt`, replacing what's
   there. **Look at the existing one first** — if it's been in use, it has
   real corrections in it worth keeping. Merge rather than overwrite.
2. **Restart the tool.** The file is read at startup only.
3. Add lines as you go. That's the actual workflow — the starter just
   means you begin at "quite good" rather than "hopeless at proper nouns".

## The two kinds of line

```
Supabase                 # a bias term — helps it hear the word correctly
sue pa base -> Supabase  # a correction — fixes the transcript afterwards
```

**Add both for anything important.** The bias term works while Whisper is
listening; the correction cleans up afterwards. Each catches what the
other misses, which is why both layers exist.

Corrections are case-insensitive. Blank lines and anything after a `#` are
ignored.

## Growing your own — don't guess

The starters cover generic vocabulary. Your own names, clients, and
projects are the ones that will actually break, and you already have the
data on which:

```bash
Get-Content history.jsonl | ConvertFrom-Json | Select-Object -Last 20 raw, final
```

`raw` is what Whisper heard, `final` is what you got. Where they should
differ and don't, you've found your next line. Do this after a week of
real use and you'll add more value in five minutes than any starter file
can.

**A note if you're merging two of these files:** when a shorter rule sits
inside a longer one (`agent` inside `agent skill`), test a sentence
containing both before trusting it. The tool applies corrections in a
single pass specifically to make this safe, but it's still worth a check
when you add overlapping rules.
