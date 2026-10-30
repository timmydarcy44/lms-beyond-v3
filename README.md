This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Open Badges

Byound signe des Open Badges 3.0 en VC-JWT (ES256, ECDSA P-256). La clé privée vit dans `BADGE_SIGNING_PRIVATE_JWK`, le kid dans `BADGE_SIGNING_KID`. La valeur actuelle du kid est `https://www.byound.fr/.well-known/keys/byound-es256-2026.json`. Ces deux variables sont dans Vercel Preview et Production, avec les mêmes valeurs. Elles ne vont jamais dans le dépôt.

La clé publique est publiée dans `https://www.byound.fr/.well-known/jwks.json` et dans le profil émetteur. Un badge privé répond 404.

Pendant une réémission, `BADGE_SIGNING_LEGACY_PRIVATE_JWK` peut contenir l'ancienne clé privée. La vérification accepte alors ES256 et EdDSA. L'ancien JWT est archivé dans `badge_assertions.superseded_credential_jwt` et n'est jamais servi.

### Rotation de la clé de signature des badges

Générer une paire, sans écrire la clé privée dans un fichier du dépôt :

```bash
node --input-type=module <<'EOF'
import { generateKeyPair, exportJWK } from "jose";

const { privateKey, publicKey } = await generateKeyPair("ES256", { extractable: true });
const privateJwk = await exportJWK(privateKey);
const publicJwk = await exportJWK(publicKey);
const kid = "byound-es256-2027";
for (const jwk of [privateJwk, publicJwk]) {
  jwk.kid = kid;
  jwk.alg = "ES256";
  jwk.use = "sig";
}
console.log(JSON.stringify(privateJwk));
console.log(JSON.stringify(publicJwk));
EOF
```

La première ligne affichée est la clé privée, à coller dans Vercel. La seconde est la clé publique.

1. Ajouter la nouvelle clé publique à `badge_issuers.public_jwks`, en premier, à côté de l'ancienne. Ne pas retirer l'ancienne.
2. Mettre `BADGE_SIGNING_PRIVATE_JWK` et `BADGE_SIGNING_KID` à jour en Preview, puis en Production. Conserver l'ancienne clé privée dans `BADGE_SIGNING_LEGACY_PRIVATE_JWK` le temps de réémettre les badges déjà signés.
3. Les badges émis ensuite sont signés avec le nouveau kid. Les badges déjà émis restent vérifiables tant que leur clé publique reste dans la JWKS.

### Retrait d'une ancienne clé

Quand plus aucun credential servi (page, JWT, PNG, liste de révocation) n'est signé avec l'ancien kid :

1. Retirer cette clé publique de `badge_issuers.public_jwks`.
2. Supprimer `BADGE_SIGNING_LEGACY_PRIVATE_JWK` dans Vercel, en Preview puis en Production.
