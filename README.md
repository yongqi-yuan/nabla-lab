# Nabla Lab website

The public website of Nabla Lab, an independent academic community.

Production domain: https://nabla.ac.cn/

## Edit and build

Requires Node.js; no package installation is needed.

- `content.json`: members, research themes and lab information.
- `editorial.mjs`: Editorial articles, archive and presentation.
- `build.mjs`: page generation, navigation, search index and sitemap.
- `docs/assets/`: stylesheets, scripts, logos, portraits and other static assets.

Run `node build.mjs`, review the changes in `docs/`, then commit and push.

## GitHub Pages

In Settings → Pages, choose **GitHub Actions**. The workflow builds and publishes on every push to main.
Set the custom domain to **nabla.ac.cn** and enable HTTPS when GitHub has issued the certificate.
The `docs/.nojekyll` file preserves the generated static pages.

The domain must be configured in GitHub Pages before DNS is switched. Leave the previous hosting available during DNS propagation.

## Editorial archive

Preserve original publication dates and published arguments. Append dated corrections or postscripts; publish substantive changes of perspective as new articles.
All members may contribute signed articles. Obtain consent before publishing another person's attributed remarks.

## Rights

© 2026 Nabla Lab. All rights reserved. Individual Editorial articles retain their named authorship. No general open-source license is granted for the code, text, photographs or identity assets. See `/copyright/` for credits.

## Languages

English pages keep their original URLs. Simplified Chinese pages live under `/zh/`. Each page links to its counterpart; the language switch preserves section anchors. Both sets are built statically, with matching canonical and hreflang links and language-specific search indexes.

- `translations.zh.json`: Chinese page copy and interface translations.
- `bilingual.mjs`: creates Chinese routes and bilingual navigation after the English build.
- `editorial.en.json`: English translation of the founding note. The Chinese original remains unchanged; the English page identifies its translation date.
- `docs/assets/languages.js`: preserves section anchors during a language switch.

Run `node build.mjs` after editing. Keep translated copy in sync with source changes. Publication titles, DOI values and institutional names may retain their original form.

## Local Content Studio

The editor runs only on the owner's computer. Double-click **打开 Nabla 编辑器.command**, or run `node studio-server.mjs`, then visit **http://127.0.0.1:6178/admin/**. Node.js 22 or newer is required. No package installation is needed.

The server binds **127.0.0.1 only**. It rejects unexpected Host headers, cross-origin API requests, non-JSON writes and requests without the editor's explicit request header. Paths are confined to the public site/editor directories; symlinks cannot escape them. No shell commands are accepted from browser requests. Publication credentials remain in browser memory and are sent only to GitHub.

- `editor/`: local form UI, shared renderer and GitHub publication client; never copied into `docs/`.
- `.local-studio/`: ignored local snapshots, persistent draft JSON (including pending images), one previous draft, publication baselines and local backups. Never committed or deployed.
- `site-edits.json`: published page/locale and optional shared header/footer overrides. Original templates remain intact.
- `editorial-articles.json`: published signed bilingual essays. New drafts stay in local state until explicitly marked published.
- `docs/assets/uploads/`: published images, committed atomically with their referencing content.
- `cms-build.mjs`: applies overrides, builds article routes/search/sitemap, writes editor snapshots outside the public folder, and removes any legacy `docs/admin/` output.

Changes automatically save to the local draft file; **保存到电脑** or ⌘S saves immediately. Restarting restores text and pending images. **导出草稿备份** creates a portable JSON backup without credentials. Merely saving does not update the website or upload draft material.

To publish, connect a fine-grained GitHub token restricted to **yongqi-yuan/nabla-lab**, with **Contents: Read and write** and **Actions: Read-only** (deployment progress). It remains only in the local editor tab's memory. All published text/images use one non-forced GitHub commit; stale content or racing updates abort rather than overwriting. The existing GitHub Actions workflow builds and deploys. After commit success, the local server records the published content and images in the working copy and keeps unpublished article drafts locally.

The live website has **no `/admin/` editor, API, manifests or draft snapshots**. The repository remains public; editor source code is visible as ordinary repository code, and published content retains Git history. Never commit `.local-studio/`.

Run `node build.mjs`, `node --test tests/cms.test.mjs`, and `node --test tests/studio-server.test.mjs` for renderer/publication and local-server boundary checks. The guide is served locally at `/admin/help.html`.

## Local content and structure review

The `codex/nabla-content-review` branch introduces a homepage with direct academic copy, a visual presentation and editable bilingual copy in `home-copy.json` and its presentation in `home-page.mjs`. Research and publications precede the member list; the circular member view is shown by default, with a list as an alternative. The founding editorial and existing detail URLs are preserved.

The default editor now handles complete paragraphs (including inline links, bold text and paragraph breaks) through stable `blocks` overrides, alongside the existing legacy `fields` overrides. Fine-grained fields remain under the explicit detail tab.

When the ignored `.local-studio/preview-mode.json` contains `previewOnly: true`, the local server uses a separate `review-draft.json`, preserves the existing `draft.json`, and the editor disables publishing until the new site templates are reviewed and deployed. Original pre-review drafts are retained in `.local-studio/history/`. This flag is local to the current computer and is never deployed.

The visual review retains the factual headings and paragraph editor while restoring a full image hero, research diagrams, a publication sketch, the default circular people view and a two-tone Editorial section. Ocean imagery is identified as an illustration; the gap-resonance drawing is a conceptual schematic rather than a research result. The reduced-motion preference disables the hero animation.

The same local review now covers all interior routes and both languages. `page-visuals.mjs` provides contextual illustrated mastheads, and `docs/assets/interior.css` coordinates the diagrams, member profiles, publication figures, timeline, Editorial reading view and dark footer. Copy edits replace generic slogans with group history, research subjects and profile information; the founding essay’s arguments, authorship and publication dates are preserved. This branch remains a local preview until reviewed.
