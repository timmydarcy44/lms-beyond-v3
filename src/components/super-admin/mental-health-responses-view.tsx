"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Download, Filter } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type Response = {
  id: string;
  user_id: string;
  question_id: string;
  response_value: string;
  response_data: any;
  created_at: string;
  question: {
    id: string;
    question_text: string;
    question_type: string;
  };
  questionnaire: {
    id: string;
    title: string;
  };
};

type MentalHealthResponsesViewProps = {
  orgId?: string;
  canViewAll?: boolean; // Pour les admins/formateurs qui peuvent voir toutes les réponses
};

export function MentalHealthResponsesView({ orgId, canViewAll = false }: MentalHealthResponsesViewProps) {
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<string>("all");
  const [questionnaires, setQuestionnaires] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    loadResponses();
    loadQuestionnaires();
  }, [orgId, selectedQuestionnaire]);

  const loadQuestionnaires = async () => {
    try {
      const url = orgId
        ? `/api/mental-health/questionnaires?org_id=${orgId}`
        : "/api/mental-health/questionnaires";
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setQuestionnaires(data.questionnaires || []);
      }
    } catch (error) {
      console.error("[mental-health-responses-view] Error loading questionnaires:", error);
    }
  };

  const loadResponses = async () => {
    setLoading(true);
    try {
      let url = "/api/mental-health/responses";
      const params = new URLSearchParams();
      
      if (selectedQuestionnaire !== "all") {
        params.append("questionnaire_id", selectedQuestionnaire);
      }
      
      if (orgId && canViewAll) {
        params.append("org_id", orgId);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setResponses(data.responses || []);
      }
    } catch (error) {
      console.error("[mental-health-responses-view] Error loading responses:", error);
    } finally {
      setLoading(false);
    }
  };

  // Grouper les réponses par questionnaire et par question
  const groupedResponses = responses.reduce((acc, response) => {
    const qId = response.questionnaire.id;
    const questionId = response.question.id;

    if (!acc[qId]) {
      acc[qId] = {
        title: response.questionnaire.title,
        questions: {},
      };
    }

    if (!acc[qId].questions[questionId]) {
      acc[qId].questions[questionId] = {
        question_text: response.question.question_text,
        question_type: response.question.question_type,
        responses: [],
      };
    }

    acc[qId].questions[questionId].responses.push(response);
    return acc;
  }, {} as Record<string, any>);

  // Préparer les données pour les graphiques
  const prepareChartData = (questionResponses: Response[]) => {
    if (questionResponses.length === 0) return [];

    const question = questionResponses[0].question;
    
    if (question.question_type === "likert" || question.question_type === "number") {
      // Pour Likert et nombre, créer un histogramme
      const values = questionResponses.map((r) => {
        const data = typeof r.response_data === "string" ? JSON.parse(r.response_data) : r.response_data;
        return data.value || parseFloat(r.response_value) || 0;
      });

      const counts = values.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      return Object.entries(counts).map(([value, count]) => ({
        value: parseFloat(value),
        count,
      }));
    } else if (question.question_type === "single_choice" || question.question_type === "multiple_choice") {
      // Pour choix unique/multiple, compter les occurrences
      const counts: Record<string, number> = {};

      questionResponses.forEach((r) => {
        const data = typeof r.response_data === "string" ? JSON.parse(r.response_data) : r.response_data;
        const selected = data.selected || [data.value] || [];

        selected.forEach((val: string | number) => {
          counts[val.toString()] = (counts[val.toString()] || 0) + 1;
        });
      });

      return Object.entries(counts).map(([label, count]) => ({
        label,
        count,
      }));
    }

    return [];
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-600">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Réponses aux questionnaires
              </CardTitle>
              <CardDescription>
                {canViewAll ? "Vue d'ensemble des réponses de votre organisation" : "Vos réponses"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedQuestionnaire} onValueChange={setSelectedQuestionnaire}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Filtrer par questionnaire" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les questionnaires</SelectItem>
                  {questionnaires.map((q) => (
                    <SelectItem key={q.id} value={q.id}>
                      {q.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {Object.keys(groupedResponses).length === 0 ? (
            <p className="text-center text-gray-600 py-8">
              Aucune réponse disponible pour le moment.
            </p>
          ) : (
            <Tabs defaultValue={Object.keys(groupedResponses)[0]} className="space-y-4">
              <TabsList>
                {Object.entries(groupedResponses).map(([qId, data]: [string, any]) => (
                  <TabsTrigger key={qId} value={qId}>
                    {data.title}
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.entries(groupedResponses).map(([qId, data]: [string, any]) => (
                <TabsContent key={qId} value={qId} className="space-y-6">
                  {Object.entries(data.questions).map(([questionId, questionData]: [string, any]) => {
                    const chartData = prepareChartData(questionData.responses);

                    return (
                      <Card key={questionId}>
                        <CardHeader>
                          <CardTitle className="text-base">{questionData.question_text}</CardTitle>
                          <CardDescription>
                            {questionData.responses.length} réponse{questionData.responses.length > 1 ? "s" : ""}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey={questionData.question_type === "likert" || questionData.question_type === "number" ? "value" : "label"} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="count" fill="#3b82f6" name="Nombre de réponses" />
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <p className="text-sm text-gray-600">
                              Aucune donnée visualisable pour ce type de question.
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}







