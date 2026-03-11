import { phase0Content } from "./phase0";
import { phase0ContentZhCN } from "./phase0.zh-CN";
import type { PhaseContent, Lesson } from "./types";
import type { Locale } from "../i18n";

const PHASE_CONTENT: Record<string, Record<number, PhaseContent>> = {
  "zh-TW": { 0: phase0Content },
  "zh-CN": { 0: phase0ContentZhCN },
  en: { 0: phase0Content }, // TODO: add phase0ContentEn when ready
};

export function getPhaseContent(phaseId: number, locale: Locale = "zh-TW"): PhaseContent | undefined {
  return PHASE_CONTENT[locale]?.[phaseId] ?? PHASE_CONTENT["zh-TW"]?.[phaseId];
}

export function getLesson(phaseId: number, lessonId: number, locale: Locale = "zh-TW"): Lesson | undefined {
  const phase = getPhaseContent(phaseId, locale);
  return phase?.lessons.find((l) => l.lessonId === lessonId);
}

export function hasLessons(phaseId: number): boolean {
  return phaseId in PHASE_CONTENT["zh-TW"];
}

export type { PhaseContent, Lesson } from "./types";
