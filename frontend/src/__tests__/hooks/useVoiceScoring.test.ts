import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useVoiceScoring } from "../../hooks/useVoiceScoring";
import { Contract } from "../../types/enums";

// Mock react-speech-recognition
const mockStartListening = vi.fn();
const mockStopListening = vi.fn();
const mockAbortListening = vi.fn();
let mockHookReturn = {
  browserSupportsSpeechRecognition: true,
  finalTranscript: "",
  isMicrophoneAvailable: true,
  listening: false,
  resetTranscript: vi.fn(),
  transcript: "",
};

vi.mock("react-speech-recognition", () => ({
  __esModule: true,
  default: {
    abortListening: (...args: unknown[]) => mockAbortListening(...args),
    startListening: (...args: unknown[]) => mockStartListening(...args),
    stopListening: (...args: unknown[]) => mockStopListening(...args),
  },
  useSpeechRecognition: () => mockHookReturn,
}));

const PLAYERS = ["Pierre", "Jean", "Marie"];

beforeEach(() => {
  mockHookReturn = {
    browserSupportsSpeechRecognition: true,
    finalTranscript: "",
    isMicrophoneAvailable: true,
    listening: false,
    resetTranscript: vi.fn(),
    transcript: "",
  };
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("useVoiceScoring", () => {
  it("détecte le support du navigateur", () => {
    const { result } = renderHook(() => useVoiceScoring(PLAYERS));
    expect(result.current.isSupported).toBe(true);
  });

  it("isSupported = false si API absente", () => {
    mockHookReturn.browserSupportsSpeechRecognition = false;
    const { result } = renderHook(() => useVoiceScoring(PLAYERS));
    expect(result.current.isSupported).toBe(false);
  });

  it("démarre en état idle", () => {
    const { result } = renderHook(() => useVoiceScoring(PLAYERS));
    expect(result.current.status).toBe("idle");
    expect(result.current.transcript).toBe("");
    expect(result.current.parsedResult).toEqual({});
    expect(result.current.error).toBeNull();
  });

  it("appelle startListening avec fr-FR quand start() est appelé", () => {
    const { result } = renderHook(() => useVoiceScoring(PLAYERS));
    act(() => result.current.start());
    expect(mockStartListening).toHaveBeenCalledWith({ language: "fr-FR" });
  });

  it("start() est no-op si pas supporté", () => {
    mockHookReturn.browserSupportsSpeechRecognition = false;
    const { result } = renderHook(() => useVoiceScoring(PLAYERS));
    act(() => result.current.start());
    expect(mockStartListening).not.toHaveBeenCalled();
  });

  it("expose le transcript en temps réel", () => {
    mockHookReturn.transcript = "garde cinquante";
    mockHookReturn.listening = true;
    const { result } = renderHook(() => useVoiceScoring(PLAYERS));
    expect(result.current.transcript).toBe("garde cinquante");
  });

  it("passe en listening quand le micro est actif", () => {
    mockHookReturn.listening = true;
    const { result } = renderHook(() => useVoiceScoring(PLAYERS));
    expect(result.current.status).toBe("listening");
  });

  it("parse le résultat final et passe en status result", () => {
    mockHookReturn.finalTranscript = "garde 56 points appelé Pierre";
    const { result } = renderHook(() => useVoiceScoring(PLAYERS));
    expect(result.current.status).toBe("result");
    expect(result.current.parsedResult.contract).toBe(Contract.Garde);
    expect(result.current.parsedResult.points).toBe(56);
    expect(result.current.parsedResult.playerName).toBe("Pierre");
  });

  it("stop() appelle stopListening", () => {
    const { result } = renderHook(() => useVoiceScoring(PLAYERS));
    act(() => result.current.stop());
    expect(mockStopListening).toHaveBeenCalled();
  });

  it("cancel() appelle abortListening et reset le transcript", () => {
    const { result } = renderHook(() => useVoiceScoring(PLAYERS));
    act(() => result.current.cancel());
    expect(mockAbortListening).toHaveBeenCalled();
    expect(mockHookReturn.resetTranscript).toHaveBeenCalled();
  });

  it("reset() remet à zéro l'état", () => {
    mockHookReturn.finalTranscript = "garde 56 points";
    const { result } = renderHook(() => useVoiceScoring(PLAYERS));
    expect(result.current.status).toBe("result");
    act(() => result.current.reset());
    expect(result.current.status).toBe("idle");
    expect(result.current.parsedResult).toEqual({});
    expect(mockHookReturn.resetTranscript).toHaveBeenCalled();
  });

  it("résultat vide pour un transcript non parseable", () => {
    mockHookReturn.finalTranscript = "blah blah blah";
    const { result } = renderHook(() => useVoiceScoring(PLAYERS));
    // finalTranscript is set but nothing parseable → status stays result with empty result
    expect(result.current.parsedResult).toEqual({});
  });
});
