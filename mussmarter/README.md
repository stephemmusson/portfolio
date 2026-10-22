# MussMarter preservation rebuild
This is an isolated preview branch. Nothing in this branch should be merged or deployed until the original WordPress archive is fully verified.

## What is in place
- `mussmarter/import_public_site.py`: collects public post pages from the live site, follows archive/category links, downloads embedded original photographs where accessible, and generates responsive noindex HTML pages under `mussmarter/site/`.
- `.github/workflows/mussmarter-archive.yml`: runs the importer on GitHub Actions on changes to this branch and uploads a 30-day `mussmarter-site-preview` artifact. Does not publish anything.

## Required checks before publication
1. Download the archive build artifact under GitHub Actions > Build MussMarter Archive (preview only).
2. Inspect `migration-report.json` for `story_count`, `image_count`, failures and source paths.
3. Compare post titles against all original archive pages and categories; inspect the start/middle/end of each post and image placement.
4. Resolve failed photo downloads and inspect for embedded WordPress-hosted scripts, image URLs, galleries and missing content.
5. Back up the exported media and story files independently, then publish only under `/mussmarter/`. Ensure existing portfolio assets remain untouched.
6. Confirm every HTML page includes `noindex`, and send X-Robots-Tag: noindex for images/PDFs if required. Keep the archive accessible to crawlers so they can see noindex.
7. Only cancel WordPress after all content and original-size media are safely stored and compared.

### Caution
The public site cannot guarantee access to unlinked, unpublished, missing or protected WordPress media. A WordPress export is only necessary if a gap is discovered after crawling.
