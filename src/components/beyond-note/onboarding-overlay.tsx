import { Camera, Trophy, ArrowRight, Sparkles } from "lucide-react";

interface OnboardingOverlayProps {
  step: number;
  onNext: () => void;
  onSkip: () => void;
  onComplete: () => void;
  onTriggerUpload?: () => void;
  onTriggerTransformation?: () => void;
  onTriggerNeo?: () => void;
}

const StepDots = ({ step }: { step: number }) => (
  <div className="mt-6 flex items-center justify-center gap-2">
    {[1, 2, 3, 4].map((i) => (
      <span
        key={i}
        className={`h-2 w-2 rounded-full ${i === step ? "bg-[#be1354]" : "bg-[#E8E9F0]"}`}
      />
    ))}
  </div>
);

export function OnboardingOverlay({
  step,
  onNext,
  onSkip,
  onComplete,
  onTriggerUpload,
  onTriggerTransformation,
  onTriggerNeo,
}: OnboardingOverlayProps) {
  if (step === 0) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
      {step === 1 && (
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
          <div
            className="mx-auto mb-4 h-14 w-14 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
          >
            <Camera className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-[#0F1117] mb-2">Bienvenue sur Nevo. !</h2>
          <p className="text-sm text-[#6B7280]">
            Commence par uploader ton premier cours. Prends une photo, importe un fichier ou dicte tes notes.
          </p>
          <button
            onClick={() => {
              onTriggerUpload?.();
              onNext();
            }}
            className="mt-6 w-full rounded-full px-6 py-3 text-white font-semibold"
            style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
          >
            Prendre une photo
          </button>
          <button onClick={onSkip} className="mt-4 text-xs text-[#9CA3AF] hover:text-[#0F1117]">
            Passer l'introduction →
          </button>
          <StepDots step={1} />
        </div>
      )}

      {step === 2 && (
        <div className="w-full max-w-sm ml-auto mr-10 bg-white rounded-3xl shadow-2xl p-6 relative">
          <div className="absolute -right-3 top-6 w-6 h-6 bg-white rotate-45" />
          <h3 className="text-lg font-semibold text-[#0F1117] mb-2">
            Bien joué ! Maintenant transforme ton cours
          </h3>
          <p className="text-sm text-[#6B7280] mb-4">
            Clique sur Fiche pour créer une fiche de révision en 1 clic
          </p>
          <div className="flex items-center gap-2 text-[#be1354] text-sm font-semibold mb-4 animate-pulse">
            <ArrowRight className="h-4 w-4" />
            Fiche de révision
          </div>
          <button
            onClick={() => {
              onTriggerTransformation?.();
              onNext();
            }}
            className="w-full rounded-full px-5 py-3 text-white font-semibold"
            style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
          >
            Créer ma première fiche →
          </button>
          <StepDots step={2} />
        </div>
      )}

      {step === 3 && (
        <div className="w-full max-w-sm ml-auto mr-10 bg-white rounded-3xl shadow-2xl p-6 relative">
          <div className="absolute -right-3 bottom-10 w-6 h-6 bg-white rotate-45" />
          <h3 className="text-lg font-semibold text-[#0F1117] mb-2">Rencontre Neo, ton assistant IA personnel</h3>
          <p className="text-sm text-[#6B7280] mb-4">
            Pose-lui une question sur ton cours, il connaît tout par coeur
          </p>
          <button
            onClick={() => {
              onTriggerNeo?.();
              onNext();
            }}
            className="w-full rounded-full px-5 py-3 text-white font-semibold"
            style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
          >
            Dire bonjour à Neo →
          </button>
          <StepDots step={3} />
        </div>
      )}

      {step === 4 && (
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(18)].map((_, i) => (
              <span
                key={i}
                className="absolute w-2 h-4 rounded-sm opacity-80"
                style={{
                  left: `${(i * 11) % 100}%`,
                  top: "-10%",
                  background: i % 2 === 0 ? "#be1354" : "#F97316",
                  animation: `confetti-fall 2.4s ${i * 0.1}s linear infinite`,
                }}
              />
            ))}
          </div>
          <div
            className="mx-auto mb-4 h-14 w-14 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
          >
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-[#0F1117] mb-2">Tu es prêt !</h2>
          <p className="text-sm text-[#6B7280]">
            Tu connais maintenant les bases de Nevo. Bonne révision !
          </p>
          <button
            onClick={onComplete}
            className="mt-6 w-full rounded-full px-6 py-3 text-white font-semibold"
            style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
          >
            Commencer à réviser →
          </button>
          <style>{`
            @keyframes confetti-fall {
              0% { transform: translateY(-10%) rotate(0deg); opacity: 0.9; }
              100% { transform: translateY(120%) rotate(360deg); opacity: 0.1; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
