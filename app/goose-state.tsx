import { useEffect } from "react";
import type { Locale } from "./mock-data";

// A short, visible UI transition, not simulated model/network latency.
export const GOOSE_TRANSITION_MS = 650;
export function Goose({ thinking = false, resting = false }: { thinking?: boolean; resting?: boolean }) {
  const asset = resting ? "assets/goose-resting.svg" : thinking ? "assets/goose-thinking.svg" : "assets/goose-location.svg";
  return <img className={thinking ? "goose thinking" : "goose"} src={import.meta.env.BASE_URL + asset} alt="" width="96" height="96" />;
}
export function GooseProcessing({ locale, onComplete, message }: { locale: Locale; onComplete: () => void; message?: string }) {
  useEffect(() => {
    const timer = window.setTimeout(onComplete, GOOSE_TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, [onComplete]);
  return <section className="app-screen processing-state" role="status" aria-live="polite"><Goose thinking /><p>{message ?? (locale === "zh" ? "我看看怎么把这一段接上。" : "Let’s connect this part of your day.")}</p></section>;
}
