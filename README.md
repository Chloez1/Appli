# Studio de Conception de Produits 🧩

Application web pour gérer vos **conceptions de produits**, de la première idée
jusqu'au lancement. Aucune installation, aucune dépendance : il suffit d'ouvrir
`index.html` dans un navigateur.

## Fonctionnalités

- **Tableau Kanban** en 5 étapes : Idée → Conception → Prototype → Validé → Lancé.
- **Glisser-déposer** des fiches d'une étape à l'autre.
- **Fiche concept** complète : nom, catégorie, priorité, coût cible, description,
  matériaux, image/esquisse (URL) et notes de conception.
- **Recherche** plein texte et **filtres** par catégorie et priorité.
- **Tri** par date de modification, de création, nom ou priorité.
- **Tableau de bord** : nombre de concepts, en cours, lancés, coût cible moyen.
- **Import / Export JSON** pour sauvegarder ou partager vos données.
- **Persistance locale** automatique via `localStorage`.

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
