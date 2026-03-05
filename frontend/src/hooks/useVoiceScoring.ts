import { useCallback, useEffect, useMemo, useState } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { normalizeTranscript, parseVoiceScore } from "../services/voiceScoreParser";
import type { VoiceScoreResult } from "../services/voiceScoreParser";

export type VoiceStatus = "error" | "idle" | "listening" | "result";

export function useVoiceScoring(playerNames: string[]) {
  const {
    browserSupportsSpeechRecognition,
    finalTranscript,
    listening,
    resetTranscript,
    transcript,
  } = useSpeechRecognition();

  const [error, setError] = useState<string | null>(null);
  const [manualReset, setManualReset] = useState(false);

  const parsedResult: VoiceScoreResult = useMemo(() => {
    if (manualReset || !finalTranscript) return {};
    return parseVoiceScore(finalTranscript, playerNames);
  }, [finalTranscript, manualReset, playerNames]);

  // Log transcript for debugging speech recognition issues (dev only)
  useEffect(() => {
    if (import.meta.env.DEV && finalTranscript) {
      console.debug("[voice]", {
        normalized: normalizeTranscript(finalTranscript),
        parsed: parsedResult,
        raw: finalTranscript,
      });
    }
  }, [finalTranscript, parsedResult]);

  const hasFinalResult = !manualReset && finalTranscript.length > 0;

  const status: VoiceStatus = error
    ? "error"
    : listening
      ? "listening"
      : hasFinalResult
        ? "result"
        : "idle";

  const start = useCallback(async () => {
    if (!browserSupportsSpeechRecognition) return;
    setError(null);
    setManualReset(false);
    resetTranscript();
    try {
      await SpeechRecognition.startListening({ language: "fr-FR" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de reconnaissance vocale");
    }
  }, [browserSupportsSpeechRecognition, resetTranscript]);

  const stop = useCallback(() => {
    SpeechRecognition.stopListening();
  }, []);

  const cancel = useCallback(() => {
    SpeechRecognition.abortListening();
    resetTranscript();
  }, [resetTranscript]);

  const reset = useCallback(() => {
    setError(null);
    setManualReset(true);
    resetTranscript();
  }, [resetTranscript]);

  return {
    cancel,
    error,
    isSupported: browserSupportsSpeechRecognition,
    parsedResult,
    reset,
    start,
    status,
    stop,
    transcript,
  };
}
