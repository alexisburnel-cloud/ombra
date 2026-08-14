# Registre des assets externes — CARÈNE V3

Tous les assets listés ci-dessous sont publiés sous licence **CC0 1.0**
(domaine public, usage commercial autorisé, aucune attribution requise —
créditée ici par courtoisie). Aucun asset payant, aucun scraping,
aucun contournement de connexion.

## Textures PBR — ambientCG (ambientcg.com, CC0)

Téléchargées via l'API publique de téléchargement direct d'ambientCG,
converties en JPEG (color / normal GL / roughness / ambient occlusion),
redimensionnées pour le web. Emplacement : `public/textures/<clé>/`.

| Clé projet | Asset ambientCG | Usage |
|---|---|---|
| grass | Grass004 | pelouse, prairie proche |
| gravel | Gravel043 | cour d'arrivée, allées |
| ground | Ground108 | terre de chantier, terrassement |
| plaster | Plaster002 | enduits de façade |
| concrete | Concrete034 | béton (dalles, soutènements, piscine) |
| siding | WoodSiding009 | bardage bois de l'attique |
| tiles | RoofingTiles013A | couvertures en tuiles |
| paving | PavingStones128 | terrasses minérales, margelles |
| rock | Rock051 | enrochements, affleurements |
| woodfloor | WoodFloor043 | sols et plafonds bois intérieurs |
| planks | Planks037A | terrasses bois extérieures |
| stonewall | Bricks097 | murs en pierre (voiles, soutènements) |

Source : https://ambientcg.com — auteur : Lennart Demes / ambientCG.
Licence : CC0 1.0 Universal (https://docs.ambientcg.com/license/).

## Textures PBR — Poly Haven (polyhaven.com, CC0)

| Clé projet | Asset Poly Haven | Usage |
|---|---|---|
| stonewall2 | stone_wall (1K JPG) | voiles pierre, cheminée, ferme, soutènements |

Source : https://polyhaven.com/a/stone_wall — licence CC0.

## Photographies

Les photographies de réalisations, d'archives et d'équipe proviennent de
**carene.net** (assets Zyro/Hostinger du client CARÈNE) et sont utilisées
dans le cadre du site de ce même client. Emplacement : `public/photos/`.

## Autres

- Logo CARÈNE : retracé en SVG d'après l'identité visuelle du client.
- Tout le reste (géométrie 3D, shaders, textures procédurales
  complémentaires) est produit en propre dans ce dépôt.

## Pipeline Blender (proof of quality) — `3d/assets/`

Tous CC0, téléchargés directement depuis les sources officielles.

### Modèles Poly Haven (gltf 2k) — https://polyhaven.com
| Asset | Usage |
|---|---|
| sofa_02 | canapé du séjour |
| coffee_table_round_01 | table basse |
| wooden_table_02 | table à manger int./ext. |
| dining_chair_02 | chaises |
| modern_ceiling_lamp_01 | plafonnier séjour |
| antique_ceramic_vase_01 | accessoire |
| chinese_stool | tabourets îlot |
| grass_medium_01 | touffes de graminées |
| wild_rooibos_bush | arbustes secs méditerranéens |
| chinese_armchair | (téléchargé, écarté — style) |
| garden_gloves_01 | (téléchargé par erreur de mot-clé, inutilisé) |

### HDRI Poly Haven (4k EXR)
- kloofendal_48d_partly_cloudy_puresky — ciel/remplissage (disque solaire plafonné,
  ombres portées par un Sun bas séparé).

### Textures ambientCG (2K JPG) — https://ambientcg.com
Grass004, Gravel043, Ground037, Ground108, Plaster002, Concrete016, Concrete034,
WoodSiding009, RoofingTiles013A, PavingStones128, Rock051, WoodFloor043, Planks037A.

Les modèles Poly Haven déjà présents dans `public/models` (végétation
photogrammétrique) sont réutilisés dans les scènes Blender.

### Modèle fourni par le client
- date_palm.glb (palmier-dattier, origine Sketchfab, fourni par Alexis le 14/08/2026) —
  `3d/assets/models/date_palm/`. **Licence à confirmer** (probable CC Attribution :
  créditer l'auteur avant toute diffusion publique du rendu).

### Engins de chantier (fournis par le client le 14/08/2026, origine Sketchfab/IA)
- excavator.glb — pelleteuse RETENUE (modélisation riggée, pivots natifs). Licence à confirmer.
- crane.glb, concrete_mixer_truck.glb, concrete_pump.glb,
  telehandler_telescopic_forklift.glb, highly_dump_truck_*.glb — retenus. Licences à confirmer.
- hitachi_excavator.glb, excavator_3d_model.glb — ÉCARTÉS (scans IA non riggables),
  conservés comme décor potentiel uniquement.
