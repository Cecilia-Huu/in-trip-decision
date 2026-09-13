import { useEffect, useRef, useState } from "react";
import type { Locale } from "./mock-data";
import { appendTranscript, getSpeechRecognitionConstructor, speechLanguage, type SpeechRecognitionLike, type SpeechWindow } from "./speech";

const voiceCopy = {
  zh: { start:"用语音输入", stop:"停止听写", listening:"正在听……", retry:"没听清，再试一次？", unavailable:"麦克风不可用，可以直接打字。" },
  en: { start:"Use voice input", stop:"Stop listening", listening:"Listening…", retry:"I didn’t catch that. Try again?", unavailable:"The microphone is unavailable. You can keep typing." },
} as const;

export function VoiceInput({ locale, value, onChange, placeholder, ariaLabel, compact = false }: { locale: Locale; value: string; onChange: (value: string) => void; placeholder: string; ariaLabel: string; compact?: boolean }) {
  const t = voiceCopy[locale];
  const textarea = useRef<HTMLTextAreaElement>(null);
  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const [listening, setListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState("");
  const Recognition = typeof window === "undefined" ? null : getSpeechRecognitionConstructor(window as typeof window & SpeechWindow);

  useEffect(() => {
    const element = textarea.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, compact ? 112 : 160)}px`;
  }, [compact, value]);

  useEffect(() => () => recognition.current?.abort(), []);

  const toggle = () => {
    if (listening) {
      recognition.current?.stop();
      return;
    }
    if (!Recognition) return;
    const next = new Recognition();
    next.lang = speechLanguage(locale);
    next.continuous = false;
    next.interimResults = false;
    next.onstart = () => { setListening(true); setVoiceMessage(""); };
    next.onend = () => { setListening(false); recognition.current = null; };
    next.onerror = (event) => {
      setListening(false);
      recognition.current = null;
      if (event.error === "aborted") return;
      setVoiceMessage(event.error === "not-allowed" || event.error === "audio-capture" ? t.unavailable : t.retry);
    };
    next.onresult = (event) => {
      let finalText = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        if (event.results[index].isFinal) finalText += event.results[index][0].transcript;
      }
      if (finalText.trim()) onChange(appendTranscript(value, finalText, locale));
    };
    recognition.current = next;
    setListening(true);
    try { next.start(); } catch { setListening(false); setVoiceMessage(t.unavailable); recognition.current = null; }
  };

  return <div className={`voice-input${listening ? " listening" : ""}`}>
    <textarea ref={textarea} rows={compact ? 2 : 3} value={value} onChange={(event) => { onChange(event.target.value); setVoiceMessage(""); }} placeholder={placeholder} aria-label={ariaLabel} />
    {Recognition ? <button className="mic-button" type="button" aria-label={listening ? t.stop : t.start} aria-pressed={listening} onClick={toggle}><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6"/></svg></button> : null}
    {listening || voiceMessage ? <p className="voice-status" role="status">{listening ? t.listening : voiceMessage}</p> : null}
  </div>;
}
