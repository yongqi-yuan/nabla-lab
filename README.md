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
