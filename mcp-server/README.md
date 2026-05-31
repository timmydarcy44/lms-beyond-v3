# Beyond CRM MCP

Serveur MCP pour lire/écrire le pipeline BTOB via l’API REST Beyond.

Transport **HTTP + SSE** (compatible hébergement Render / cloud).

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
PORT=3001
```

La même clé doit être définie côté Next.js : `BEYOND_MCP_API_KEY`.

## Lancement

```bash
npm start
```

Le serveur écoute sur `process.env.PORT` (défaut **3001**) :

| Méthode | Route | Rôle |
|--------|-------|------|
| GET | `/sse` | Connexion MCP (flux Server-Sent Events) |
| POST | `/messages?sessionId=…` | Messages JSON-RPC du client |
| GET | `/health` | Sonde de disponibilité |

## Render

- **Start command** : `npm start`
- **Port** : laisser Render injecter `PORT` (ne pas forcer 3001 en dur)
- **URL MCP** pour Claude.ai : `https://votre-service.onrender.com/sse`

Variables d’environnement Render :

- `BEYOND_API_URL=https://edgebs.fr`
- `BEYOND_MCP_API_KEY=…`

## Claude.ai

Settings → Connectors → Add MCP Server → URL SSE : `https://votre-hôte/sse`

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
