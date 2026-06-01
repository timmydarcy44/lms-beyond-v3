const FEMALE_HINT =
  /femme|female|amélie|amelie|julie|denise|hortense|virginie|claire|léa|lea|marie|samantha|zira|hélène|helene/i;

const MALE_HINT =
  /homme|male|paul|henri|thomas|nicolas|damien|george|daniel|rémy|remy|claude|google.*fr.*male/i;

export function pickFrenchMaleVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined") return null;

  const voices = window.speechSynthesis.getVoices();
  const fr = voices.filter((v) => v.lang.toLowerCase().startsWith("fr"));
  if (fr.length === 0) return null;

  const explicitMale = fr.find((v) => MALE_HINT.test(v.name) && !FEMALE_HINT.test(v.name));
  if (explicitMale) return explicitMale;

  const notFemale = fr.find((v) => !FEMALE_HINT.test(v.name));
  if (notFemale) return notFemale;

  return fr[0] ?? null;
}

export function applyNaturalMaleSpeech(utterance: SpeechSynthesisUtterance): void {
  utterance.lang = "fr-FR";
  utterance.rate = 0.92;
  utterance.pitch = 0.82;
  utterance.volume = 1;

  const voice = pickFrenchMaleVoice();
  if (voice) utterance.voice = voice;
}
