# Dev server reset (port 3000 enforced)

## Windows (PowerShell)

1. Reset simple  
   `powershell -ExecutionPolicy Bypass -File .\scripts\dev-reset.ps1`

2. Reset hard (supprime `.next`)  
   `powershell -ExecutionPolicy Bypass -File .\scripts\dev-reset.ps1 -Hard`

3. Vérifications  
   `curl http://localhost:3000/api/health`  
   `curl http://localhost:3000/api/health/env`  
   `pnpm tsx scripts/check-env.ts`  
   (attendez `{"ok":true}` puis un JSON où `hasSupabaseUrl` et `hasServiceRoleKey` valent `true` si la configuration est correcte)

⚠️ En PowerShell, pas de `&&` : exécute chaque commande séparément.

## macOS / Linux

```bash
chmod +x scripts/dev-reset.sh
./scripts/dev-reset.sh
./scripts/dev-reset.sh --hard   # supprime .next
curl http://localhost:3000/api/health
curl http://localhost:3000/api/health/env
pnpm tsx scripts/check-env.ts

Les commandes de vérification doivent répondre avec `{"ok":true}` puis un JSON contenant `hasSupabaseUrl` et `hasServiceRoleKey` à `true` lorsque les variables sont bien configurées.
```

## Raison d’être

- Un unique serveur Next.js sur le port **3000**.
- Suppression des locks `.next/dev/lock` persistants.
- Arrêt des processus sur les ports **3000** et **3001** avant relance.

