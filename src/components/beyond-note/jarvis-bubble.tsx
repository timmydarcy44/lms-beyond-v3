"use client";
import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Mic, Send } from "lucide-react";

type JarvisAction =
  | "quiz"
  | "revision-sheet"
  | "reformulate"
  | "diagram"
  | "translate"
  | "flashcards"
  | "audio";

interface NeoBubbleProps {
  extractedText: string;
  documentTitle?: string;
  documents?: { id: string; file_name: string; extracted_text?: string }[];
  onOpenDocument?: (id: string) => void;
  context?: "library" | "document";
  onAction?: (action: JarvisAction) => void;
}

export function NeoBubble({
  extractedText,
  documentTitle,
  documents,
  onOpenDocument,
  context,
  onAction,
}: NeoBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Bonjour, je suis Neo, ton assistant d'apprentissage." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isConversationMode, setIsConversationMode] = useState(false);
  const isConversationModeRef = useRef(false);
  const isMobileRef = useRef(false);
  const wakeWordRef = useRef<any>(null);
  const isWakeWordActiveRef = useRef(false);
  const [isWakeWordActive, setIsWakeWordActive] = useState(false);

  const cleanForSpeech = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/#{1,6}\s/g, "")
      .replace(/\d+\.\s/g, "")
      .replace(/[-•]\s/g, "")
      .replace(/\n+/g, ". ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const safeStart = (recognition: any) => {
    try {
      recognition.start();
    } catch (e: any) {
      if (e?.name !== "InvalidStateError") throw e;
      // Déjà démarré, ignorer
    }
  };

  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join("");
      if (e.results[e.results.length - 1].isFinal) {
        const finalTranscript = transcript;
        setInput(finalTranscript);
        setIsListening(false);
        setTimeout(() => sendMessage(finalTranscript), 300);
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    safeStart(recognition);
    setIsListening(true);
  };

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanForSpeech(text));
    utterance.lang = "fr-FR";
    utterance.rate = 1.1;
    utterance.pitch = 1.05;
    const voices = window.speechSynthesis.getVoices();
    const frVoice =
      voices.find((v) => v.lang === "fr-FR" && v.name.includes("Google")) ||
      voices.find((v) => v.lang.startsWith("fr"));
    if (frVoice) utterance.voice = frVoice;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (isConversationModeRef.current) {
        setTimeout(() => startListening(), 300);
      }
    };
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    if (isConversationModeRef.current) {
      setTimeout(() => startListening(), 200);
    }
  };

  const toggleConversationMode = () => {
    const newValue = !isConversationModeRef.current;
    isConversationModeRef.current = newValue;
    setIsConversationMode(newValue);
    if (newValue) {
      startListening();
    } else {
      stopSpeaking();
      setIsListening(false);
    }
  };

  const handleVoiceCommand = async (command: string): Promise<boolean> => {
    console.log("[Neo] handleVoiceCommand called with:", command);
    const lower = command.toLowerCase();

    const isSearchIntent =
      lower.includes("ouvre") ||
      lower.includes("affiche") ||
      lower.includes("montre") ||
      lower.includes("trouve") ||
      lower.includes("cherche") ||
      lower.includes("retrouve") ||
      lower.includes("où est") ||
      lower.includes("tu as");

    console.log("[Neo] documents count:", documents?.length);
    console.log("[Neo] isSearchIntent:", isSearchIntent);
    if (!isSearchIntent || !documents?.length) return false;

    const searchTerm = lower
      .replace(
        /ouvre|ouvrir|affiche|montre|trouve|cherche|retrouve|où est|tu as|le cours|le fichier|de|moi|pour|s'il te plaît|stp|est-ce que tu peux|tu peux|un cours|une note|un document|sur|dans lequel|il y a|du contenu|avec|qui parle|j'ai|j'arrive|pas à|le ressortir|remettre la main|dessus|dedans/gi,
        ""
      )
      .replace(/\s+/g, " ")
      .trim();

    console.log("[Neo] searching for:", searchTerm);

    const words = searchTerm.split(" ").filter((w) => w.length > 2);
    const nameMatch = documents.find((d) => {
      const name = d.file_name.toLowerCase();
      return words.some((w) => name.includes(w)) || name.includes(searchTerm);
    });

    if (nameMatch && onOpenDocument) {
      const response = `J'ouvre ${nameMatch.file_name} pour toi !`;
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      speak(response);
      setTimeout(() => onOpenDocument(nameMatch.id), 1500);
      return true;
    }

    const contentMatch = documents.find((d) => {
      const text = (d.extracted_text || "").toLowerCase();
      return words.some((w) => text.includes(w));
    });

    if (contentMatch && onOpenDocument) {
      const response = `J'ai trouvé quelque chose dans "${contentMatch.file_name}" qui correspond à ta recherche !`;
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      speak(response);
      setTimeout(() => onOpenDocument(contentMatch.id), 1500);
      return true;
    }

    if (searchTerm.length > 3) {
      setLoading(true);
      try {
        const docSummaries = documents
          .map(
            (d) =>
              `ID: ${d.id} | Titre: ${d.file_name} | Contenu: ${d.extracted_text?.slice(0, 200) || ""}`
          )
          .join("\n");

        const res = await fetch("/api/nevo/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: `Parmi ces documents, lequel correspond le mieux à "${searchTerm}" ? Réponds UNIQUEMENT avec l'ID du document le plus pertinent, rien d'autre. Si aucun ne correspond, réponds "null".\n\n${docSummaries}`,
              },
            ],
            extractedText: "",
            context: "search",
          }),
        });
        const data = await res.json();
        const foundId = data.response?.trim();

        if (foundId && foundId !== "null") {
          const match = documents.find((d) => d.id === foundId);
          if (match && onOpenDocument) {
            const response = `J'ai trouvé ! C'est dans "${match.file_name}". Je t'y emmène !`;
            setMessages((prev) => [...prev, { role: "assistant", content: response }]);
            speak(response);
            setTimeout(() => onOpenDocument(match.id), 1500);
            return true;
          }
        }
      } catch {
        // Silencieux
      } finally {
        setLoading(false);
      }
    }

    return false;
  };

  const sendMessage = async (textOverride?: string) => {
    const content = (textOverride || input).trim();
    if (!content) return;
    setInput("");

    const userMsg = { role: "user" as const, content };
    setMessages((prev) => [...prev, userMsg]);

    const handled = await handleVoiceCommand(content);
    console.log("[Neo] handled:", handled);
    if (handled) return;

    setLoading(true);
    try {
      const res = await fetch("/api/nevo/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          extractedText,
          context,
        }),
      });
      const data = await res.json();
      if (data?.action && onAction) {
        onAction(data.action as JarvisAction);
      }
      speak(cleanForSpeech(data.response));
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Erreur, réessaie." }]);
    } finally {
      setLoading(false);
    }
  };

  const startWakeWordDetection = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = "fr-FR";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join("")
        .toLowerCase();
      if (
        transcript.includes("ok neo") ||
        transcript.includes("okay neo") ||
        transcript.includes("oké neo")
      ) {
        recognition.stop();
        setIsWakeWordActive(false);
        handleOpen();
        const command = transcript.split(/ok neo|okay neo|oké neo/i).pop()?.trim();
        if (command && command.length > 2) {
          setTimeout(() => sendMessage(command), 1000);
        } else {
          setTimeout(() => startListening(), 800);
        }
      }
    };
    recognition.onend = () => {
      if (isWakeWordActiveRef.current) setTimeout(() => safeStart(recognition), 500);
    };
    recognition.onerror = () => {
      if (isWakeWordActiveRef.current) setTimeout(() => safeStart(recognition), 1000);
    };
    wakeWordRef.current = recognition;
    safeStart(recognition);
    isWakeWordActiveRef.current = true;
    setIsWakeWordActive(true);
  };

  const stopWakeWordDetection = () => {
    wakeWordRef.current?.stop();
    isWakeWordActiveRef.current = false;
    setIsWakeWordActive(false);
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (messages.length === 1) {
      const welcome = "Bonjour, je suis Neo, ton assistant d'apprentissage.";
      setMessages((prev) => [...prev, { role: "assistant", content: welcome }]);
      setTimeout(() => speak(welcome), 500);
    }
  };

  // useEffect(() => {
  //   startWakeWordDetection();
  //   return () => stopWakeWordDetection();
  // }, []);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      isMobileRef.current = true;
      // Ne pas ouvrir auto — juste préparer le message de bienvenue
      // L'ouverture reste au clic mais parle immédiatement
    }
  }, []);

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-2 md:bottom-6 md:right-6">
      {(isListening || isSpeaking) && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm md:hidden">
          <div className="relative w-48 h-48 flex items-center justify-center mb-8">
            <div
              className="absolute w-48 h-48 rounded-full animate-ping opacity-20"
              style={{ background: "radial-gradient(circle, #be1354, #F97316)" }}
            />
            <div
              className="absolute w-36 h-36 rounded-full animate-pulse opacity-40"
              style={{ background: "radial-gradient(circle, #be1354, #6D28D9)" }}
            />
            <div
              className="absolute w-24 h-24 rounded-full"
              style={{ background: "radial-gradient(circle, #ffffff, #be1354)" }}
            />
            <div className="absolute w-12 h-12 rounded-full bg-white shadow-2xl" />
          </div>

          <p className="text-white text-lg font-semibold mb-2">
            {isListening ? "Je t'écoute..." : "Neo parle..."}
          </p>
          <p className="text-white/60 text-sm mb-8">{isListening ? "Pose ta question" : ""}</p>

          <button
            onClick={() => {
              stopSpeaking();
              setIsListening(false);
            }}
            className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center"
          >
            <span className="w-5 h-5 bg-white rounded-sm" />
          </button>
        </div>
      )}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-50 flex flex-col md:hidden"
            style={{ background: "linear-gradient(180deg, #1a0a0f 0%, #0f0510 100%)" }}
          >
            <div className="flex items-center justify-between px-6 pt-12 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full relative flex items-center justify-center">
                  <div
                    className={`absolute inset-0 rounded-full ${
                      isSpeaking ? "animate-ping opacity-40" : "opacity-20"
                    }`}
                    style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
                  />
                  <div
                    className={`absolute inset-1 rounded-full ${isSpeaking ? "animate-pulse" : ""}`}
                    style={{ background: "linear-gradient(135deg, #F97316, #be1354)" }}
                  />
                  <div className="absolute inset-2 rounded-full bg-white/20" />
                </div>
                <div>
                  <p className="text-white font-semibold">Neo</p>
                  <p className="text-white/50 text-xs">
                    {isSpeaking ? "Parle..." : isListening ? "Ecoute..." : "Assistant"}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative">
              <div className="relative w-56 h-56 flex items-center justify-center">
                <div
                  className={`absolute w-56 h-56 rounded-full ${isSpeaking ? "animate-ping" : ""} opacity-10`}
                  style={{ background: "radial-gradient(circle, #be1354, transparent)" }}
                />
                <div
                  className={`absolute w-44 h-44 rounded-full opacity-20 ${
                    isSpeaking ? "animate-pulse" : ""
                  }`}
                  style={{ background: "radial-gradient(circle, #F97316, #be1354)" }}
                />
                <div
                  className={`absolute w-32 h-32 rounded-full opacity-40 ${
                    isListening ? "animate-pulse" : ""
                  }`}
                  style={{ background: "radial-gradient(circle, #be1354, #6D28D9)" }}
                />
                <div
                  className="absolute w-20 h-20 rounded-full opacity-80"
                  style={{ background: "radial-gradient(circle, #F97316, #be1354)" }}
                />
                <div className="absolute w-10 h-10 rounded-full bg-white/90 shadow-2xl" />
              </div>

              <div className="mt-8 px-8 text-center max-h-32 overflow-y-auto">
                {messages.length > 0 && (
                  <p className="text-white/80 text-base leading-relaxed">
                    {messages[messages.length - 1].content}
                  </p>
                )}
              </div>

              <div className="mt-4 px-6 w-full max-h-24 overflow-y-auto space-y-2 opacity-50">
                {messages
                  .slice(-4, -1)
                  .reverse()
                  .map((m, i) => (
                    <p
                      key={i}
                      className={`text-xs text-center ${
                        m.role === "user" ? "text-white/60" : "text-white/40"
                      }`}
                    >
                      {m.content.slice(0, 80)}
                      {m.content.length > 80 ? "..." : ""}
                    </p>
                  ))}
              </div>
            </div>

            <div className="px-6 pb-12 pt-4">
              {loading && (
                <div className="flex justify-center gap-1 mb-4">
                  <span
                    className="w-2 h-2 bg-[#be1354] rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-[#F97316] rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-[#be1354] rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              )}
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-3 border border-white/20">
                <button
                  onPointerDown={startListening}
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    isListening ? "bg-red-500 animate-pulse" : "bg-white/20"
                  }`}
                >
                  <Mic className="h-4 w-4 text-white" />
                </button>
                <button
                  onClick={toggleConversationMode}
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    isConversationMode ? "animate-pulse" : "bg-white/20"
                  }`}
                  style={isConversationMode ? { background: "linear-gradient(135deg, #be1354, #F97316)" } : {}}
                >
                  <Mic className="h-4 w-4 text-white" />
                </button>
                {isSpeaking && (
                  <button
                    onClick={stopSpeaking}
                    className="w-8 h-8 rounded-full bg-red-500/80 flex items-center justify-center flex-shrink-0"
                  >
                    <span className="w-3 h-3 bg-white rounded-sm" />
                  </button>
                )}
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Pose ta question..."
                  className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-sm"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={loading}
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
                >
                  <Send className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>
          </div>

          <div
            className="hidden md:flex w-80 bg-white rounded-2xl shadow-2xl border border-[#E8E9F0] flex-col overflow-hidden"
            style={{ height: "420px" }}
          >
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#be1354] to-[#F97316]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full relative flex items-center justify-center overflow-hidden">
                  <div
                    className={`absolute inset-0 rounded-full ${
                      isSpeaking ? "animate-ping opacity-60" : "opacity-40"
                    }`}
                    style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
                  />
                  <div
                    className={`absolute inset-1 rounded-full ${isSpeaking ? "animate-pulse" : ""}`}
                    style={{ background: "linear-gradient(135deg, #F97316, #be1354)" }}
                  />
                  <div className="absolute inset-2 rounded-full bg-white/90" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Neo</p>
                  <p className="text-white/70 text-xs">Assistant Neo</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#F8F9FC]">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                      m.role === "user"
                        ? "bg-gradient-to-r from-[#be1354] to-[#F97316] text-white rounded-br-sm"
                        : "bg-white text-[#0F1117] shadow-sm rounded-bl-sm border border-[#E8E9F0]"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white px-3 py-2 rounded-2xl rounded-bl-sm border border-[#E8E9F0] shadow-sm">
                    <div className="flex gap-1">
                      <span
                        className="w-1.5 h-1.5 bg-[#be1354] rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="w-1.5 h-1.5 bg-[#be1354] rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="w-1.5 h-1.5 bg-[#be1354] rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-3 py-3 bg-white border-t border-[#E8E9F0] flex items-center gap-2">
              <button
                onPointerDown={startListening}
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  isListening ? "bg-red-500 animate-pulse" : "bg-[#F3F4F8] hover:bg-[#E8E9F0]"
                }`}
              >
                <Mic className={`h-3.5 w-3.5 ${isListening ? "text-white" : "text-[#6B7280]"}`} />
              </button>
              <button
                onClick={toggleConversationMode}
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  isConversationMode ? "animate-pulse" : "bg-[#F3F4F8]"
                }`}
                style={isConversationMode ? { background: "linear-gradient(135deg, #be1354, #F97316)" } : {}}
                title={isConversationMode ? "Arrêter la conversation" : "Mode conversation"}
              >
                <Mic className={`h-3.5 w-3.5 ${isConversationMode ? "text-white" : "text-[#6B7280]"}`} />
              </button>
              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 animate-pulse"
                  title="Arrêter"
                >
                  <span className="w-3 h-3 bg-white rounded-sm" />
                </button>
              )}
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Pose ta question..."
                className="flex-1 text-sm bg-[#F8F9FC] border border-[#E8E9F0] rounded-full px-4 py-2 outline-none focus:border-[#be1354] text-[#0F1117]"
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading}
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
              >
                <Send className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
          </div>
        </>
      )}

      {!isOpen && (
        <button
          onClick={handleOpen}
          className="relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105"
          style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
        >
          <MessageCircle className="h-6 w-6 text-white" />
          {isWakeWordActive && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse border-2 border-white" />
          )}
        </button>
      )}

      {!isOpen && (
        <div className="bg-white rounded-full px-3 py-1 shadow-md border border-[#E8E9F0] -mt-2">
          <p className="text-xs font-semibold text-[#0F1117]">Neo</p>
        </div>
      )}
    </div>
  );
}
