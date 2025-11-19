"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  Loader2,
  User,
  Mail,
  Lock,
  BookOpen,
  Award,
  FileText,
  CheckCircle2,
  Trophy,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  PasswordStrengthIndicator,
  calculatePasswordStrength,
} from "@/components/ui/password-strength-indicator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserRole } from "@/hooks/use-user-role";
import { databaseToFrontendRole, type DatabaseRole } from "@/lib/utils/role-mapping";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";

const profileSchema = z.object({
  firstName: z.string().min(1, { message: "Le prénom est requis" }),
  lastName: z.string().min(1, { message: "Le nom est requis" }),
  email: z.string().email({ message: "Email invalide" }),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: "Le mot de passe actuel est requis" }),
    newPassword: z
      .string()
      .min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" })
      .refine(
        (password) => {
          const strength = calculatePasswordStrength(password);
          return (
            strength.meetsRequirements.minLength &&
            strength.meetsRequirements.hasNumber &&
            strength.meetsRequirements.hasSpecialChar
          );
        },
        {
          message:
            "Le mot de passe doit contenir au moins 6 caractères, un chiffre et un caractère spécial",
        }
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type ProfileFormValues = z.infer<typeof profileSchema>;
type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

interface CourseProgress {
  id: string;
  course_id: string;
  title: string;
  cover_image?: string;
  progress_percentage: number;
  last_accessed_at?: string;
}

interface TestResult {
  id: string;
  test_id: string;
  title: string;
  score: number;
  max_score?: number;
  percentage?: number;
  completed_at: string;
}

interface UserBadge {
  id: string;
  badge_id: string;
  title: string;
  description?: string;
  image_url?: string;
  earned_at: string;
}

export default function AccountOverview() {
  const supabase = useSupabase();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const { data: userRoleDB } = useUserRole();
  const isLight = resolvedTheme === "light";
  const isApprenant =
    userRoleDB && databaseToFrontendRole(userRoleDB as DatabaseRole) === "apprenant";

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  } | null>(null);

  // Données spécifiques aux apprenants
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  const passwordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPasswordValue = passwordForm.watch("newPassword");

  // Classes CSS conditionnelles selon le thème
  const cardClass = cn(
    "rounded-xl border transition-colors",
    isLight
      ? "border-slate-200 bg-white text-slate-900 shadow-sm"
      : "border-white/10 bg-white/5 text-white"
  );

  const textPrimaryClass = isLight ? "text-slate-900" : "text-white";
  const textSecondaryClass = isLight ? "text-slate-600" : "text-white/60";
  const textMutedClass = isLight ? "text-slate-500" : "text-white/50";
  const borderClass = isLight ? "border-slate-200" : "border-white/10";
  const inputClass = cn(
    "pl-10",
    isLight
      ? "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-slate-400"
      : "border-white/20 bg-white/5 text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10"
  );
  const iconClass = isLight ? "text-slate-400" : "text-white/40";

  useEffect(() => {
    const fetchUserData = async () => {
      if (!supabase) return;

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email, role")
          .eq("id", user.id)
          .single();

        if (profile) {
          const fullName = profile.full_name || "";
          const nameParts = fullName.split(" ");
          const firstName = nameParts[0] || "";
          const lastName = nameParts.slice(1).join(" ") || "";

          const roleLabel =
            userRoleDB && databaseToFrontendRole(userRoleDB as DatabaseRole) === "formateur"
              ? "Formateur"
              : userRoleDB && databaseToFrontendRole(userRoleDB as DatabaseRole) === "admin"
                ? "Administrateur"
                : userRoleDB && databaseToFrontendRole(userRoleDB as DatabaseRole) === "tuteur"
                  ? "Tuteur"
                  : "Apprenant";

          setUserData({
            firstName,
            lastName,
            email: profile.email || user.email || "",
            role: roleLabel,
          });

          profileForm.reset({
            firstName,
            lastName,
            email: profile.email || user.email || "",
          });
        }

        // Charger les données spécifiques aux apprenants
        if (isApprenant) {
          await fetchLearnerData(user.id);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [supabase, router, profileForm, userRoleDB, isApprenant]);

  const fetchLearnerData = async (userId: string) => {
    if (!supabase) return;
    setLoadingData(true);

    try {
      // Récupérer les formations avec progression
      const { data: progressData } = await supabase
        .from("course_progress")
        .select(
          `
          id,
          course_id,
          progress_percentage,
          last_accessed_at,
          courses (
            id,
            title,
            cover_image,
            slug
          )
        `
        )
        .eq("user_id", userId)
        .order("last_accessed_at", { ascending: false })
        .limit(10);

      if (progressData) {
        const coursesData: CourseProgress[] = progressData.map((p: any) => ({
          id: p.id,
          course_id: p.course_id,
          title: p.courses?.title || "Formation sans titre",
          cover_image: p.courses?.cover_image,
          progress_percentage: p.progress_percentage || 0,
          last_accessed_at: p.last_accessed_at,
        }));
        setCourses(coursesData);
      }

      // Récupérer les résultats de tests
      const { data: testData } = await supabase
        .from("test_attempts")
        .select(
          `
          id,
          test_id,
          total_score,
          max_score,
          percentage,
          completed_at,
          tests (
            id,
            title
          )
        `
        )
        .eq("user_id", userId)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(10);

      if (testData) {
        const results: TestResult[] = testData.map((t: any) => ({
          id: t.id,
          test_id: t.test_id,
          title: t.tests?.title || "Test sans titre",
          score: t.total_score || 0,
          max_score: t.max_score,
          percentage: t.percentage || (t.max_score ? Math.round((t.total_score / t.max_score) * 100) : 0),
          completed_at: t.completed_at,
        }));
        setTestResults(results);
      }

      // Récupérer les badges (si la table existe)
      try {
        const { data: badgeData } = await supabase
          .from("user_badges")
          .select(
            `
            id,
            badge_id,
            earned_at,
            open_badges (
              id,
              title,
              description,
              image_url
            )
          `
          )
          .eq("user_id", userId)
          .order("earned_at", { ascending: false })
          .limit(10);

        if (badgeData) {
          const badgesData: UserBadge[] = badgeData.map((b: any) => ({
            id: b.id,
            badge_id: b.badge_id,
            title: b.open_badges?.title || "Badge",
            description: b.open_badges?.description,
            image_url: b.open_badges?.image_url,
            earned_at: b.earned_at,
          }));
          setBadges(badgesData);
        }
      } catch (error) {
        // La table user_badges n'existe peut-être pas encore
        console.log("Badges table not available:", error);
      }
    } catch (error) {
      console.error("Error fetching learner data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const onProfileSubmit = async (values: ProfileFormValues) => {
    if (!supabase) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Session expirée");
        return;
      }

      const fullName = `${values.firstName} ${values.lastName}`.trim();

      // Mettre à jour le profil
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          email: values.email,
        })
        .eq("id", user.id);

      if (profileError) {
        throw profileError;
      }

      // Mettre à jour l'email dans auth si nécessaire
      if (values.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: values.email,
        });

        if (emailError) {
          throw emailError;
        }
      }

      toast.success("Profil mis à jour avec succès");
      setUserData({
        ...userData!,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Erreur lors de la mise à jour du profil");
    }
  };

  const onPasswordSubmit = async (values: ChangePasswordFormValues) => {
    if (!supabase) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        toast.error("Session expirée");
        return;
      }

      // Vérifier le mot de passe actuel
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: values.currentPassword,
      });

      if (signInError) {
        toast.error("Mot de passe actuel incorrect");
        return;
      }

      // Mettre à jour le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      toast.success("Mot de passe mis à jour avec succès");
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast.error(error.message || "Erreur lors de la mise à jour du mot de passe");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className={cn("h-8 w-8 animate-spin", isLight ? "text-slate-400" : "text-white/60")} />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className={cn("rounded-xl border p-6 text-center", cardClass, textSecondaryClass)}>
        Impossible de charger les données utilisateur
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList
          className={cn(
            "grid w-full max-w-md grid-cols-2",
            isLight ? "bg-slate-100" : "bg-white/5"
          )}
        >
          <TabsTrigger
            value="profile"
            className={cn(
              isLight
                ? "data-[state=active]:bg-white data-[state=active]:text-slate-900 text-slate-600"
                : "data-[state=active]:text-white text-white/70"
            )}
          >
            Profil
          </TabsTrigger>
          <TabsTrigger
            value="password"
            className={cn(
              isLight
                ? "data-[state=active]:bg-white data-[state=active]:text-slate-900 text-slate-600"
                : "data-[state=active]:text-white text-white/70"
            )}
          >
            Mot de passe
          </TabsTrigger>
          {isApprenant && (
            <TabsTrigger
              value="achievements"
              className={cn(
                isLight
                  ? "data-[state=active]:bg-white data-[state=active]:text-slate-900 text-slate-600"
                  : "data-[state=active]:text-white text-white/70"
              )}
            >
              Réalisations
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card className={cardClass}>
            <CardHeader>
              <CardTitle className={textPrimaryClass}>Informations personnelles</CardTitle>
              <CardDescription className={textSecondaryClass}>
                Gérez vos informations de profil et votre adresse email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form
                  onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-4 pb-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-2xl font-semibold text-white">
                      {userData.firstName.charAt(0).toUpperCase()}
                      {userData.lastName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className={cn("text-lg font-semibold", textPrimaryClass)}>
                        {userData.firstName} {userData.lastName}
                      </p>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "mt-1",
                          isLight ? "bg-slate-100 text-slate-700" : "bg-white/10 text-white/70"
                        )}
                      >
                        {userData.role}
                      </Badge>
                    </div>
                  </div>

                  <Separator className={borderClass} />

                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={textPrimaryClass}>Prénom</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className={cn("absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", iconClass)} />
                              <Input className={inputClass} {...field} />
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={textPrimaryClass}>Nom</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className={cn("absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", iconClass)} />
                              <Input className={inputClass} {...field} />
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={textPrimaryClass}>Adresse email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className={cn("absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", iconClass)} />
                            <Input type="email" className={inputClass} {...field} />
                          </div>
                        </FormControl>
                        <FormDescription className={textMutedClass}>
                          Vous recevrez un email de confirmation si vous changez votre adresse
                        </FormDescription>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white hover:from-blue-700 hover:via-blue-600 hover:to-cyan-600"
                    disabled={profileForm.formState.isSubmitting}
                  >
                    {profileForm.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      "Enregistrer les modifications"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password" className="mt-6">
          <Card className={cardClass}>
            <CardHeader>
              <CardTitle className={textPrimaryClass}>Changer le mot de passe</CardTitle>
              <CardDescription className={textSecondaryClass}>
                Assurez-vous d&apos;utiliser un mot de passe fort et unique
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form
                  onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={textPrimaryClass}>Mot de passe actuel</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className={cn("absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", iconClass)} />
                            <Input type="password" className={inputClass} {...field} />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <Separator className={borderClass} />

                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={textPrimaryClass}>Nouveau mot de passe</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className={cn("absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", iconClass)} />
                            <Input type="password" className={inputClass} {...field} />
                          </div>
                        </FormControl>
                        {newPasswordValue && (
                          <PasswordStrengthIndicator password={newPasswordValue} />
                        )}
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={textPrimaryClass}>
                          Confirmer le nouveau mot de passe
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className={cn("absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", iconClass)} />
                            <Input type="password" className={inputClass} {...field} />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white hover:from-blue-700 hover:via-blue-600 hover:to-cyan-600"
                    disabled={passwordForm.formState.isSubmitting}
                  >
                    {passwordForm.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Mise à jour...
                      </>
                    ) : (
                      "Mettre à jour le mot de passe"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {isApprenant && (
          <TabsContent value="achievements" className="mt-6 space-y-6">
            {/* Formations */}
            <Card className={cardClass}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BookOpen className={cn("h-5 w-5", textPrimaryClass)} />
                  <CardTitle className={textPrimaryClass}>Mes formations</CardTitle>
                </div>
                <CardDescription className={textSecondaryClass}>
                  Suivez votre progression dans vos formations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className={cn("h-6 w-6 animate-spin", textSecondaryClass)} />
                  </div>
                ) : courses.length > 0 ? (
                  <div className="space-y-4">
                    {courses.map((course) => (
                      <Link
                        key={course.id}
                        href={`/catalog/formations/${course.course_id}`}
                        className={cn(
                          "block rounded-lg border p-4 transition-all hover:shadow-md",
                          isLight
                            ? "border-slate-200 bg-slate-50 hover:bg-slate-100"
                            : "border-white/10 bg-white/5 hover:bg-white/10"
                        )}
                      >
                        <div className="flex items-start gap-4">
                          {course.cover_image && (
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                              <Image
                                src={course.cover_image}
                                alt={course.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className={cn("font-semibold mb-1", textPrimaryClass)}>
                              {course.title}
                            </h3>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className={textSecondaryClass}>Progression</span>
                                <span className={cn("font-medium", textPrimaryClass)}>
                                  {course.progress_percentage}%
                                </span>
                              </div>
                              <Progress
                                value={course.progress_percentage}
                                className="h-2"
                                indicatorClassName={isLight ? "bg-blue-600" : "bg-blue-500"}
                              />
                              {course.last_accessed_at && (
                                <p className={cn("text-xs", textMutedClass)}>
                                  Dernière visite{" "}
                                  {formatDistanceToNow(new Date(course.last_accessed_at), {
                                    addSuffix: true,
                                    locale: fr,
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className={cn("text-center py-8", textSecondaryClass)}>
                    Aucune formation en cours
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Badges */}
            <Card className={cardClass}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Award className={cn("h-5 w-5", textPrimaryClass)} />
                  <CardTitle className={textPrimaryClass}>Mes badges</CardTitle>
                </div>
                <CardDescription className={textSecondaryClass}>
                  Les badges que vous avez obtenus
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className={cn("h-6 w-6 animate-spin", textSecondaryClass)} />
                  </div>
                ) : badges.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {badges.map((badge) => (
                      <div
                        key={badge.id}
                        className={cn(
                          "rounded-lg border p-4 text-center",
                          isLight
                            ? "border-slate-200 bg-slate-50"
                            : "border-white/10 bg-white/5"
                        )}
                      >
                        {badge.image_url ? (
                          <div className="relative mx-auto mb-3 h-20 w-20">
                            <Image
                              src={badge.image_url}
                              alt={badge.title}
                              fill
                              className="object-contain"
                            />
                          </div>
                        ) : (
                          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500">
                            <Trophy className="h-10 w-10 text-white" />
                          </div>
                        )}
                        <h3 className={cn("font-semibold mb-1", textPrimaryClass)}>
                          {badge.title}
                        </h3>
                        {badge.description && (
                          <p className={cn("text-sm mb-2", textSecondaryClass)}>
                            {badge.description}
                          </p>
                        )}
                        <p className={cn("text-xs", textMutedClass)}>
                          Obtenu{" "}
                          {formatDistanceToNow(new Date(badge.earned_at), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={cn("text-center py-8", textSecondaryClass)}>
                    Aucun badge obtenu pour le moment
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Résultats de tests */}
            <Card className={cardClass}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className={cn("h-5 w-5", textPrimaryClass)} />
                  <CardTitle className={textPrimaryClass}>Mes résultats de tests</CardTitle>
                </div>
                <CardDescription className={textSecondaryClass}>
                  Historique de vos évaluations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className={cn("h-6 w-6 animate-spin", textSecondaryClass)} />
                  </div>
                ) : testResults.length > 0 ? (
                  <div className="space-y-4">
                    {testResults.map((result) => (
                      <div
                        key={result.id}
                        className={cn(
                          "rounded-lg border p-4",
                          isLight
                            ? "border-slate-200 bg-slate-50"
                            : "border-white/10 bg-white/5"
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className={cn("font-semibold mb-2", textPrimaryClass)}>
                              {result.title}
                            </h3>
                            <div className="flex items-center gap-4 text-sm">
                              <div>
                                <span className={textSecondaryClass}>Score: </span>
                                <span className={cn("font-medium", textPrimaryClass)}>
                                  {result.score}
                                  {result.max_score && ` / ${result.max_score}`}
                                </span>
                              </div>
                              {result.percentage !== undefined && (
                                <div>
                                  <span className={textSecondaryClass}>Pourcentage: </span>
                                  <span className={cn("font-medium", textPrimaryClass)}>
                                    {result.percentage}%
                                  </span>
                                </div>
                              )}
                            </div>
                            <p className={cn("text-xs mt-2", textMutedClass)}>
                              Complété{" "}
                              {formatDistanceToNow(new Date(result.completed_at), {
                                addSuffix: true,
                                locale: fr,
                              })}
                            </p>
                          </div>
                          <div
                            className={cn(
                              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
                              result.percentage !== undefined && result.percentage >= 70
                                ? "bg-green-500/20 text-green-600 dark:text-green-400"
                                : result.percentage !== undefined && result.percentage >= 50
                                  ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                                  : "bg-red-500/20 text-red-600 dark:text-red-400"
                            )}
                          >
                            <CheckCircle2 className="h-6 w-6" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={cn("text-center py-8", textSecondaryClass)}>
                    Aucun test complété pour le moment
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
