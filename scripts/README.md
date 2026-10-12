# Catalog tooling

Node scripts that build and validate the snippet catalog. No runtime
dependency beyond Node 22 and the dev dependency `gray-matter`.

Run them through the npm aliases defined in `package.json`.

| npm script | File | Role |
|---|---|---|
| `npm run check:catalog` | `build-catalog.mjs --check` | Validates the front-matter of every `library/<category>/<snippet>/README.md` (required `title`, `category` in the allowed list, valid `status`, `tags` as a list, boolean `featured`). Writes nothing. This is what CI runs. |
| `npm run build:catalog` | `build-catalog.mjs` | Same validation, then writes `site/catalog.json` (the data the page reads). Also adds `updated` = the folder's last commit date (via `git log`) to each entry. Run it locally before `npm run serve`. |
| `npm run check:i18n` | `check-i18n.mjs` | Fails if the languages in `site/i18n.json` do not all expose exactly the same keys as `en`, or if any value is empty. Used by CI. |
| `npm run bootstrap:frontmatter` | `bootstrap-frontmatter.mjs` | One-off helper: adds a front-matter skeleton to every snippet `README.md` that lacks one (and creates a minimal `README.md` where none exists). Never touches a README that already has front-matter. Run once, then fill in the fields by hand. |
| `npm run serve` | `serve.mjs` | Serves the `site/` folder on <http://localhost:4173> so the page can be tested in a browser (`fetch()` does not work over `file://`). Stop with Ctrl+C. `python3 -m http.server 4173` inside `site/` works too. |

## What is generated vs. authored

- **Authored** (committed): the front-matter blocks in each snippet `README.md`,
  and `site/i18n.json`.
- **Generated** (git-ignored, never committed): `site/catalog.json`. It is a
  pure build artifact - rebuilt locally by `npm run build:catalog` and by the
  Pages workflow on every deploy.
- The repo's root `README.md` is **not** rewritten by any script; it only
  carries a link to the online catalog.

## Typical flows

**First setup**

```bash
npm install
npm run bootstrap:frontmatter   # once
# ... fill in title / category / tags / since / status in each README ...
npm run check:catalog           # validate
npm run build:catalog           # build site/catalog.json for local preview
```

**Adding or editing a snippet**

```bash
# edit library/<category>/<snippet>/README.md (front-matter + body)
npm run check:catalog
git add library/**/README.md
```

Nothing else to regenerate or commit. CI (`check:catalog`, `check:i18n`)
rejects a pull request whose front-matter or translations are invalid.
