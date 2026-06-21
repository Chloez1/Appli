# Studio de Conception de Produits 🧩

Application web pour gérer vos **conceptions de produits**, de la première idée
jusqu'au lancement. Aucune installation, aucune dépendance : il suffit d'ouvrir
`index.html` dans un navigateur.

## Fonctionnalités

- **Tableau Kanban** en 5 étapes : Idée → Conception → Prototype → Validé → Lancé.
- **Glisser-déposer** des fiches d'une étape à l'autre.
- **Jalons datés** : enregistrement automatique de la **date de validation** et de
  la **date de lancement** (renseignées à la main ou posées automatiquement quand
  la fiche atteint l'étape « Validé » ou « Lancé »). Les dates s'affichent en badge
  sur les cartes.
- **Visionneuse 3D** : importez un modèle (`.glb`, `.gltf`, `.stl`, `.obj`) par URL
  ou depuis votre ordinateur, et visualisez-le en 3D (rotation, zoom, déplacement).
- **Image → relief 3D** : transformez un dessin plat (esquisse, logo, motif) en
  maillage 3D en relief. La luminosité de l'image définit la hauteur (clair = bosse,
  sombre = creux). Réglages de profondeur, de niveau de détail, inversion du relief
  et reprise des couleurs de l'image. Accessible depuis la fiche (« 🪄 Image → relief 3D »)
  ou via « 🪄 Image → relief » dans la visionneuse pour un fichier local.
  *Note : ceci produit un bas-relief, pas une reconstruction volumétrique complète.*
- **Gestion des catégories** de produits : liste éditable (ajout / suppression),
  réutilisée dans le formulaire et les filtres.
- **Fiche concept** complète : nom, catégorie, priorité, coût cible, description,
  matériaux, image/esquisse, modèle 3D et notes de conception.
- **Import de fichiers dans la fiche** : pour l'image et le modèle 3D, on peut
  coller un lien **ou importer un fichier** depuis l'ordinateur. Les fichiers sont
  conservés localement (les images sont redimensionnées automatiquement). Une image
  importée localement permet aussi de générer le relief 3D sans blocage CORS.
- **Recherche** plein texte et **filtres** par catégorie et priorité.
- **Tri** par date de modification, de création, nom ou priorité.
- **Tableau de bord** : concepts au total, en cours, validés, lancés.
- **Import / Export JSON** pour sauvegarder ou partager vos données.
- **Persistance locale** automatique via `localStorage`.

> ℹ️ La visionneuse 3D charge la bibliothèque **Three.js** depuis un CDN à la
> demande (première ouverture). Une connexion internet est donc requise pour la 3D ;
> le reste de l'application fonctionne hors ligne.

## Utilisation

Ouvrez simplement le fichier dans un navigateur :

```bash
# depuis le dossier du projet
xdg-open index.html      # Linux
open index.html          # macOS
start index.html         # Windows
```

Ou servez le dossier avec un petit serveur statique :

```bash
python3 -m http.server 8000
# puis visitez http://localhost:8000
```

## Structure

| Fichier        | Rôle                                              |
| -------------- | ------------------------------------------------- |
| `index.html`   | Structure de l'interface                          |
| `styles.css`   | Thème sombre et mise en page responsive           |
| `app.js`       | Logique : état, rendu, glisser-déposer, stockage  |

## Données

Les concepts sont enregistrés dans le navigateur (`localStorage`, clé
`studio-conception-produits/v1`). Utilisez **Exporter** pour obtenir un fichier
JSON de sauvegarde et **Importer** pour le recharger sur un autre poste.
