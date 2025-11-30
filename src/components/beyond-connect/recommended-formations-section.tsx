"use client";

import { useState, useEffect } from "react";
import { GraduationCap, ArrowRight, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

type RecommendedFormationsSectionProps = {
  userId: string;
  limit?: number;
};

type Formation = {
  id: string;
  title: string;
  description?: string;
  cover_image?: string;
  price?: number;
  item_type: string;
};

export function RecommendedFormationsSection({
  userId,
  limit = 3,
}: RecommendedFormationsSectionProps) {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFormations();
  }, [userId]);

  const loadFormations = async () => {
    try {
      const response = await fetch("/api/beyond-connect/recommended-formations");
      if (response.ok) {
        const data = await response.json();
        setFormations(data.formations?.slice(0, limit) || []);
      }
    } catch (error) {
      console.error("[recommended-formations] Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-gray-200 bg-white">
        <CardContent className="p-6">
          <div className="text-gray-600">Chargement des formations...</div>
        </CardContent>
      </Card>
    );
  }

  if (formations.length === 0) {
    return null;
  }

  return (
    <Card className="border-gray-200 bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#003087] text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-gray-900">Formations recommandées</CardTitle>
              <p className="text-sm text-gray-600">Améliorez votre profil avec ces formations</p>
            </div>
          </div>
          <Link href="/dashboard/catalogue">
            <Button variant="outline" size="sm">
              Voir tout
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {formations.map((formation) => (
            <Link
              key={formation.id}
              href={`/dashboard/catalogue/module/${formation.id}`}
              className="group"
            >
              <Card className="h-full cursor-pointer border-gray-200 bg-white transition-all hover:shadow-lg">
                <div className="relative h-48 w-full overflow-hidden rounded-t-lg bg-gray-100">
                  {formation.cover_image ? (
                    <Image
                      src={formation.cover_image}
                      alt={formation.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <BookOpen className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="mb-2 font-semibold text-gray-900 line-clamp-2">
                    {formation.title}
                  </h3>
                  {formation.description && (
                    <p className="mb-3 line-clamp-2 text-sm text-gray-600">
                      {formation.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    {formation.price !== undefined && formation.price > 0 ? (
                      <span className="font-semibold text-[#003087]">
                        {formation.price}€
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-green-600">Gratuit</span>
                    )}
                    <ArrowRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

