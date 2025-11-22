"use client";

import { useState, useEffect } from "react";
import { Plus, Briefcase, GraduationCap, Award, Code, Languages, Trophy, FileText, Edit2, Trash2, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ExperienceForm } from "./experience-form";

type Experience = {
  id: string;
  title: string;
  company: string;
  description?: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  location?: string;
};

type Education = {
  id: string;
  degree: string;
  institution: string;
  field_of_study?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  is_current: boolean;
  grade?: string;
};

type Skill = {
  id: string;
  name: string;
  category?: string;
  level?: string;
};

type Certification = {
  id: string;
  name: string;
  issuer: string;
  issue_date?: string;
  expiry_date?: string;
  credential_id?: string;
  credential_url?: string;
};

type Project = {
  id: string;
  title: string;
  description?: string;
  url?: string;
  start_date?: string;
  end_date?: string;
  technologies?: string[];
};

type Language = {
  id: string;
  language: string;
  level: string;
};

type TestResult = {
  test_id: string;
  test_title: string;
  score: number;
  status: string;
  completed_at: string;
};

type UserBadge = {
  badge_id: string;
  code: string;
  label: string;
  description?: string;
  earned_at: string;
};

type BeyondConnectPageContentProps = {
  userId: string;
};

export function BeyondConnectPageContent({ userId }: BeyondConnectPageContentProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "experiences" | "education" | "skills" | "certifications" | "projects" | "languages" | "badges" | "tests">("overview");
  
  // Data states
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  
  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, [userId]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadExperiences(),
        loadEducation(),
        loadSkills(),
        loadCertifications(),
        loadProjects(),
        loadLanguages(),
        loadTestResults(),
        loadUserBadges(),
      ]);
    } catch (error) {
      console.error("[beyond-connect] Error loading data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const loadExperiences = async () => {
    try {
      const response = await fetch("/api/beyond-connect/experiences");
      if (response.ok) {
        const data = await response.json();
        setExperiences(data.experiences || []);
      }
    } catch (error) {
      console.error("[beyond-connect] Error loading experiences:", error);
    }
  };

  const loadEducation = async () => {
    try {
      const response = await fetch("/api/beyond-connect/education");
      if (response.ok) {
        const data = await response.json();
        setEducation(data.education || []);
      }
    } catch (error) {
      console.error("[beyond-connect] Error loading education:", error);
    }
  };

  const loadSkills = async () => {
    try {
      const response = await fetch("/api/beyond-connect/skills");
      if (response.ok) {
        const data = await response.json();
        setSkills(data.skills || []);
      }
    } catch (error) {
      console.error("[beyond-connect] Error loading skills:", error);
    }
  };

  const loadCertifications = async () => {
    try {
      const response = await fetch("/api/beyond-connect/certifications");
      if (response.ok) {
        const data = await response.json();
        setCertifications(data.certifications || []);
      }
    } catch (error) {
      console.error("[beyond-connect] Error loading certifications:", error);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await fetch("/api/beyond-connect/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error("[beyond-connect] Error loading projects:", error);
    }
  };

  const loadLanguages = async () => {
    try {
      const response = await fetch("/api/beyond-connect/languages");
      if (response.ok) {
        const data = await response.json();
        setLanguages(data.languages || []);
      }
    } catch (error) {
      console.error("[beyond-connect] Error loading languages:", error);
    }
  };

  const loadTestResults = async () => {
    try {
      const response = await fetch("/api/beyond-connect/test-results");
      if (response.ok) {
        const data = await response.json();
        setTestResults(data.results || []);
      }
    } catch (error) {
      console.error("[beyond-connect] Error loading test results:", error);
    }
  };

  const loadUserBadges = async () => {
    try {
      const response = await fetch("/api/beyond-connect/badges");
      if (response.ok) {
        const data = await response.json();
        setUserBadges(data.badges || []);
      }
    } catch (error) {
      console.error("[beyond-connect] Error loading badges:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            Mon CV numérique
          </h1>
          <p className="text-lg text-gray-600">
            Gérez votre profil professionnel et vos compétences
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex flex-wrap gap-2 border-b border-gray-200 pb-4">
          {[
            { id: "overview", label: "Vue d'ensemble", icon: FileText },
            { id: "experiences", label: "Expériences", icon: Briefcase },
            { id: "education", label: "Formation", icon: GraduationCap },
            { id: "skills", label: "Compétences", icon: Code },
            { id: "certifications", label: "Certifications", icon: Award },
            { id: "projects", label: "Projets", icon: Code },
            { id: "languages", label: "Langues", icon: Languages },
            { id: "badges", label: "Badges", icon: Trophy },
            { id: "tests", label: "Résultats", icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-[#003087] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === "overview" && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border-gray-200 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Briefcase className="h-5 w-5 text-[#003087]" />
                    Expériences
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{experiences.length}</div>
                  <p className="text-sm text-gray-600">expériences professionnelles</p>
                </CardContent>
              </Card>

              <Card className="border-gray-200 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <GraduationCap className="h-5 w-5 text-[#003087]" />
                    Formation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{education.length}</div>
                  <p className="text-sm text-gray-600">diplômes et formations</p>
                </CardContent>
              </Card>

              <Card className="border-gray-200 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Code className="h-5 w-5 text-[#003087]" />
                    Compétences
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{skills.length}</div>
                  <p className="text-sm text-gray-600">compétences déclarées</p>
                </CardContent>
              </Card>

              <Card className="border-gray-200 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Award className="h-5 w-5 text-[#003087]" />
                    Certifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{certifications.length}</div>
                  <p className="text-sm text-gray-600">certifications obtenues</p>
                </CardContent>
              </Card>

              <Card className="border-gray-200 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Trophy className="h-5 w-5 text-[#003087]" />
                    Badges
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{userBadges.length}</div>
                  <p className="text-sm text-gray-600">badges obtenus</p>
                </CardContent>
              </Card>

              <Card className="border-gray-200 bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <FileText className="h-5 w-5 text-[#003087]" />
                    Tests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{testResults.length}</div>
                  <p className="text-sm text-gray-600">tests complétés</p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "experiences" && (
            <ExperiencesSection
              experiences={experiences}
              onRefresh={loadExperiences}
              editingId={editingId}
              setEditingId={setEditingId}
            />
          )}

          {activeTab === "education" && (
            <EducationSection
              education={education}
              onRefresh={loadEducation}
              editingId={editingId}
              setEditingId={setEditingId}
            />
          )}

          {activeTab === "skills" && (
            <SkillsSection
              skills={skills}
              onRefresh={loadSkills}
              editingId={editingId}
              setEditingId={setEditingId}
            />
          )}

          {activeTab === "certifications" && (
            <CertificationsSection
              certifications={certifications}
              onRefresh={loadCertifications}
              editingId={editingId}
              setEditingId={setEditingId}
            />
          )}

          {activeTab === "projects" && (
            <ProjectsSection
              projects={projects}
              onRefresh={loadProjects}
              editingId={editingId}
              setEditingId={setEditingId}
            />
          )}

          {activeTab === "languages" && (
            <LanguagesSection
              languages={languages}
              onRefresh={loadLanguages}
              editingId={editingId}
              setEditingId={setEditingId}
            />
          )}

          {activeTab === "badges" && (
            <BadgesSection badges={userBadges} />
          )}

          {activeTab === "tests" && (
            <TestsSection results={testResults} />
          )}
        </div>
      </div>

    </div>
  );
}

// Sections components
function ExperiencesSection({ experiences, onRefresh, editingId, setEditingId }: any) {
  const [showForm, setShowForm] = useState(false);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette expérience ?")) return;

    try {
      const response = await fetch(`/api/beyond-connect/experiences/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erreur lors de la suppression");

      toast.success("Expérience supprimée");
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression");
    }
  };

  const handleEdit = (exp: Experience) => {
    setEditingExperience(exp);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingExperience(null);
    setShowForm(true);
  };

  const handleFormSave = () => {
    setShowForm(false);
    setEditingExperience(null);
    onRefresh();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingExperience(null);
  };

  return (
    <div className="space-y-4">
      {showForm ? (
        <ExperienceForm
          experience={editingExperience || undefined}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
        />
      ) : (
        <Card className="border-gray-200 bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900">Expériences professionnelles</CardTitle>
              <Button onClick={handleAdd} className="bg-[#003087] hover:bg-[#002a6b] text-white">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {experiences.length === 0 ? (
              <p className="text-gray-600">Aucune expérience ajoutée</p>
            ) : (
              <div className="space-y-4">
                {experiences.map((exp: Experience) => (
                  <div key={exp.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{exp.title}</h3>
                        <p className="text-gray-700">{exp.company}</p>
                        {exp.location && <p className="text-sm text-gray-600">{exp.location}</p>}
                        <p className="mt-1 text-sm text-gray-600">
                          {new Date(exp.start_date).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })} -{" "}
                          {exp.is_current
                            ? "Aujourd'hui"
                            : exp.end_date
                            ? new Date(exp.end_date).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
                            : ""}
                        </p>
                        {exp.description && <p className="mt-2 text-sm text-gray-700">{exp.description}</p>}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(exp)} className="text-[#003087] hover:bg-gray-100">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(exp.id!)} className="text-red-600 hover:bg-gray-100">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EducationSection({ education, onRefresh, editingId, setEditingId }: any) {
  return (
    <Card className="border-gray-200 bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-900">Formation et diplômes</CardTitle>
          <Button className="bg-[#003087] hover:bg-[#002a6b] text-white">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {education.length === 0 ? (
          <p className="text-gray-600">Aucune formation ajoutée</p>
        ) : (
          <div className="space-y-4">
            {education.map((edu: Education) => (
              <div key={edu.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="font-semibold text-gray-900">{edu.degree}</h3>
                <p className="text-gray-700">{edu.institution}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SkillsSection({ skills, onRefresh, editingId, setEditingId }: any) {
  return (
    <Card className="border-gray-200 bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-900">Compétences</CardTitle>
          <Button className="bg-[#003087] hover:bg-[#002a6b] text-white">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {skills.length === 0 ? (
          <p className="text-gray-600">Aucune compétence ajoutée</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill: Skill) => (
              <Badge key={skill.id} variant="secondary" className="bg-[#003087] text-white">
                {skill.name}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CertificationsSection({ certifications, onRefresh, editingId, setEditingId }: any) {
  return (
    <Card className="border-gray-200 bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-900">Certifications</CardTitle>
          <Button className="bg-[#003087] hover:bg-[#002a6b] text-white">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {certifications.length === 0 ? (
          <p className="text-gray-600">Aucune certification ajoutée</p>
        ) : (
          <div className="space-y-4">
            {certifications.map((cert: Certification) => (
              <div key={cert.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="font-semibold text-gray-900">{cert.name}</h3>
                <p className="text-gray-700">{cert.issuer}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProjectsSection({ projects, onRefresh, editingId, setEditingId }: any) {
  return (
    <Card className="border-gray-200 bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-900">Projets</CardTitle>
          <Button className="bg-[#003087] hover:bg-[#002a6b] text-white">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <p className="text-gray-600">Aucun projet ajouté</p>
        ) : (
          <div className="space-y-4">
            {projects.map((project: Project) => (
              <div key={project.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="font-semibold text-gray-900">{project.title}</h3>
                {project.description && <p className="text-gray-700">{project.description}</p>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LanguagesSection({ languages, onRefresh, editingId, setEditingId }: any) {
  return (
    <Card className="border-gray-200 bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-900">Langues</CardTitle>
          <Button className="bg-[#003087] hover:bg-[#002a6b] text-white">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {languages.length === 0 ? (
          <p className="text-gray-600">Aucune langue ajoutée</p>
        ) : (
          <div className="space-y-4">
            {languages.map((lang: Language) => (
              <div key={lang.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">{lang.language}</span>
                  <Badge variant="secondary" className="bg-[#003087] text-white">
                    {lang.level}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BadgesSection({ badges }: { badges: UserBadge[] }) {
  return (
    <Card className="border-gray-200 bg-white">
      <CardHeader>
        <CardTitle className="text-gray-900">Open Badges</CardTitle>
      </CardHeader>
      <CardContent>
        {badges.length === 0 ? (
          <p className="text-gray-600">Aucun badge obtenu</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {badges.map((badge) => (
              <div key={badge.badge_id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <Trophy className="mb-2 h-8 w-8 text-[#003087]" />
                <h3 className="font-semibold text-gray-900">{badge.label}</h3>
                {badge.description && <p className="mt-1 text-sm text-gray-700">{badge.description}</p>}
                <p className="mt-2 text-xs text-gray-600">
                  Obtenu le {new Date(badge.earned_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TestsSection({ results }: { results: TestResult[] }) {
  return (
    <Card className="border-gray-200 bg-white">
      <CardHeader>
        <CardTitle className="text-gray-900">Résultats des tests</CardTitle>
      </CardHeader>
      <CardContent>
        {results.length === 0 ? (
          <p className="text-gray-600">Aucun test complété</p>
        ) : (
          <div className="space-y-4">
            {results.map((result) => (
              <div key={result.test_id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{result.test_title}</h3>
                    <p className="text-sm text-gray-700">
                      Complété le {new Date(result.completed_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-green-600 text-white">
                    {result.score}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

