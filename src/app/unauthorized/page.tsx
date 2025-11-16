import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <Card className="max-w-md text-center">
        <CardHeader>
          <CardTitle>Accès non autorisé</CardTitle>
          <CardDescription>
            Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, contactez votre administrateur.
          </p>
          <Button asChild>
            <Link href="/">Retour à l&apos;accueil</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}


