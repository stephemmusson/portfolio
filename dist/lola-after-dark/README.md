# Lola After Dark: opening preview

A self-contained opening for Stephen Musson’s tribute to Lola. Deploy this directory at `/lola-after-dark/`, or use its contents as the root of a separate domain. All game asset URLs are relative. The portfolio return link is the only root-relative URL.

This version includes a welcome screen, an 11-second skippable midnight opening, a title screen, a small interactive moth/stroke scene and a quiet sofa moment. It does not yet include a platforming level. Scene artwork is layered WebP imagery with browser animations, not a real-time 3D scene or rigged character. Lola’s sleeping/awake images crossfade; breathing, moth wings, light and dust animate in CSS. Reduced-motion users receive a short static transition. Sound starts only after the sound button is pressed, with a gentle synthesised chord/chime/purr; no external audio files or dependencies.

## Run locally

Serve the parent directory over HTTP and visit `/lola-after-dark/`. No build step or third-party dependencies. Portfolio deployment copies `dist` recursively, so this folder is included automatically. Versioned CSS, JS and art filenames account for the portfolio’s long asset cache. Bump filenames and references when changing deployed assets.

## Art direction and generation

Built-in image generation produced the art, with supplied photos used as identity references. WebP derivatives were prepared for the game. Final prompts specified:

- Bedroom: wide side-on 2.5D miniature-diorama English bedroom at midnight; blue moonlight, amber lamp, dusty-blue duvet, dark upper-left title space; no cat, people or baked-in UI.
- Lola: two isolated full-body sleeping/awake poses; adult long-haired charcoal-grey tabby cap and back, white blaze, muzzle, chest and large paws, darker detail around pink nose, bushy tail; one blue eye and one green eye; transparent background and soft moonlit fur.
- Together: Stephen from supplied references, bearded with black beanie and dark shirt, asleep on a teal sofa with Lola on his chest; moonlit cosy English room, books and records, warm lamp; no text/UI.

Eye-side placement is provisional: current artwork shows blue on the viewer’s left and green on the viewer’s right. Confirm against a clear frontal photo before locking the final model. Future gameplay should use a consistent rigged/sprite character and individually interactive scenery to preserve this visual direction during play.
