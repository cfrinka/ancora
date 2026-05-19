export const emotionTranslations: Record<string, Record<string, string>> = {
  "pt-BR": {
    Anxious: "Ansioso",
    Calm: "Calmo",
    Overwhelmed: "Sobrecarregado",
    Hopeful: "Esperançoso",
    Sad: "Triste",
    Happy: "Feliz",
    Frustrated: "Frustrado",
    Grateful: "Grato",
    Lonely: "Solitário",
    Motivated: "Motivado",
    Exhausted: "Exausto",
    Confused: "Confuso",
    Content: "Satisfeito",
    Angry: "Raivoso",
    Fearful: "Com medo",
  },
};

export function localizeEmotion(label: string, locale: string): string {
  return emotionTranslations[locale]?.[label] ?? label;
}
