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

## Content Studio

Open **https://nabla.ac.cn/admin/** to edit existing English/Chinese page text, metadata, links and images, preview the current design, and publish without a chat session. The editor is a static, dependency-free application; GitHub enforces write permissions.

- `site-edits.json`: stable text/image/link overrides for each locale and optional shared header/footer overrides. Original templates remain intact. Resetting a field removes its override.
- `editorial-articles.json`: additional signed bilingual Editorial articles. Published articles have fixed slugs and original publication dates; subsequent changes append dated revision notes. The founding note remains in its existing template and is editable through page forms.
- `cms-build.mjs`: applies overrides after localization, adds published essays, generates editor base-page snapshots and rebuilds search/sitemap.
- `docs/admin/`: editor UI, shared preview renderer, publication client, generated manifest/state and base pages.
- `docs/assets/uploads/`: uploaded images, committed atomically with the text referencing them.

Editors create a fine-grained GitHub personal access token restricted to **yongqi-yuan/nabla-lab**, with **Contents: Read and write** and **Actions: Read-only** (deployment progress). No server, extra CMS subscription, or shared token is required. The token stays in the tab's module memory; it is never written into files, localStorage, exported drafts, URLs or Git history. Refreshing ends the session.

Text drafts are saved in localStorage. New article drafts remain local until explicitly marked published; other page changes and uploaded images are public when committed. Pending image bytes are held in memory and can be included in an exported draft backup. The repository is public: do not publish private material.

Before publishing, the editor compares remote content files against the loaded baseline. All content and image changes use one Git tree/commit and one non-forced main ref update. Concurrent content changes abort instead of overwriting. GitHub Actions handles the existing build/deploy workflow; the editor reports completion separately from commit success. If site templates change and an override's original field no longer exists, the build logs a stale-field warning.

Run `node build.mjs` and `node --test tests/cms.test.mjs` for rendering, bilingual article, image/link safety and publication conflict checks. The preview iframe is script-free and sandboxed. See `/admin/help.html` for the editor guide.
