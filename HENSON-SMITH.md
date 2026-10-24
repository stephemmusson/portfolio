# Henson Smith artist site

Published folder: `dist/henson-smith/`
Production URL: https://stephenmusson.com/henson-smith/

Deploy with the existing manual **Deploy to Site5** GitHub Action. It prepares `.publish/` from `dist/` and uploads using the existing production environment secrets. No extra account or hosting credentials are needed if the existing workflow is configured.

This is a buildless static page with its assets and local song catalogue. The existing production build minifies CSS and JavaScript. The standalone Manifesto development-preview document and optional PHP uploader are excluded. Manifesto's album section remains absent from the production page; its already released singles remain available.

Google Analytics: G-GMQVGS6W66. Loads only after explicit analytics consent; local development and preview documents are excluded. Advertising storage and personalisation are denied. Settings are available in the footer. Confirm with GA Realtime after production launch and opting in.

SEO: canonical and sitemap target the subdirectory URL; artist/album structured data and social sharing tags are included. Root robots.txt includes the Henson Smith sitemap. Artist styles/scripts revalidate rather than inheriting the portfolio's one-year immutable caching.

The public root portfolio and its own analytics ID are separate from this page. No private credentials or upload configuration are included.
