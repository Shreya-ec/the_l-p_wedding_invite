# The P & L Wedding

A cinematic, scroll-driven wedding invitation.

## Where to edit

| What | File |
| --- | --- |
| Copy, image paths, couple placement, scroll timing | `src/config/invitation.ts` |
| Palette and type | `src/styles/tokens.css` |
| Envelope / flap / seal | `src/components/OpeningEnvelope` and `src/components/WaxSeal` |
| Scroll motion | `src/animations/useSceneScroll.ts` |
| Artwork | `public/images/` |

Add later cinematic chapters by appending objects to `invitation.scenes`.
