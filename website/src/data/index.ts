import { phase0Content } from "./phase0";
import { phase0ContentZhCN } from "./phase0.zh-CN";
import { phase2Content } from "./phase2";
import { phase2ContentZhCN } from "./phase2.zh-CN";
import { phase3Content } from "./phase3";
import { phase3ContentZhCN } from "./phase3.zh-CN";
import { phase4Content } from "./phase4";
import { phase4ContentZhCN } from "./phase4.zh-CN";
import { phase5Content } from "./phase5";
import { phase5ContentZhCN } from "./phase5.zh-CN";
import type { PhaseContent, Lesson } from "./types";
import type { Locale } from "../i18n";

const PHASE_CONTENT: Record<string, Record<number, PhaseContent>> = {
  "zh-TW": {
    0: phase0Content,
    2: phase2Content,
    3: phase3Content,
    4: phase4Content,
    5: phase5Content,
  },
  "zh-CN": {
    0: phase0ContentZhCN,
    2: phase2ContentZhCN,
    3: phase3ContentZhCN,
    4: phase4ContentZhCN,
    5: phase5ContentZhCN,
  },
  en: {
    0: phase0Content,
    2: phase2Content,
    3: phase3Content,
    4: phase4Content,
    5: phase5Content,
  },
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
