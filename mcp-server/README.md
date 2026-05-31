# Beyond CRM MCP

Serveur MCP pour lire/écrire le pipeline BTOB via l’API REST Beyond.

## Installation

```bash
cd mcp-server
npm install
```

## Configuration

Copier `.env` :

```
BEYOND_API_URL=https://edgebs.fr
BEYOND_MCP_API_KEY=votre_cle_secrete
```

La même clé doit être définie côté Next.js : `BEYOND_MCP_API_KEY`.

## Lancement

```bash
npm start
```

## Claude.ai

Settings → Connectors → Add MCP Server → commande : `node /chemin/vers/mcp-server/index.js`

## Outils

- `list_prospects` — liste avec filtres priority / sector / status
- `create_prospect` — crée un deal BTOB (`company_name` requis)
- `update_prospect` — mise à jour partielle par `id`
- `get_pipeline_summary` — stats pipeline
- `bulk_create_prospects` — création en lot

Exemples :

- « Ajoute FRIAL dans le pipeline, secteur agro, priorité haute »
- « Donne-moi les prospects en priorité haute non contactés »
- « Résume le pipeline aujourd’hui »
