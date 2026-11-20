# Documentation project instructions

## About this project

- This is the public documentation for CCTools (cctools.network), the public record of the Canton Network: the open daily record, the public API, the project directory, markets, governance and portfolio tools
- Pages are MDX files with YAML frontmatter; four locales: English at the root, plus `pt/`, `es/`, `zh/` mirrors
- Configuration lives in `docs.json`: the menu (tabs, groups, page order per locale), the redirects, the header button, the share card and the footer links
- The site is built by `site/` (Fumadocs on Next.js, a static export for Cloudflare Pages). It reads the MDX files where they are and `docs.json`; pages never move into `site/`
- Preview: `pnpm --dir site install` once, then `pnpm --dir site dev` (port 3720)
- Build and check: `pnpm --dir site build`, then `pnpm --dir site check` (components and icons have shims, every URL Mintlify served still answers, no broken internal link in any locale)
- A page needs both its file and its path in `docs.json`, or the build stops; a new MDX component needs its shim in `site/components/mdx.tsx` and its Markdown in `site/scripts/mdx-to-md.mjs`, and a new icon name its entry in `site/components/icon.tsx`
- Synchro on the docs is the site's own assistant, not a docs bot: `site/components/synchro-dock.tsx` loads `https://cctools.network/synchro-dock.js` (built in the cctools2 repo), which shows the site's Synchro in a frame. The docs hold no chat code and call no API; the button, the chat and the answers change in cctools2 only. `NEXT_PUBLIC_SYNCHRO_ORIGIN` points a local build at a local site
- Until Mintlify is retired, `mint dev` and `mint broken-links` still work on the same files (`site/` is in `.mintignore`)
- Hosting: Cloudflare Pages, project root directory `site`, build command `pnpm build`, output directory `out`, production branch `main`, environment variables `NODE_VERSION=22` and `PNPM_VERSION=11.15.1` (`site/.node-version` says 22 too). The build writes `_redirects` (from `docs.json`, plus `/mcp` to the CCTools MCP server) and `_headers` into `out`

## Hard rules for any automated edit (workflows, agent, review passes)

- **Never change product facts.** Feature behavior, limits, plan differences, button names, and flows in these docs were verified against the live product by the CCTools team. Do not "correct" them from general knowledge or older versions of the product. If a fact looks wrong, open a PR that flags it in the description instead of rewriting it. Known-correct examples an automated pass has previously broken: Canton wallets are connected through a wallet picker (5N Loop and Console are the wallets offered for a new connection), not by pasting an address; wallet limits are 1 wallet per chain on Free and 5 per chain on Pro.
- **Open pull requests only. Never commit directly to `main`.**
- **Never edit `docs.json` branding**: colors, logo, favicon paths must not be changed or replaced with external URLs.
- **Never use em dashes or en dashes** anywhere, in any language. Use a comma, colon, parentheses, or a period instead.
- **Never use the word "staking"** for Canton rewards. Canton has no staking; write "rewards" (Featured App rewards, validator rewards).
- Do not rewrite titles wholesale for SEO. Title changes must preserve the factual meaning and be proposed via PR.
- Do not touch the `pt/`, `es/`, `zh/` locales unless the same change is applied to the English page in the same PR.

## Terminology

- "Canton Network" (never "Canton blockchain"), "Canton Coin" / "CC"
- "wallet picker" for the Canton connect modal; "Manage wallets" for the management panel
- "Verified" (capitalized), a yes or no and never a score, for the check that a real person is behind an account. The old "Human Score" name is retired: do not bring it back
- On cctools.network pages, rankings of members exist only inside Campaigns: the season ranking and a campaign's own ranking, XP only, Verified accounts only, with no prize. The Discord bot's /rank leaderboard, the public API's leaderboard endpoints and the rank in a public profile's data are separate and stay as documented. Never describe a prize, a reward or money attached to a rank
- "Featured App rewards", never "staking rewards"
- XP opens access and exclusive activities. It is not a prize and it is not money. Never promise how long XP lasts
- A campaign badge is the signed claim of a completed campaign: no transaction, no fee. Never call it an NFT or a token, and never describe an airdrop

## Style preferences

- Use active voice and second person ("you")
- Keep sentences concise, one idea per sentence
- Use sentence case for headings
- Bold for UI elements: Click **Settings**
- Code formatting for file names, commands, paths, and code references
- No em dashes or en dashes, ever

## Content boundaries

- Document only shipped, user-visible features. Never document internal admin tooling, unreleased features, or partner pricing.
