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

Byound signe des Open Badges 3.0 en VC-JWT (EdDSA, Ed25519). La clé privée vit dans `BADGE_SIGNING_PRIVATE_JWK`, le kid dans `BADGE_SIGNING_KID`. Ces deux variables sont dans Vercel Preview et Production, avec les mêmes valeurs. Elles ne vont jamais dans le dépôt.

La clé publique est publiée dans `https://www.byound.fr/.well-known/jwks.json` et dans le profil émetteur. Un badge privé répond 404.

### Rotation de la clé de signature des badges

1. Générer une nouvelle paire Ed25519 et un nouveau kid, par exemple `byound-ed25519-2027`.
2. Ajouter la nouvelle clé publique à `badge_issuers.public_jwks`, à côté de l'ancienne. Ne pas retirer l'ancienne.
3. Mettre `BADGE_SIGNING_PRIVATE_JWK` et `BADGE_SIGNING_KID` à jour en Preview, puis en Production, avec la nouvelle paire.
4. Les badges émis ensuite sont signés avec le nouveau kid. Les badges déjà émis restent vérifiables tant que leur clé publique reste dans la JWKS.
