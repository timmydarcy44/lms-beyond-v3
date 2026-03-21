"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, ListChecks, Loader2, PenLine, Pencil, ToggleLeft, X, Zap } from "lucide-react";

interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation?: string;
}

interface GapSentence {
  text: string;
  answer: string;
  hint?: string;
}

interface OpenQuestion {
  question: string;
  expected_answer: string;
}

type QuizHistoryItem = {
  id?: string;
  score?: number | null;
  max_score?: number | null;
  nb_questions?: number | null;
  quiz_type?: string | null;
  created_at?: string | null;
};

const extractJsonPayload = (value: string) => {
  const objectStart = value.indexOf("{");
  const arrayStart = value.indexOf("[");
  const hasObject = objectStart !== -1;
  const hasArray = arrayStart !== -1;
  if (!hasObject && !hasArray) return value.trim();
  const start = hasObject && hasArray ? Math.min(objectStart, arrayStart) : hasObject ? objectStart : arrayStart;
  const isArray = start === arrayStart;
  const end = isArray ? value.lastIndexOf("]") : value.lastIndexOf("}");
  if (end === -1 || end <= start) return value.trim();
  return value.slice(start, end + 1);
};

const safeJsonParse = (value: unknown) => {
  if (typeof value !== "string") return value;
  const cleaned = extractJsonPayload(value);
  return JSON.parse(cleaned);
};

interface QuizViewProps {
  documentId: string;
  accountType: string;
  folderId?: string | null;
  onClose: () => void;
}

export function QuizView({ documentId, accountType, folderId = null, onClose }: QuizViewProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [configStep, setConfigStep] = useState(1);
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState<"Facile" | "Moyen" | "Difficile" | "Expert">("Moyen");
  const [quizType, setQuizType] = useState<"qcm" | "vrai-faux" | "trou" | "open">("qcm");
  const [gapSentences, setGapSentences] = useState<GapSentence[]>([]);
  const [gapIndex, setGapIndex] = useState(0);
  const [gapInput, setGapInput] = useState("");
  const [gapScore, setGapScore] = useState(0);
  const [gapFeedback, setGapFeedback] = useState<{ correct: boolean; answer: string } | null>(null);
  const [openQuestions, setOpenQuestions] = useState<OpenQuestion[]>([]);
  const [openIndex, setOpenIndex] = useState(0);
  const [openScore, setOpenScore] = useState(0);
  const [openFeedback, setOpenFeedback] = useState<{ score: number; feedback: string } | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const answerRef = useRef<HTMLTextAreaElement>(null);
  const [sessionSaved, setSessionSaved] = useState(false);
  const [quizHistory, setQuizHistory] = useState<QuizHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const current = questions[index];
  const total =
    quizType === "trou"
      ? gapSentences.length
      : quizType === "open"
        ? openQuestions.length
        : questions.length;
  const isComplete =
    total > 0 &&
    (quizType === "trou"
      ? gapIndex >= total
      : quizType === "open"
        ? openIndex >= total
        : index >= total);

  useEffect(() => {
    setSelected(null);
    setFeedbackMessage(null);
    setFeedbackLoading(false);
  }, [index]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setHistoryLoading(true);
        const res = await fetch(`/api/nevo/quiz-sessions?document_id=${documentId}`);
        if (!res.ok) return;
        const data = await res.json();
        setQuizHistory(Array.isArray(data?.sessions) ? data.sessions : []);
      } catch {
        setQuizHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    };
    loadHistory();
  }, [documentId]);

  useEffect(() => {
    if (!isComplete || sessionSaved || total === 0) return;
    const saveSession = async () => {
      const finalScore =
        quizType === "trou" ? gapScore : quizType === "open" ? openScore : score;
      const maxScore = quizType === "open" ? total * 20 : total;
      try {
        await fetch("/api/nevo/quiz-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            document_id: documentId,
            folder_id: folderId,
            score: finalScore,
            max_score: maxScore,
            nb_questions: total,
            quiz_type: quizType,
          }),
        });
        setSessionSaved(true);
      } catch {
        // pas bloquant pour l'utilisateur
      }
    };
    saveSession();
  }, [documentId, gapScore, isComplete, openScore, quizType, score, sessionSaved, total]);

  const normalizeAnswer = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const generateQuiz = async () => {
    setLoading(true);
    try {
      const docRes = await fetch("/api/nevo/documents");
      if (!docRes.ok) throw new Error("Impossible de récupérer le document");
      const docData = await docRes.json();
      const doc = docData.documents?.find((d: { id: string; extracted_text: string | null }) => d.id === documentId);
      if (!doc?.extracted_text) {
        toast.error("Aucun texte disponible");
        return;
      }

      const aiRes = await fetch("/api/nevo/ai-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          action: "quiz",
          text: doc.extracted_text,
          options: {
            quiz: { count: questionCount, difficulty, type: quizType },
          },
        }),
      });
      if (!aiRes.ok) throw new Error("Erreur lors de la génération");
      const aiData = await aiRes.json();
      const parsed = safeJsonParse(aiData.result);

      if (quizType === "trou") {
        const sentences: GapSentence[] = Array.isArray(parsed?.sentences)
          ? parsed.sentences
          : Array.isArray(parsed)
            ? parsed
            : [];
        if (!sentences.length) throw new Error("Réponse IA invalide");
        setGapSentences(sentences);
        setGapIndex(0);
        setGapInput("");
        setGapScore(0);
        setGapFeedback(null);
        setSessionSaved(false);
        setQuestions([]);
        setOpenQuestions([]);
        setOpenIndex(0);
        setOpenAnswer("");
        setOpenScore(0);
        setOpenFeedback(null);
      } else if (quizType === "vrai-faux") {
        const items = Array.isArray(parsed) ? parsed : [];
        if (!items.length) throw new Error("Réponse IA invalide");
        const mapped = items.map((item: any) => ({
          question: item.statement || item.question || "",
          options: ["Vrai", "Faux"],
          correct_index: item.answer === true ? 0 : 1,
          explanation: item.justification || "",
        }));
        setQuestions(mapped);
        setIndex(0);
        setScore(0);
        setSelected(null);
        setSessionSaved(false);
        setGapSentences([]);
        setGapIndex(0);
        setGapInput("");
        setGapScore(0);
        setGapFeedback(null);
        if (answerRef.current) answerRef.current.value = "";
        setOpenQuestions([]);
        setOpenIndex(0);
        setOpenScore(0);
        setOpenFeedback(null);
      } else if (quizType === "open") {
        const items: OpenQuestion[] = Array.isArray(parsed?.questions)
          ? parsed.questions
          : Array.isArray(parsed)
            ? parsed
            : [];
        if (!items.length) throw new Error("Réponse IA invalide");
        setOpenQuestions(items);
        setOpenIndex(0);
        if (answerRef.current) answerRef.current.value = "";
        setOpenScore(0);
        setOpenFeedback(null);
        setSessionSaved(false);
        setQuestions([]);
        setGapSentences([]);
        setGapIndex(0);
        setGapInput("");
        setGapScore(0);
        setGapFeedback(null);
      } else {
        const questionsParsed: QuizQuestion[] = Array.isArray(parsed) ? parsed : [];
        if (!questionsParsed.length) throw new Error("Réponse IA invalide");
        setQuestions(questionsParsed);
        setIndex(0);
        setScore(0);
        setSelected(null);
        setSessionSaved(false);
        setGapSentences([]);
        setGapIndex(0);
        setGapInput("");
        setGapScore(0);
        setGapFeedback(null);
        if (answerRef.current) answerRef.current.value = "";
        setOpenQuestions([]);
        setOpenIndex(0);
        setOpenScore(0);
        setOpenFeedback(null);
      }
      toast.success("Quiz généré");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const encouragements = [
    "Excellent réflexe. Continue comme ça !",
    "Solide réponse, tu progresses vite.",
    "Yes ! Tu maîtrises de mieux en mieux.",
    "Parfait, garde ce rythme.",
  ];

  const requestExplanation = async (question: string, expected: string, actual: string) => {
    try {
      setFeedbackLoading(true);
      const aiRes = await fetch("/api/nevo/ai-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          action: "grade-answer",
          text: question,
          options: {
            question,
            expected_answer: expected,
            student_answer: actual,
          },
        }),
      });
      if (!aiRes.ok) throw new Error("Erreur lors de la génération");
      const aiData = await aiRes.json();
      const parsed = safeJsonParse(aiData.result);
      const feedback = typeof parsed?.feedback === "string" ? parsed.feedback : "";
      setFeedbackMessage(feedback || "Retente en pensant au concept clé du cours.");
    } catch {
      setFeedbackMessage("Retente en pensant au concept clé du cours.");
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleSelect = async (choice: number) => {
    if (selected !== null || !current) return;
    setSelected(choice);
    if (choice === current.correct_index) {
      setScore((prev) => prev + 1);
      setFeedbackMessage(encouragements[Math.floor(Math.random() * encouragements.length)]);
      return;
    }
    const expected = current.options?.[current.correct_index] || "Réponse attendue";
    const actual = current.options?.[choice] || "Réponse donnée";
    await requestExplanation(current.question, expected, actual);
  };

  const handleNext = () => {
    if (index >= total - 1) {
      setIndex(total);
      return;
    }
    setIndex((prev) => prev + 1);
  };

  const resetQuiz = () => {
    setIndex(0);
    setScore(0);
    setSelected(null);
    setGapIndex(0);
    setGapScore(0);
    setGapInput("");
    setGapFeedback(null);
    setOpenIndex(0);
    setOpenScore(0);
    setOpenFeedback(null);
    if (answerRef.current) answerRef.current.value = "";
    setSessionSaved(false);
  };

  const scoreMessage =
    (quizType === "trou"
      ? gapScore
      : quizType === "open"
        ? openScore / 20
        : score) >= Math.max(1, Math.ceil(total * 0.7))
      ? "Bien joué ! Encore un peu de révision 💪"
      : "Continue, tu progresses ! 💡";

  const currentStep =
    quizType === "trou" ? gapIndex + 1 : quizType === "open" ? openIndex + 1 : index + 1;

  const isQuestionMode = total > 0 && !isComplete;
  const progressPercent = total > 0 ? (Math.min(currentStep, total) / total) * 100 : 0;

  return (
    <div
      className={`fixed inset-0 z-50 ${
        isQuestionMode
          ? "bg-white text-[#0F1117]"
          : "bg-gradient-to-br from-[#be1354] via-[#F97316] to-[#be1354] text-white"
      }`}
    >
      <div
        className={`flex items-center justify-between px-6 py-4 ${
          isQuestionMode ? "border-b border-[#E8E9F0]" : "border-b border-white/10"
        }`}
        style={{ fontFamily: "SF Pro Display, SF Pro Text, -apple-system, BlinkMacSystemFont, system-ui" }}
      >
        <div className={`text-lg font-semibold ${isQuestionMode ? "text-[#0F1117]" : "text-white"}`}>Quiz</div>
        <div className={`flex items-center gap-4 text-sm ${isQuestionMode ? "text-[#6B7280]" : "text-white/70"}`}>
          <span>{total === 0 ? "0" : Math.min(currentStep, total)}/{total || 5}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className={isQuestionMode ? "text-[#6B7280] hover:text-[#0F1117]" : "text-white/70 hover:text-white"}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
      {isQuestionMode && (
        <div className="h-1 w-full bg-[#E8E9F0]">
          <div className="h-full bg-[#be1354]" style={{ width: `${progressPercent}%` }} />
        </div>
      )}

      <div className="flex flex-col items-center justify-center px-6 py-10 min-h-[70vh]">
        {total === 0 ? (
          <div className="text-center max-w-3xl w-full">
            <p className="text-white/90 text-2xl font-semibold mb-6">Prêt pour un quiz premium ?</p>
            {historyLoading ? (
              <p className="text-white/70 mb-6">Chargement des quiz...</p>
            ) : quizHistory.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {quizHistory.slice(-4).map((session, idx) => {
                  const maxScore = Number(session.max_score || 0);
                  const scoreValue = Number(session.score || 0);
                  const normalized = maxScore > 0 ? Math.round((scoreValue / maxScore) * 20) : 0;
                  return (
                    <div
                      key={`${session.id || idx}`}
                      className="rounded-3xl border border-white/20 bg-white/10 p-5 text-left"
                    >
                      <p className="text-xs uppercase tracking-[0.3em] text-white/70 mb-2">Quiz terminé</p>
                      <p className="text-lg font-semibold text-white mb-1">{normalized}/20</p>
                      <p className="text-sm text-white/70">
                        {session.quiz_type ? `Type : ${session.quiz_type}` : "Type : QCM"}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-white/80 mb-6">Aucun quiz disponible pour l'instant.</p>
            )}
            {accountType !== "child" && (
              <Button
                onClick={() => {
                  setConfigStep(1);
                  setShowOptions(true);
                }}
                disabled={loading}
                className="bg-white text-[#be1354] hover:bg-white/90"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  "Créer un Quiz"
                )}
              </Button>
            )}
          </div>
        ) : isComplete ? (
          <div className="text-center max-w-md">
            {(() => {
              const finalScore =
                quizType === "trou" ? gapScore : quizType === "open" ? openScore : score;
              const maxScore = quizType === "open" ? total * 20 : total;
              const percent = maxScore > 0 ? (finalScore / maxScore) * 100 : 0;
              const color =
                percent > 60 ? "text-emerald-400" : percent > 40 ? "text-orange-400" : "text-rose-400";
              return (
                <>
                  <p className={`text-3xl font-semibold mb-2 ${color}`}>
                    {finalScore}/{maxScore}
                  </p>
                  <p className="text-white/70 mb-6">{scoreMessage}</p>
                </>
              );
            })()}
            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={() => {
                  resetQuiz();
                  generateQuiz();
                }}
                className="bg-[#6D28D9] hover:bg-[#5B21B6] text-white"
              >
                Recommencer
              </Button>
              <Button variant="outline" onClick={onClose} className="border-white/20 text-white hover:bg-white/5">
                Revenir au cours
              </Button>
            </div>
          </div>
        ) : quizType === "trou" ? (
          <div className="w-full max-w-3xl">
            {(() => {
              const currentSentence = gapSentences[gapIndex];
              if (!currentSentence) return null;
              const parts = currentSentence.text.split("___");
              return (
                <div className="space-y-6">
                  <p className="text-3xl md:text-4xl font-extrabold text-center text-[#0F1117]">
                    {parts[0]}
                    <input
                      value={gapInput}
                      onChange={(e) => setGapInput(e.target.value)}
                      disabled={!!gapFeedback}
                      className="mx-2 inline-block min-w-[160px] bg-white border border-[#E8E9F0] rounded-lg px-3 py-2 text-[#0F1117] text-base outline-none focus:border-[#be1354]"
                    />
                    {parts.slice(1).join("___")}
                  </p>
                  {currentSentence.hint && (
                    <p className="text-sm text-[#6B7280] text-center">Indice : {currentSentence.hint}</p>
                  )}
                  {gapFeedback ? (
                    <div className="text-center space-y-3">
                      <p className={gapFeedback.correct ? "text-emerald-600" : "text-rose-600"}>
                        {gapFeedback.correct ? "Excellent ! Continue." : `À retenir : ${gapFeedback.answer}`}
                      </p>
                      <Button
                        onClick={() => {
                          setGapInput("");
                          setGapFeedback(null);
                          if (gapIndex >= gapSentences.length - 1) {
                            setGapIndex(gapSentences.length);
                          } else {
                            setGapIndex((prev) => prev + 1);
                          }
                        }}
                        className="bg-[#be1354] hover:bg-[#a80f4a] text-white"
                      >
                        Question suivante
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Button
                        onClick={() => {
                          const expected = normalizeAnswer(currentSentence.answer);
                          const actual = normalizeAnswer(gapInput);
                          const correct = expected === actual;
                          if (correct) setGapScore((prev) => prev + 1);
                          setGapFeedback({ correct, answer: currentSentence.answer });
                        }}
                        className="bg-[#be1354] hover:bg-[#a80f4a] text-white"
                      >
                        Valider
                      </Button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        ) : quizType === "open" ? (
          <div className="w-full max-w-3xl">
            {(() => {
              const currentQuestion = openQuestions[openIndex];
              if (!currentQuestion) return null;
              return (
                <div className="space-y-6">
                  <p className="text-3xl md:text-4xl font-extrabold text-center text-[#0F1117]">
                    {currentQuestion.question}
                  </p>
                  <textarea
                    ref={answerRef}
                    rows={5}
                    placeholder="Écris ta réponse ici..."
                    className="w-full rounded-2xl bg-white border border-[#E8E9F0] p-4 text-sm text-[#0F1117] outline-none focus:border-[#be1354]"
                  />
                  {openFeedback ? (
                    <div className="text-center space-y-3">
                      <p className="text-[#6B7280] text-sm">{openFeedback.feedback}</p>
                      <Button
                        onClick={() => {
                          if (answerRef.current) answerRef.current.value = "";
                          setOpenFeedback(null);
                          if (openIndex >= openQuestions.length - 1) {
                            setOpenIndex(openQuestions.length);
                          } else {
                            setOpenIndex((prev) => prev + 1);
                          }
                        }}
                        className="bg-[#be1354] hover:bg-[#a80f4a] text-white"
                      >
                        Question suivante
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Button
                        onClick={async () => {
                          const studentAnswer = answerRef.current?.value ?? "";
                          if (!studentAnswer.trim()) {
                            setOpenFeedback({ score: 0, feedback: "Merci d'écrire une réponse." });
                            return;
                          }
                          try {
                            const aiRes = await fetch("/api/nevo/ai-action", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                documentId,
                                action: "grade-answer",
                                text: currentQuestion.question,
                                options: {
                                  question: currentQuestion.question,
                                  expected_answer: currentQuestion.expected_answer,
                                  student_answer: studentAnswer,
                                },
                              }),
                            });
                            if (!aiRes.ok) throw new Error("Erreur lors de la correction");
                            const aiData = await aiRes.json();
                            let parsed = safeJsonParse(aiData.result);
                            const gradeScore =
                              typeof parsed?.score === "number" ? parsed.score : 0;
                            const feedback =
                              typeof parsed?.feedback === "string" ? parsed.feedback : "";
                            setOpenScore((prev) => prev + gradeScore);
                            setOpenFeedback({ score: gradeScore, feedback });
                          } catch (err) {
                            const message =
                              err instanceof Error ? err.message : "Erreur serveur";
                            toast.error(message);
                          }
                        }}
                        className="bg-[#be1354] hover:bg-[#a80f4a] text-white"
                      >
                        Valider
                      </Button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        ) : (
          <div
            className="w-full max-w-2xl max-h-[70vh] overflow-y-auto pb-10"
            style={{ fontFamily: "SF Pro Display, SF Pro Text, -apple-system, BlinkMacSystemFont, system-ui" }}
          >
            <p className="text-2xl font-black tracking-tight text-center mb-8 text-[#0F1117]">
              {current?.question}
            </p>
            <div className="grid grid-cols-1 gap-3">
              {current?.options?.map((option, idx) => {
                const isCorrect = selected !== null && idx === current.correct_index;
                const isWrong = selected !== null && idx === selected && idx !== current.correct_index;
                return (
                  <Button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    className={`w-full justify-start rounded-3xl border border-[#E8E9F0] bg-white text-[#0F1117] hover:bg-[#F8F9FC] py-5 ${
                      isCorrect ? "border-emerald-500 text-emerald-600" : ""
                    } ${isWrong ? "border-rose-500 text-rose-600" : ""}`}
                  >
                    <span className="text-lg md:text-xl font-bold">{option}</span>
                  </Button>
                );
              })}
            </div>
            {selected !== null && (
              <div className="mt-6 text-center">
                <p
                  className={`mb-4 text-lg font-semibold ${
                    selected === current?.correct_index ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {selected === current?.correct_index
                    ? feedbackMessage || "Excellent !"
                    : feedbackLoading
                      ? "Analyse en cours..."
                      : feedbackMessage || "Réponse incorrecte."}
                </p>
                {current?.explanation && selected === current?.correct_index ? (
                  <p className="text-[#6B7280] text-sm mb-4">{current.explanation}</p>
                ) : null}
                <Button onClick={handleNext} className="bg-[#be1354] hover:bg-[#a80f4a] text-white">
                  Question suivante
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {showOptions && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-gradient-to-br from-[#be1354] via-[#F97316] to-[#be1354]">
          <div className="w-full max-w-lg rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl p-6 text-white">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                {configStep > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setConfigStep((prev) => Math.max(1, prev - 1))}
                    className="text-white/70 hover:text-white"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                )}
                <p className="text-lg font-semibold">Configurer le quiz</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowOptions(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex items-center justify-center gap-2 mb-6">
              {[1, 2, 3].map((step) => (
                <span
                  key={step}
                  className={`h-2 w-2 rounded-full ${configStep === step ? "bg-white" : "bg-white/20"}`}
                />
              ))}
            </div>
            {configStep === 1 && (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: "qcm", label: "QCM", icon: ListChecks },
                  { id: "vrai-faux", label: "Vrai / Faux", icon: ToggleLeft },
                  { id: "trou", label: "Textes à trou", icon: PenLine },
                  { id: "open", label: "Réponse libre", icon: Pencil },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      setQuizType(type.id as typeof quizType);
                      setConfigStep(2);
                    }}
                    className="rounded-2xl border border-white/20 bg-white/10 hover:bg-white/20 transition-all p-5 flex flex-col items-center justify-between h-36"
                  >
                    <type.icon className="h-9 w-9 text-white" />
                    <span className="text-base font-semibold text-white">{type.label}</span>
                  </button>
                ))}
              </div>
            )}
            {configStep === 2 && (
              <div className="grid grid-cols-2 gap-4">
                {[5, 10, 15, 20].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => {
                      setQuestionCount(count);
                      setConfigStep(3);
                    }}
                    className="rounded-2xl border border-white/20 bg-white/10 hover:bg-white/20 transition-all p-5 flex flex-col items-center justify-center h-36"
                  >
                    <span className="text-4xl font-bold text-white">{count}</span>
                  </button>
                ))}
              </div>
            )}
            {configStep === 3 && (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { level: "Facile", color: "text-emerald-400", count: 1 },
                  { level: "Moyen", color: "text-blue-400", count: 2 },
                  { level: "Difficile", color: "text-orange-400", count: 3 },
                  { level: "Expert", color: "text-rose-400", count: 4 },
                ].map((item) => (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => {
                      setDifficulty(item.level as typeof difficulty);
                      setShowOptions(false);
                      generateQuiz();
                    }}
                    className="rounded-2xl border border-white/20 bg-white/10 hover:bg-white/20 transition-all p-5 flex flex-col items-center justify-between h-36"
                  >
                    <div className="flex items-center gap-1">
                      {Array.from({ length: item.count }).map((_, idx) => (
                        <Zap key={idx} className={`h-5 w-5 ${item.color}`} />
                      ))}
                    </div>
                    <span className={`text-base font-semibold ${item.color}`}>{item.level}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
