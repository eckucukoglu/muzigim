"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { midiToNoteName, midiToTurkishName, velocityToDynamic } from "@/data/curriculum";
import { soundEngine } from "@/lib/audio";
import { analyzeActiveMidis, DetectedHarmony } from "@/lib/theory";

export interface ActiveNoteEvent {
  midi: number;
  note: string;
  turkishName: string;
  velocity: number;
  dynamicSymbol: string;
  dynamicLabel: string;
  timestamp: number;
  source: "midi" | "virtual";
}

export interface PlayedNoteRecord extends ActiveNoteEvent {
  durationMs?: number;
  interOnsetMs: number;
}

export interface MidiDeviceInfo {
  id: string;
  name: string;
  manufacturer: string;
  state: string;
}

type NoteOnCallback = (event: ActiveNoteEvent) => void;

interface PianoContextValue {
  midiSupported: boolean;
  midiStatus: "connecting" | "connected" | "no-device" | "unsupported" | "denied";
  midiDevices: MidiDeviceInfo[];
  selectedDeviceId: string | null;
  selectMidiDevice: (id: string) => void;
  refreshMidi: () => Promise<void>;
  activeNotes: Record<number, ActiveNoteEvent>;
  sustainPedal: boolean;
  sustainValue: number;
  recentNotes: PlayedNoteRecord[];
  clearRecentNotes: () => void;
  detectedHarmony: DetectedHarmony;
  triggerVirtualNoteOn: (midi: number, velocity?: number) => void;
  triggerVirtualNoteOff: (midi: number) => void;
  stopAllNotes: () => void;
  subscribeNoteOn: (cb: NoteOnCallback) => () => void;
  browserPianoSoundOnMidi: boolean;
  setBrowserPianoSoundOnMidi: (val: boolean) => void;
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  highlightedMidis: number[];
  setHighlightedMidis: (midis: number[]) => void;
}

const PianoContext = createContext<PianoContextValue | null>(null);

const COMPUTER_KEY_TO_OFFSET: Record<string, number> = {
  a: 0, // C
  w: 1, // C#
  s: 2, // D
  e: 3, // D#
  d: 4, // E
  f: 5, // F
  t: 6, // F#
  g: 7, // G
  y: 8, // G#
  h: 9, // A
  u: 10, // A#
  j: 11, // B
  k: 12, // C+1
  o: 13, // C#+1
  l: 14, // D+1
  p: 15, // D#+1
};

export function PianoProvider({ children }: { children: React.ReactNode }) {
  const [midiSupported, setMidiSupported] = useState(true);
  const [midiStatus, setMidiStatus] = useState<
    "connecting" | "connected" | "no-device" | "unsupported" | "denied"
  >("connecting");
  const [midiDevices, setMidiDevices] = useState<MidiDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [activeNotes, setActiveNotes] = useState<Record<number, ActiveNoteEvent>>({});
  const [sustainPedal, setSustainPedal] = useState(false);
  const [sustainValue, setSustainValue] = useState(0);
  const [recentNotes, setRecentNotes] = useState<PlayedNoteRecord[]>([]);
  const [browserPianoSoundOnMidi, setBrowserPianoSoundOnMidi] = useState(false);
  const [geminiApiKey, setGeminiApiKeyState] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [highlightedMidis, setHighlightedMidis] = useState<number[]>([]);

  const listenersRef = useRef<Set<NoteOnCallback>>(new Set());
  const lastNoteTimestampRef = useRef<number>(0);
  const activeTimestampsRef = useRef<Record<number, number>>({});
  const activeVirtualMidisRef = useRef<Set<number>>(new Set());
  const midiAccessRef = useRef<MIDIAccess | null>(null);
  const selectedDeviceIdRef = useRef<string | null>(null);
  const browserSoundRef = useRef(browserPianoSoundOnMidi);
  const baseOctaveRef = useRef(4); // C4 = 60

  useEffect(() => {
    browserSoundRef.current = browserPianoSoundOnMidi;
    if (!browserPianoSoundOnMidi) {
      soundEngine.stopAll();
    }
  }, [browserPianoSoundOnMidi]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("roland_fp10_gemini_api_key") || "";
      setGeminiApiKeyState(savedKey);
      const savedSound = localStorage.getItem("roland_fp10_browser_sound_on_midi");
      if (savedSound === "true") setBrowserPianoSoundOnMidi(true);
    }
  }, []);

  const setGeminiApiKey = useCallback((key: string) => {
    setGeminiApiKeyState(key);
    if (typeof window !== "undefined") {
      localStorage.setItem("roland_fp10_gemini_api_key", key.trim());
    }
  }, []);

  const handleSetBrowserSound = useCallback((val: boolean) => {
    setBrowserPianoSoundOnMidi(val);
    if (!val) {
      soundEngine.stopAll();
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("roland_fp10_browser_sound_on_midi", String(val));
    }
  }, []);

  const stopAllNotes = useCallback(() => {
    activeTimestampsRef.current = {};
    activeVirtualMidisRef.current.clear();
    setActiveNotes({});
    setSustainPedal(false);
    setSustainValue(0);
    soundEngine.stopAll();
  }, []);

  const handleNoteOnInternal = useCallback(
    (midi: number, velocity: number, source: "midi" | "virtual") => {
      const now = performance.now();
      const interOnsetMs =
        lastNoteTimestampRef.current > 0 ? Math.round(now - lastNoteTimestampRef.current) : 0;
      lastNoteTimestampRef.current = now;
      activeTimestampsRef.current[midi] = now;
      if (source === "virtual") {
        activeVirtualMidisRef.current.add(midi);
      }

      const dyn = velocityToDynamic(velocity);
      const event: ActiveNoteEvent = {
        midi,
        note: midiToNoteName(midi),
        turkishName: midiToTurkishName(midi),
        velocity,
        dynamicSymbol: dyn.symbol,
        dynamicLabel: dyn.label,
        timestamp: Date.now(),
        source,
      };

      setActiveNotes((prev) => ({ ...prev, [midi]: event }));
      setRecentNotes((prev) => {
        const record: PlayedNoteRecord = { ...event, interOnsetMs };
        return [...prev.slice(-39), record];
      });

      if (source === "virtual" || browserSoundRef.current) {
        soundEngine.noteOn(midi, velocity, source);
      }

      listenersRef.current.forEach((cb) => {
        try {
          cb(event);
        } catch (err) {
          console.error(err);
        }
      });
    },
    []
  );

  const handleNoteOffInternal = useCallback((midi: number) => {
    const now = performance.now();
    const startTime = activeTimestampsRef.current[midi];
    const durationMs = startTime ? Math.round(now - startTime) : undefined;
    delete activeTimestampsRef.current[midi];
    activeVirtualMidisRef.current.delete(midi);

    setActiveNotes((prev) => {
      if (!(midi in prev)) return prev;
      const next = { ...prev };
      delete next[midi];
      return next;
    });

    if (durationMs !== undefined) {
      setRecentNotes((prev) => {
        const idx = [...prev].reverse().findIndex((r) => r.midi === midi && !r.durationMs);
        if (idx === -1) return prev;
        const realIdx = prev.length - 1 - idx;
        const updated = [...prev];
        updated[realIdx] = { ...updated[realIdx], durationMs };
        return updated;
      });
    }

    // Always call soundEngine.noteOff unconditionally so no note can ever stay stuck
    soundEngine.noteOff(midi);
  }, []);

  const parseMidiMessage = useCallback(
    (e: MIDIMessageEvent) => {
      const data = e.data;
      if (!data || data.length < 2) return;
      const status = data[0] & 0xf0;
      const data1 = data[1];
      const data2 = data.length > 2 ? data[2] : 0;

      // Note On
      if (status === 0x90) {
        if (data2 > 0) {
          handleNoteOnInternal(data1, data2, "midi");
        } else {
          // Velocity 0 = Note Off
          handleNoteOffInternal(data1);
        }
      } else if (status === 0x80) {
        // Note Off
        handleNoteOffInternal(data1);
      } else if (status === 0xb0) {
        // Control Change
        if (data1 === 64) {
          // CC 64 = Sustain Pedal on Roland FP-10
          setSustainValue(data2);
          setSustainPedal(data2 >= 64);
        } else if (data1 === 120 || data1 === 123) {
          // CC 120 (All Sound Off) / CC 123 (All Notes Off)
          stopAllNotes();
        }
      }
    },
    [handleNoteOnInternal, handleNoteOffInternal, stopAllNotes]
  );

  const bindMidiInputs = useCallback(
    (access: MIDIAccess, preferredId?: string | null) => {
      const inputs: MidiDeviceInfo[] = [];
      let chosenId: string | null = preferredId || null;

      access.inputs.forEach((input) => {
        inputs.push({
          id: input.id,
          name: input.name || "USB MIDI Klavye",
          manufacturer: input.manufacturer || "MIDI",
          state: input.state,
        });
      });

      setMidiDevices(inputs);

      if (inputs.length === 0) {
        setMidiStatus("no-device");
        setSelectedDeviceId(null);
        stopAllNotes();
        return;
      }

      // Prefer Roland / FP-10 automatically if available
      if (!chosenId || !inputs.some((d) => d.id === chosenId)) {
        const rolandDevice = inputs.find(
          (d) =>
            d.name.toLowerCase().includes("fp-10") ||
            d.name.toLowerCase().includes("roland") ||
            d.manufacturer.toLowerCase().includes("roland")
        );
        chosenId = rolandDevice ? rolandDevice.id : inputs[0].id;
      }

      selectedDeviceIdRef.current = chosenId;
      setSelectedDeviceId(chosenId);
      setMidiStatus("connected");

      access.inputs.forEach((input) => {
        if (input.id === chosenId || !chosenId) {
          input.onmidimessage = parseMidiMessage;
        } else {
          input.onmidimessage = null;
        }
      });
    },
    [parseMidiMessage, stopAllNotes]
  );

  const refreshMidi = useCallback(async () => {
    if (typeof navigator === "undefined" || !("requestMIDIAccess" in navigator)) {
      setMidiSupported(false);
      setMidiStatus("unsupported");
      return;
    }

    try {
      stopAllNotes();
      setMidiStatus("connecting");
      const access = await navigator.requestMIDIAccess({ sysex: false });
      midiAccessRef.current = access;
      bindMidiInputs(access, selectedDeviceIdRef.current);

      access.onstatechange = () => {
        bindMidiInputs(access, selectedDeviceIdRef.current);
      };
    } catch {
      setMidiStatus("denied");
    }
  }, [bindMidiInputs, stopAllNotes]);

  useEffect(() => {
    refreshMidi();
  }, [refreshMidi]);

  const selectMidiDevice = useCallback(
    (id: string) => {
      stopAllNotes();
      selectedDeviceIdRef.current = id;
      setSelectedDeviceId(id);
      if (midiAccessRef.current) {
        bindMidiInputs(midiAccessRef.current, id);
      }
    },
    [bindMidiInputs, stopAllNotes]
  );

  // Global pointer/mouse release and window blur listeners so virtual or MIDI notes never hang
  useEffect(() => {
    const releaseAllVirtualNotes = () => {
      if (activeVirtualMidisRef.current.size === 0) return;
      const toRelease = Array.from(activeVirtualMidisRef.current);
      toRelease.forEach((midi) => {
        handleNoteOffInternal(midi);
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAllNotes();
      }
    };

    window.addEventListener("mouseup", releaseAllVirtualNotes);
    window.addEventListener("pointerup", releaseAllVirtualNotes);
    window.addEventListener("pointercancel", releaseAllVirtualNotes);
    window.addEventListener("touchend", releaseAllVirtualNotes);
    window.addEventListener("touchcancel", releaseAllVirtualNotes);
    window.addEventListener("contextmenu", releaseAllVirtualNotes);
    window.addEventListener("blur", stopAllNotes);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("mouseup", releaseAllVirtualNotes);
      window.removeEventListener("pointerup", releaseAllVirtualNotes);
      window.removeEventListener("pointercancel", releaseAllVirtualNotes);
      window.removeEventListener("touchend", releaseAllVirtualNotes);
      window.removeEventListener("touchcancel", releaseAllVirtualNotes);
      window.removeEventListener("contextmenu", releaseAllVirtualNotes);
      window.removeEventListener("blur", stopAllNotes);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleNoteOffInternal, stopAllNotes]);

  // Computer keyboard listener for testing when away from piano
  useEffect(() => {
    const pressedKeyToMidi = new Map<string, number>();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key === "escape") {
        stopAllNotes();
        return;
      }
      if (key === "z") {
        baseOctaveRef.current = Math.max(2, baseOctaveRef.current - 1);
        return;
      }
      if (key === "x") {
        baseOctaveRef.current = Math.min(6, baseOctaveRef.current + 1);
        return;
      }

      if (key in COMPUTER_KEY_TO_OFFSET && !pressedKeyToMidi.has(key)) {
        const midi = (baseOctaveRef.current + 1) * 12 + COMPUTER_KEY_TO_OFFSET[key];
        pressedKeyToMidi.set(key, midi);
        handleNoteOnInternal(midi, 82, "virtual");
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const midi = pressedKeyToMidi.get(key);
      if (midi !== undefined) {
        pressedKeyToMidi.delete(key);
        handleNoteOffInternal(midi);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [handleNoteOnInternal, handleNoteOffInternal, stopAllNotes]);

  const triggerVirtualNoteOn = useCallback(
    (midi: number, velocity = 82) => {
      handleNoteOnInternal(midi, velocity, "virtual");
    },
    [handleNoteOnInternal]
  );

  const triggerVirtualNoteOff = useCallback(
    (midi: number) => {
      if (!activeVirtualMidisRef.current.has(midi)) return;
      handleNoteOffInternal(midi);
    },
    [handleNoteOffInternal]
  );

  const subscribeNoteOn = useCallback((cb: NoteOnCallback) => {
    listenersRef.current.add(cb);
    return () => {
      listenersRef.current.delete(cb);
    };
  }, []);

  const clearRecentNotes = useCallback(() => {
    setRecentNotes([]);
  }, []);

  const activeMidiNumbers = Object.keys(activeNotes).map(Number);
  const detectedHarmony = analyzeActiveMidis(activeMidiNumbers);

  return (
    <PianoContext.Provider
      value={{
        midiSupported,
        midiStatus,
        midiDevices,
        selectedDeviceId,
        selectMidiDevice,
        refreshMidi,
        activeNotes,
        sustainPedal,
        sustainValue,
        recentNotes,
        clearRecentNotes,
        detectedHarmony,
        triggerVirtualNoteOn,
        triggerVirtualNoteOff,
        stopAllNotes,
        subscribeNoteOn,
        browserPianoSoundOnMidi,
        setBrowserPianoSoundOnMidi: handleSetBrowserSound,
        geminiApiKey,
        setGeminiApiKey,
        isSettingsOpen,
        setIsSettingsOpen,
        highlightedMidis,
        setHighlightedMidis,
      }}
    >
      {children}
    </PianoContext.Provider>
  );
}

export function usePiano() {
  const ctx = useContext(PianoContext);
  if (!ctx) {
    throw new Error("usePiano must be used within a PianoProvider");
  }
  return ctx;
}
