"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useSupabase } from "@/components/providers/supabase-provider";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const signupSchema = z
  .object({
    fullName: z.string().min(2, { message: "Nom trop court" }),
    email: z.string().email({ message: "Email invalide" }),
    password: z.string().min(6, { message: "Mot de passe trop court" }),
    confirmPassword: z.string(),
    type_profil: z.enum(["emploi", "freelance", "reconversion", "alternance"]),
    poste_actuel: z.string().optional(),
    entreprise: z.string().optional(),
    type_contrat: z.string().optional(),
    rythme_teletravail: z.string().optional(),
    tjm: z.string().optional(),
    expertise: z.string().optional(),
    stack_technique: z.string().optional(),
    disponibilite: z.string().optional(),
    langues: z.string().optional(),
    ancien_metier: z.string().optional(),
    metier_vise: z.string().optional(),
    organisme_formation: z.string().optional(),
    echeance: z.string().optional(),
    ecole: z.string().optional(),
    niveau_etude: z.string().optional(),
    rythme_alternance: z.string().optional(),
    date_fin_contrat: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const supabase = useSupabase();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [domainStatus, setDomainStatus] = useState<"idle" | "checking" | "valid" | "invalid" | "generic">("idle");
  const [schoolName, setSchoolName] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      type_profil: "emploi",
      poste_actuel: "",
      entreprise: "",
      type_contrat: "",
      rythme_teletravail: "",
      tjm: "",
      expertise: "",
      stack_technique: "",
      disponibilite: "",
      langues: "",
      ancien_metier: "",
      metier_vise: "",
      organisme_formation: "",
      echeance: "",
      ecole: "",
      niveau_etude: "",
      rythme_alternance: "",
      date_fin_contrat: "",
    },
  });

  const emailValue = form.watch("email");
  const profileType = form.watch("type_profil");

  const validateDomain = async (email: string) => {
    if (!supabase) return;
    const trimmed = email.trim().toLowerCase();
    const domain = trimmed.split("@")[1];
    if (!domain) {
      setDomainStatus("idle");
      setSchoolName(null);
      setSchoolId(null);
      return;
    }
    const genericDomains = ["gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "icloud.com"];
    if (genericDomains.includes(domain)) {
      setDomainStatus("generic");
      setSchoolName(null);
      setSchoolId(null);
      return;
    }
    setDomainStatus("checking");
    const { data, error: schoolError } = await supabase
      .from("schools")
      .select("id, name")
      .contains("email_domains", [domain])
      .maybeSingle();
    if (schoolError || !data) {
      setDomainStatus("invalid");
      setSchoolName(null);
      setSchoolId(null);
      return;
    }
    setDomainStatus("valid");
    setSchoolName(data.name);
    setSchoolId(data.id);
  };

  useEffect(() => {
    if (!emailValue) return;
    const timeout = setTimeout(() => {
      validateDomain(emailValue);
    }, 400);
    return () => clearTimeout(timeout);
  }, [emailValue, supabase]);

  const onSubmit = async (values: SignupFormValues) => {
    setError(null);
    if (!supabase) {
      const message = "Supabase n'est pas configuré.";
      setError(message);
      toast.error(message);
      return;
    }

    const nameParts = values.fullName.trim().split(/\s+/);
    const first_name = nameParts.shift() || "";
    const last_name = nameParts.join(" ") || "";
    const emptyToNull = (value?: string) => {
      const trimmed = String(value ?? "").trim();
      return trimmed ? trimmed : null;
    };
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          first_name,
          last_name,
          role: "apprenant",
        },
      },
    });
    if (signUpError) {
      setError(signUpError.message);
      toast.error(signUpError.message);
      if (signUpError.message.toLowerCase().includes("already registered")) {
        router.push("/login");
      }
      return;
    }

    if (!data.user) {
      const message = "Une erreur est survenue lors de la création du compte";
      setError(message);
      toast.error(message);
      return;
    }

    try {
      const profilePayload = {
        id: data.user.id,
        email: values.email,
        full_name: values.fullName,
        first_name,
        last_name,
        role_type: "apprenant",
        school_id: schoolId,
        type_profil: values.type_profil,
        poste_actuel: values.type_profil === "emploi" ? emptyToNull(values.poste_actuel) : null,
        entreprise: values.type_profil === "emploi" ? emptyToNull(values.entreprise) : null,
        type_contrat: values.type_profil === "emploi" ? emptyToNull(values.type_contrat) : null,
        rythme_teletravail:
          values.type_profil === "emploi" ? emptyToNull(values.rythme_teletravail) : null,
        tjm: values.type_profil === "freelance" ? emptyToNull(values.tjm) : null,
        expertise: values.type_profil === "freelance" ? emptyToNull(values.expertise) : null,
        stack_technique: values.type_profil === "freelance" ? emptyToNull(values.stack_technique) : null,
        disponibilite: values.type_profil === "freelance" ? emptyToNull(values.disponibilite) : null,
        langues: values.type_profil === "freelance" ? emptyToNull(values.langues) : null,
        ancien_metier: values.type_profil === "reconversion" ? emptyToNull(values.ancien_metier) : null,
        metier_vise: values.type_profil === "reconversion" ? emptyToNull(values.metier_vise) : null,
        organisme_formation:
          values.type_profil === "reconversion" ? emptyToNull(values.organisme_formation) : null,
        echeance: values.type_profil === "reconversion" ? emptyToNull(values.echeance) : null,
        ecole: values.type_profil === "alternance" ? emptyToNull(values.ecole) : null,
        niveau_etude: values.type_profil === "alternance" ? emptyToNull(values.niveau_etude) : null,
        rythme_alternance:
          values.type_profil === "alternance" ? emptyToNull(values.rythme_alternance) : null,
        date_fin_contrat:
          values.type_profil === "alternance" ? emptyToNull(values.date_fin_contrat) : null,
      };

      const { error: profileError } = await supabase.from("profiles").upsert(profilePayload, {
        onConflict: "id",
      });
      if (profileError) {
        toast.error(profileError.message);
      }
    } catch (profileInsertError) {
      toast.error("Impossible de créer le profil utilisateur.");
    }

    toast.success("Compte créé. Vérifiez votre email pour confirmer votre compte.");
    window.location.href = "/dashboard/apprenant/test-comportemental-intro";
  };

  const isLoading = form.formState.isSubmitting;
  const isSubmitDisabled = useMemo(
    () => isLoading || domainStatus !== "valid",
    [isLoading, domainStatus]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Créer un compte</CardTitle>
        <CardDescription>
          Rejoignez la plateforme et commencez à apprendre ou enseigner.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom complet</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="vous@example.com"
                      autoComplete="email"
                      {...field}
                      onBlur={(event) => {
                        field.onBlur();
                        validateDomain(event.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                  {domainStatus === "checking" ? (
                    <p className="text-xs text-black/60">Vérification du domaine...</p>
                  ) : null}
                  {domainStatus === "valid" && schoolName ? (
                    <p className="text-xs text-emerald-600">Établissement reconnu : {schoolName}</p>
                  ) : null}
                  {domainStatus === "invalid" ? (
                    <p className="text-xs text-red-600">
                      Votre établissement n'est pas encore partenaire de Beyond Connect.
                    </p>
                  ) : null}
                  {domainStatus === "generic" ? (
                    <p className="text-xs text-red-600">
                      Utilisez un mail académique ou professionnel.
                    </p>
                  ) : null}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type_profil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de profil</FormLabel>
                  <FormControl>
                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      {...field}
                    >
                      <option value="emploi">Emploi</option>
                      <option value="freelance">Freelance</option>
                      <option value="alternance">Alternance</option>
                      <option value="reconversion">Reconversion</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {profileType === "emploi" ? (
              <div className="grid gap-4 rounded-lg border border-border/60 bg-muted/30 p-4">
                <FormField
                  control={form.control}
                  name="poste_actuel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Poste actuel</FormLabel>
                      <FormControl>
                        <Input placeholder="Chargé de projet" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="entreprise"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entreprise</FormLabel>
                      <FormControl>
                        <Input placeholder="Beyond" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type_contrat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de contrat</FormLabel>
                      <FormControl>
                        <Input placeholder="CDI, CDD, Freelance..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rythme_teletravail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rythme télétravail</FormLabel>
                      <FormControl>
                        <Input placeholder="2j / semaine" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : null}
            {profileType === "freelance" ? (
              <div className="grid gap-4 rounded-lg border border-border/60 bg-muted/30 p-4">
                <FormField
                  control={form.control}
                  name="tjm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>TJM</FormLabel>
                      <FormControl>
                        <Input placeholder="450€" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expertise"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expertise (tags)</FormLabel>
                      <FormControl>
                        <Input placeholder="Product, UX, Marketing" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stack_technique"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stack technique</FormLabel>
                      <FormControl>
                        <Input placeholder="React, Node, Figma" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="disponibilite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disponibilité</FormLabel>
                      <FormControl>
                        <select
                          className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          {...field}
                        >
                          <option value="">Choisir</option>
                          <option value="Oui">Oui</option>
                          <option value="Non">Non</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="langues"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Langues</FormLabel>
                      <FormControl>
                        <Input placeholder="FR, EN" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : null}
            {profileType === "reconversion" ? (
              <div className="grid gap-4 rounded-lg border border-border/60 bg-muted/30 p-4">
                <FormField
                  control={form.control}
                  name="ancien_metier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ancien métier</FormLabel>
                      <FormControl>
                        <Input placeholder="Commercial" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="metier_vise"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Métier visé</FormLabel>
                      <FormControl>
                        <Input placeholder="Chef de projet" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="organisme_formation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organisme de formation</FormLabel>
                      <FormControl>
                        <Input placeholder="OpenClassrooms" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="echeance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Échéance</FormLabel>
                      <FormControl>
                        <Input placeholder="Décembre 2026" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : null}
            {profileType === "alternance" ? (
              <div className="grid gap-4 rounded-lg border border-border/60 bg-muted/30 p-4">
                <FormField
                  control={form.control}
                  name="ecole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>École</FormLabel>
                      <FormControl>
                        <Input placeholder="ISPN Le Havre" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="niveau_etude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Niveau d'étude</FormLabel>
                      <FormControl>
                        <Input placeholder="Bac +3" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rythme_alternance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rythme</FormLabel>
                      <FormControl>
                        <Input placeholder="3j / 2j" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date_fin_contrat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de fin de contrat</FormLabel>
                      <FormControl>
                        <Input placeholder="30/09/2026" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : null}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmer le mot de passe</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création en cours
                </>
              ) : (
                "Créer un compte"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          Déjà un compte ? {" "}
          <Link href="/login" className="text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}


