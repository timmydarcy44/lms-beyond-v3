"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const CLUB_LOGO_URL =
  "https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Beyond%20FC/Logo%20FCB.jpeg";

export default function BeyondFCPage() {
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="max-w-3xl space-y-6 text-center">
        <Image
          src={CLUB_LOGO_URL}
          alt="Blason du club Beyond FC"
          width={164}
          height={164}
          className="mx-auto h-24 w-auto object-contain drop-shadow-lg"
          priority
        />
        <Badge variant="outline" className="border-blue-500/40 bg-blue-500/10 text-blue-200">
          Univers Beyond FC
        </Badge>
        <h1 className="text-4xl font-semibold">Prenez la tête du club</h1>
        <p className="text-lg text-white/70">
          Découvrez un vertical slice jouable du Tour&nbsp;1 : posez les bases de votre stratégie,
          testez différentes politiques de production et constatez l’impact de vos choix en temps
          réel.
        </p>

        <Card className="border-white/10 bg-white/5 text-left">
          <CardHeader>
            <CardTitle>Lancement de la saison</CardTitle>
            <CardDescription>
              Production, prix, positionnement : chaque levier influence les fans, la trésorerie et
              l’image de marque.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-white/70">
              En trois minutes, prenez vos décisions, simulez le tour et analysez le feedback du
              Game Master. Rejouez autant que nécessaire pour trouver le juste équilibre.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" onClick={() => router.push("/beyond-fc/tour/1")}>
                Commencer la saison
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="text-white/70"
                onClick={() => window.open("https://www.lms.jessicacontentin.fr", "_blank")}
              >
                Découvrir l’expérience complète
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

