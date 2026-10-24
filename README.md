# Signal Drift

A free browser puzzle about auditing a suspect evaluation set before you ship
it. Four hundred candidate rows carry a suspected contamination rate. Pick a
suspicion level, choose how deep to audit (trust the set, an entropy lens, or a
full sweep), pay to rewrite flagged rows, then settle on cost per clean point
shipped.

The numbers are the point: trusting the set ships the incident for free, the
cheap lens misses rows and flags clean ones, and the full sweep reads all 400
rows at $4 each and still misses about one row in ten. Rewrites bill $8 whether
the flagged row was actually bad.

Run it: open `index.html`. Everything is client side, no build step.

## The mechanics

- 3 suspicion levels (rumor 6%, benchmark chatter 11%, known leak 18%), each
  with its own incident exposure if the set ships dirty.
- 3 audit approaches with different per-row costs, recall, and false-positive
  rates. Seeded rolls keep a round reproducible when the same seed is used.
- Settlement totals audit cost plus rewrite cost plus incident exposure, then
  divides by clean points kept. Contaminated rows left in the set raise the
  cost per clean point and re-rate the model behind your back.

## Why

Eval sets quietly absorb benchmark leakage and label rot. The interesting
question is not "is the set dirty" but "what is it worth to find out before
shipping." This puzzle prices that decision.

## Background

- [Data leakage (machine learning)](https://en.wikipedia.org/wiki/Data_leakage)
- [Goodhart's law](https://en.wikipedia.org/wiki/Goodhart%27s_law)

More mislabel-audit arithmetic and eval teardowns live on
[pastagi.com](https://pastagi.com/).

## License

MIT
