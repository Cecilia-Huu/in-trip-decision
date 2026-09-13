import type { Locale } from "./mock-data";

export type SpeechResultLike = { isFinal: boolean; 0: { transcript: string } };
export type SpeechEventLike = { resultIndex: number; results: ArrayLike<SpeechResultLike> };
export type SpeechErrorLike = { error: string };

export type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechEventLike) => void) | null;
  onerror: ((event: SpeechErrorLike) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

export type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
export type SpeechWindow = {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

export function getSpeechRecognitionConstructor(source: SpeechWindow | undefined) {
  return source?.SpeechRecognition ?? source?.webkitSpeechRecognition ?? null;
}

export function speechLanguage(locale: Locale) {
  return locale === "zh" ? "zh-CN" : "en-US";
}

export function appendTranscript(existing: string, transcript: string, locale: Locale) {
  const current = existing.trimEnd();
  const next = transcript.trim();
  if (!current) return next;
  if (!next) return current;
  if (locale === "en") return `${current} ${next}`;
  return `${current}${/[。！？!?，,；;：:]$/.test(current) ? "" : "，"}${next}`;
}
