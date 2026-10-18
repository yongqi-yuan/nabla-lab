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
