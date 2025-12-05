"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Loader2, Mail, Calendar, ArrowLeft, Search, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

export function FixPurchasesClient() {
  const [email, setEmail] = useState("");
  const [daysBack, setDaysBack] = useState(30);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkingSessions, setCheckingSessions] = useState(false);
  const [stripeSessions, setStripeSessions] = useState<any[] | null>(null);

  const handleCheckSessions = async () => {
    setCheckingSessions(true);
    setError(null);
    setStripeSessions(null);

    try {
      const params = new URLSearchParams({
        days: daysBack.toString(),
        limit: "50",
      });
      if (email) {
        params.append("email", email);
      }

      const response = await fetch(`/api/admin/check-stripe-sessions?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue");
      }

      setStripeSessions(data.sessions || []);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de la vérification des sessions Stripe");
    } finally {
      setCheckingSessions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/admin/fix-past-purchases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_email: email,
          days_back: daysBack,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de la correction des achats");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/super/gestion-client">
        <Button
          variant="ghost"
          className="mb-4"
          style={{ color: "#C6A664" }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>
      </Link>

      {/* Section : Vérifier les sessions Stripe */}
      <div className="bg-white rounded-2xl border-2 p-6 space-y-4" style={{ borderColor: "#E6D9C6" }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-1" style={{ color: "#2F2A25" }}>
              Vérifier les sessions Stripe
            </h2>
            <p className="text-sm" style={{ color: "#2F2A25", opacity: 0.6 }}>
              Voir les paiements Stripe récents pour diagnostiquer les problèmes
            </p>
          </div>
          <Button
            onClick={handleCheckSessions}
            disabled={checkingSessions}
            variant="outline"
            className="rounded-full"
            style={{ borderColor: "#C6A664", color: "#C6A664" }}
          >
            {checkingSessions ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recherche...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Vérifier
              </>
            )}
          </Button>
        </div>

        {stripeSessions !== null && (
          <div className="mt-4">
            {stripeSessions.length === 0 ? (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  Aucune session Stripe trouvée pour cette période.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {stripeSessions.map((session: any, index: number) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${
                      session.payment_status === "paid"
                        ? "bg-green-50 border-green-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium" style={{ color: "#2F2A25" }}>
                          {session.customer_email || "Email non disponible"}
                        </div>
                        <div className="text-xs mt-1" style={{ color: "#2F2A25", opacity: 0.6 }}>
                          Session: {session.id}
                        </div>
                        <div className="text-xs mt-1" style={{ color: "#2F2A25", opacity: 0.6 }}>
                          Date: {new Date(session.created).toLocaleString("fr-FR")}
                        </div>
                        {session.metadata && Object.keys(session.metadata).length > 0 && (
                          <div className="text-xs mt-2 p-2 rounded bg-white border" style={{ borderColor: "#E6D9C6" }}>
                            <strong>Métadonnées:</strong>
                            <pre className="mt-1 text-xs overflow-x-auto">
                              {JSON.stringify(session.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-lg font-bold" style={{ color: "#2F2A25" }}>
                          {session.amount_total} {session.currency?.toUpperCase()}
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            session.payment_status === "paid"
                              ? "bg-green-600 text-white"
                              : "bg-gray-400 text-white"
                          }`}
                        >
                          {session.payment_status === "paid" ? "Payé" : session.payment_status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border-2 p-6 space-y-6" style={{ borderColor: "#E6D9C6" }}>
        <div className="space-y-2">
          <Label htmlFor="email" style={{ color: "#2F2A25" }}>
            Email de l'utilisateur
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#C6A664" }} />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemple@email.com"
              required
              className="pl-10"
              style={{ borderColor: "#E6D9C6" }}
            />
          </div>
          <p className="text-xs" style={{ color: "#2F2A25", opacity: 0.6 }}>
            L'email utilisé lors de l'achat sur Stripe
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="daysBack" style={{ color: "#2F2A25" }}>
            Nombre de jours en arrière
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#C6A664" }} />
            <Input
              id="daysBack"
              type="number"
              value={daysBack}
              onChange={(e) => setDaysBack(parseInt(e.target.value) || 30)}
              min={1}
              max={365}
              className="pl-10"
              style={{ borderColor: "#E6D9C6" }}
            />
          </div>
          <p className="text-xs" style={{ color: "#2F2A25", opacity: 0.6 }}>
            Rechercher les achats sur les X derniers jours (défaut: 30)
          </p>
        </div>

        <Button
          type="submit"
          disabled={loading || !email}
          className="w-full rounded-full px-6 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
          style={{
            backgroundColor: "#C6A664",
            color: "white",
          }}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Traitement en cours...
            </>
          ) : (
            "Corriger les achats passés"
          )}
        </Button>
      </form>

      {error && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Erreur</AlertTitle>
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <div className="space-y-4">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Traitement terminé</AlertTitle>
            <AlertDescription className="text-green-700">
              {result.message}
            </AlertDescription>
          </Alert>

          <div className="bg-white rounded-2xl border-2 p-6" style={{ borderColor: "#E6D9C6" }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: "#2F2A25" }}>Résumé</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl p-4 border-2" style={{ borderColor: "#E6D9C6", backgroundColor: "#F8F5F0" }}>
                <div className="text-2xl font-bold" style={{ color: "#2F2A25" }}>{result.summary.total_sessions}</div>
                <div className="text-sm" style={{ color: "#2F2A25", opacity: 0.7 }}>Sessions trouvées</div>
              </div>
              <div className="rounded-xl p-4 border-2" style={{ borderColor: "#10b981", backgroundColor: "#F0FDF4" }}>
                <div className="text-2xl font-bold text-green-600">{result.summary.granted}</div>
                <div className="text-sm text-green-700">Accès accordés</div>
              </div>
              <div className="rounded-xl p-4 border-2" style={{ borderColor: "#3b82f6", backgroundColor: "#EFF6FF" }}>
                <div className="text-2xl font-bold text-blue-600">{result.summary.already_exists}</div>
                <div className="text-sm text-blue-700">Déjà existants</div>
              </div>
              <div className="rounded-xl p-4 border-2" style={{ borderColor: "#ef4444", backgroundColor: "#FEF2F2" }}>
                <div className="text-2xl font-bold text-red-600">{result.summary.errors}</div>
                <div className="text-sm text-red-700">Erreurs</div>
              </div>
            </div>
          </div>

          {result.results && result.results.length > 0 && (
            <div className="bg-white rounded-2xl border-2 p-6" style={{ borderColor: "#E6D9C6" }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: "#2F2A25" }}>Détails des actions</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {result.results.map((item: any, index: number) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-2 ${
                      item.status === "granted"
                        ? "bg-green-50 border-green-200"
                        : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium" style={{ color: "#2F2A25" }}>
                          Session: {item.session_id?.substring(0, 20)}...
                        </div>
                        <div className="text-xs mt-1" style={{ color: "#2F2A25", opacity: 0.6 }}>
                          Item: {item.catalog_item_id?.substring(0, 20)}...
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.status === "granted"
                            ? "bg-green-600 text-white"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {item.status === "granted" ? "Accès accordé" : "Déjà existant"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.errors && result.errors.length > 0 && (
            <div className="bg-white rounded-2xl border-2 p-6" style={{ borderColor: "#ef4444" }}>
              <h3 className="text-lg font-semibold mb-4 text-red-600">Erreurs</h3>
              <div className="space-y-2">
                {result.errors.map((err: any, index: number) => (
                  <div key={index} className="p-3 rounded-lg bg-red-50 border-2 border-red-200">
                    <div className="text-sm text-red-800">
                      Session: {err.session_id || "N/A"}
                    </div>
                    <div className="text-xs text-red-600 mt-1">{err.error}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

