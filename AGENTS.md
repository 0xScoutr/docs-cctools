# Documentation project instructions

## About this project

- This is the public documentation for CCTools (cctools.network), a discovery, portfolio, and analytics platform for the Canton Network ecosystem
- Pages are MDX files with YAML frontmatter; four locales: English at the root, plus `pt/`, `es/`, `zh/` mirrors
- Configuration lives in `docs.json`
- Run `mint dev` to preview locally
- Run `mint broken-links` to check links

## Hard rules for any automated edit (workflows, agent, review passes)

- **Never change product facts.** Feature behavior, limits, plan differences, button names, and flows in these docs were verified against the live product by the CCTools team. Do not "correct" them from general knowledge or older versions of the product. If a fact looks wrong, open a PR that flags it in the description instead of rewriting it. Known-correct examples an automated pass has previously broken: Canton wallets are connected through a wallet picker (Send, 5N Loop, Cantor8), not by pasting an address; wallet limits are 1 wallet per chain on Free and 5 per chain on Pro.
- **Open pull requests only. Never commit directly to `main`.**
- **Never edit `docs.json` branding**: colors, logo, favicon paths must not be changed or replaced with external URLs.
- **Never use em dashes or en dashes** anywhere, in any language. Use a comma, colon, parentheses, or a period instead.
- **Never use the word "staking"** for Canton rewards. Canton has no staking; write "rewards" (Featured App rewards, validator rewards).
- Do not rewrite titles wholesale for SEO. Title changes must preserve the factual meaning and be proposed via PR.
- Do not touch the `pt/`, `es/`, `zh/` locales unless the same change is applied to the English page in the same PR.

## Terminology

- "Canton Network" (never "Canton blockchain"), "Canton Coin" / "CC"
- "wallet picker" for the Canton connect modal; "My Wallets" for the management panel
- "Human Score" (capitalized) for the anti-sybil verification score
- "Featured App rewards", never "staking rewards"

## Style preferences

- Use active voice and second person ("you")
- Keep sentences concise, one idea per sentence
- Use sentence case for headings
- Bold for UI elements: Click **Settings**
- Code formatting for file names, commands, paths, and code references
- No em dashes or en dashes, ever

## Content boundaries

- Document only shipped, user-visible features. Never document internal admin tooling, unreleased features, or partner pricing.
