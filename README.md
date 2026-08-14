# OMBRA — atelier d'architecture

Expérience digitale expérimentale : le site d'un cabinet d'architecture fictif
(Lugano · Kyoto), construit autour d'une seule idée — **le défilement traverse
une journée entière autour de la Villa Vespera**, de l'aube à la nuit.

## Lancer

```bash
npm install
npm run dev        # → http://localhost:5179
npm run build      # production dans dist/
```

## Le récit (9 chapitres au scroll)

| Ch. | Nom | Ce qui se passe |
|----|-----|-----------------|
| 00 | Prologue | Nuit noire. Un trait d'or dessine les arêtes de la villa (shader de révélation sur `EdgesGeometry`). |
| I | L'approche | L'aube se lève, le bâtiment se matérialise par un plan de coupe ascendant (`clippingPlanes`). |
| II | La structure | Élévation frontale quasi-orthographique, annotations techniques projetées depuis l'espace 3D. |
| III | L'anatomie | Axonométrie éclatée chorégraphiée couche par couche, liste synchronisée. |
| IV | L'intérieur | La porte vitrée coulisse, la caméra entre. Rais de lumière volumétriques + poussière (shaders). |
| V | La matière | Nuancier horizontal — 5 matériaux en textures procédurales (travertin, béton banché, chêne, bronze, verre). |
| VI | Les œuvres | Index typographique ; au survol, photographies **prises par le moteur lui-même** au chargement. |
| VII | Planches | Galerie horizontale drag + scroll des archives (variantes de la villa recomposées puis photographiées). |
| VIII | Nocturne | La maison s'allume. Contact. |

## Architecture technique

- **Vite** vanilla JS, **Three.js**, **GSAP + ScrollTrigger**, **Lenis** — pas de framework.
- Villa 100 % procédurale (aucun asset externe), textures canvas générées au chargement.
- Cycle solaire : 11 keyframes (direction, couleur, ciel, brume, exposition) interpolées sur la progression globale.
- Caméra : trajectoire Catmull-Rom ancrée aux chapitres, easing par segment, parallaxe souris amortie.
- Eau : shader custom (normales bruitées, fresnel, spéculaire soleil) — bassin + lac lointain.
- Post : grain animé, vignette, aberration chromatique marginale, voile éditorial (un seul pass).
- `prefers-reduced-motion` respecté ; tiers de performance (DPR, ombres, particules) selon la machine.

Étude expérimentale — 2026.
