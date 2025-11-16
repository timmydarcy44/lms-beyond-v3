import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { SuperAdminShell } from "@/components/super-admin/super-admin-shell";
import { getServiceRoleClient, getServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type QuestionRecord = {
  id: string;
  question_text: string;
  question_type: string;
  order_index: number;
  metadata: Record<string, any> | null;
  likert_scale: Record<string, any> | null;
  options: Record<string, any>[] | null;
  scoring: Record<string, any> | null;
};

export default async function QuestionnaireDetailPage({
  params,
}: {
  params: Promise<{ questionnaireId: string }>;
}) {
  const { questionnaireId } = await params;
  const hasAccess = await isSuperAdmin();
  
  if (!hasAccess) {
    redirect("/dashboard");
  }

  const isSuper = await isSuperAdmin();
  const supabase = isSuper ? getServiceRoleClient() : await getServerClient();
  
  let questionnaire = null;
  if (supabase) {
    const { data } = await supabase
      .from("mental_health_questionnaires")
      .select("id, title, description, frequency, send_day, send_time, target_roles, scoring_config, questions:mental_health_questions(*)")
      .eq("id", questionnaireId)
      .single();
    
    questionnaire = data;
  }

  if (!questionnaire) {
    redirect("/super/premium/beyond-care");
  }

  return (
    <SuperAdminShell
      title={questionnaire.title}
      breadcrumbs={[
        { label: "Super Admin", href: "/super" },
        { label: "Premium", href: "/super/premium" },
        { label: "Beyond Care", href: "/super/premium/beyond-care" },
        { label: questionnaire.title },
      ]}
    >
      <Card>
        <CardHeader>
          <CardTitle>Détails du questionnaire</CardTitle>
          <CardDescription>
            Consultez la configuration du questionnaire et les questions envoyées aux apprenants.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Fréquence</p>
              <p className="text-sm font-medium">{formatFrequency(questionnaire.frequency)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Jour</p>
              <p className="text-sm font-medium">{formatDay(questionnaire.send_day)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Heure</p>
              <p className="text-sm font-medium">{questionnaire.send_time?.slice(0, 5)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Rôles destinataires</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {(questionnaire.target_roles ?? []).map((role: string) => (
                  <Badge key={role} variant="outline">
                    {formatRole(role)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {questionnaire.scoring_config?.categories?.length ? (
            <div className="space-y-3">
              <p className="text-xs uppercase text-muted-foreground">Dimensions / Catégories</p>
              <div className="grid gap-3 md:grid-cols-2">
                {questionnaire.scoring_config.categories.map((category: any) => (
                  <div key={category.name} className="rounded-lg border border-muted px-3 py-2">
                    <p className="text-sm font-semibold">{category.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Questions associées : {category.questions?.length ?? 0}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <Separator />

          <div className="space-y-4">
            <p className="text-xs uppercase text-muted-foreground">Questions ({(questionnaire.questions ?? []).length})</p>
            <div className="space-y-3">
              {(questionnaire.questions ?? []).sort((a: QuestionRecord, b: QuestionRecord) => a.order_index - b.order_index).map((question: QuestionRecord, index: number) => (
                <div key={question.id} className="rounded-lg border border-muted bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <span>{formatQuestionType(question.question_type)}</span>
                        {question.metadata?.dimension ? (
                          <Badge variant="secondary">{question.metadata.dimension}</Badge>
                        ) : null}
                      </div>
                      <p className="text-sm font-medium leading-relaxed">{question.question_text}</p>
                      {question.likert_scale ? (
                        <p className="text-xs text-muted-foreground">
                          Échelle : {question.likert_scale.min} → {question.likert_scale.max}
                        </p>
                      ) : null}
                      {question.options?.length ? (
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          {question.options.map((option) => (
                            <li key={option.id}>
                              {option.label} {option.points != null ? `(${option.points} pts)` : ""}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </SuperAdminShell>
  );
}

function formatFrequency(value?: string) {
  switch (value) {
    case "weekly":
      return "Hebdomadaire";
    case "biweekly":
      return "Bi-hebdomadaire";
    case "monthly":
      return "Mensuel";
    default:
      return value ?? "-";
  }
}

function formatRole(role: string) {
  switch (role) {
    case "learner":
      return "Apprenants";
    case "instructor":
      return "Formateurs";
    case "tutor":
      return "Tuteurs";
    case "admin":
      return "Admins";
    default:
      return role;
  }
}

function formatDay(day?: number) {
  const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  if (typeof day !== "number" || day < 0 || day > 6) return "-";
  return days[day];
}

function formatQuestionType(type?: string) {
  switch (type) {
    case "single_choice":
      return "Choix unique";
    case "multiple_choice":
      return "Choix multiple";
    case "likert":
      return "Échelle de Likert";
    case "text":
      return "Réponse libre";
    case "number":
      return "Valeur numérique";
    default:
      return type ?? "-";
  }
}


