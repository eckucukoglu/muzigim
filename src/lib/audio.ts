"use client";

import * as Tone from "tone";
import { midiToNoteName } from "@/data/curriculum";

class SoundEngine {
  private synth: Tone.PolySynth | null = null;
  private metronomeSynth: Tone.MembraneSynth | null = null;
  private reverb: Tone.Reverb | null = null;
  private isCreated = false;
  private initPromise: Promise<void> | null = null;
  private activeMidis = new Set<number>();
  private autoReleaseTimers = new Map<number, ReturnType<typeof setTimeout>>();
  private gestureListenerAttached = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.attachGlobalUnlockListener();
    }
  }

  private attachGlobalUnlockListener() {
    if (this.gestureListenerAttached || typeof window === "undefined") return;
    this.gestureListenerAttached = true;

    const unlock = () => {
      if (Tone.getContext().state !== "running") {
        Tone.start().catch(() => {
          // Ignore if not allowed yet
        });
      }
      this.ensureNodesCreated();
    };

    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("keydown", unlock, { passive: true });
  }

  private ensureNodesCreated() {
    if (this.isCreated || typeof window === "undefined") return;
    try {
      this.reverb = new Tone.Reverb({
        decay: 1.8,
        wet: 0.18,
      }).toDestination();

      // Piano-style percussive envelope: sustain is 0 so a note naturally
      // decays like a struck string and can NEVER drone infinitely.
      this.synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: "triangle8",
        },
        envelope: {
          attack: 0.006,
          decay: 2.2,
          sustain: 0.0,
          release: 0.45,
        },
      }).connect(this.reverb);
      this.synth.maxPolyphony = 24;

      this.metronomeSynth = new Tone.MembraneSynth({
        pitchDecay: 0.008,
        octaves: 2,
        envelope: {
          attack: 0.001,
          decay: 0.08,
          sustain: 0,
          release: 0.05,
        },
      }).toDestination();
      this.metronomeSynth.volume.value = -10;

      this.isCreated = true;
    } catch (e) {
      console.warn("Ses düğümleri oluşturulamadı:", e);
    }
  }

  public async init(fromUserGesture = true): Promise<boolean> {
    if (typeof window === "undefined") return false;
    this.ensureNodesCreated();

    if (Tone.getContext().state === "running") {
      return true;
    }

    // Web MIDI messages are not browser user gestures; calling Tone.start()
    // during a MIDI event without a gesture queues a pending promise that
    // fires later when the user clicks the screen, causing stuck notes.
    if (!fromUserGesture) {
      return false;
    }

    if (!this.initPromise) {
      this.initPromise = Tone.start()
        .catch((e) => {
          console.warn("Ses motoru başlatılamadı:", e);
        })
        .finally(() => {
          this.initPromise = null;
        });
    }

    await this.initPromise;
    return Tone.getContext().state === "running";
  }

  private clearWatchdog(midi: number) {
    const timer = this.autoReleaseTimers.get(midi);
    if (timer) {
      clearTimeout(timer);
      this.autoReleaseTimers.delete(midi);
    }
  }

  public async noteOn(
    midi: number,
    velocity = 80,
    source: "midi" | "virtual" = "virtual"
  ) {
    if (typeof window === "undefined") return;
    this.ensureNodesCreated();

    this.activeMidis.add(midi);
    this.clearWatchdog(midi);

    const isReady = await this.init(source === "virtual");
    if (!isReady || !this.synth) {
      this.activeMidis.delete(midi);
      return;
    }

    // If the note was already released while awaiting audio context unlock, abort!
    if (!this.activeMidis.has(midi)) {
      return;
    }

    const noteName = midiToNoteName(midi);
    const normalizedVel = Math.max(0.1, Math.min(1, velocity / 127));
    try {
      // Release any existing voice on the same pitch before re-attacking
      this.synth.triggerRelease(noteName, Tone.now());
      this.synth.triggerAttack(noteName, Tone.now() + 0.002, normalizedVel);

      // Safety watchdog: ensure no note can stay active forever if a noteOff is missed
      const timer = setTimeout(() => {
        this.noteOff(midi);
      }, 4500);
      this.autoReleaseTimers.set(midi, timer);
    } catch {
      // Ignore polyphony overflow
    }
  }

  public noteOff(midi: number) {
    this.activeMidis.delete(midi);
    this.clearWatchdog(midi);

    if (!this.synth) return;
    const noteName = midiToNoteName(midi);
    try {
      // Offset by +0.005s so release is always scheduled strictly after attack
      this.synth.triggerRelease(noteName, Tone.now() + 0.005);

      // If no keys are currently held down, force-release all voices to prevent any hanging voice
      if (this.activeMidis.size === 0) {
        this.synth.releaseAll(Tone.now() + 0.01);
      }
    } catch {
      // Ignore
    }
  }

  public stopAll() {
    this.activeMidis.clear();
    this.autoReleaseTimers.forEach((timer) => clearTimeout(timer));
    this.autoReleaseTimers.clear();
    if (!this.synth) return;
    try {
      this.synth.releaseAll(Tone.now());
    } catch {
      // Ignore
    }
  }

  public async playNoteDuration(midi: number, duration: string = "4n", velocity = 85) {
    if (typeof window === "undefined") return;
    const ready = await this.init(true);
    if (!ready || !this.synth) return;

    const noteName = midiToNoteName(midi);
    const normalizedVel = Math.max(0.15, Math.min(1, velocity / 127));
    try {
      this.synth.triggerAttackRelease(noteName, duration, Tone.now(), normalizedVel);
    } catch {
      // Ignore
    }
  }

  public async playSequence(
    notes: { midi: number; durationMs?: number; delayMs: number; velocity?: number }[]
  ) {
    if (typeof window === "undefined") return;
    const ready = await this.init(true);
    if (!ready || !this.synth) return;

    const now = Tone.now();
    for (const item of notes) {
      const noteName = midiToNoteName(item.midi);
      const vel = Math.max(0.2, Math.min(1, (item.velocity ?? 85) / 127));
      const durSec = (item.durationMs ?? 500) / 1000;
      try {
        this.synth.triggerAttackRelease(noteName, durSec, now + item.delayMs / 1000, vel);
      } catch {
        // Ignore
      }
    }
  }

  public async playChord(midis: number[], durationSec = 1.2, velocity = 80) {
    if (typeof window === "undefined") return;
    const ready = await this.init(true);
    if (!ready || !this.synth) return;

    const noteNames = midis.map((m) => midiToNoteName(m));
    const vel = Math.max(0.2, Math.min(1, velocity / 127));
    try {
      this.synth.triggerAttackRelease(noteNames, durationSec, Tone.now(), vel);
    } catch {
      // Ignore
    }
  }

  public async playMetronomeClick(isAccent = false) {
    if (typeof window === "undefined") return;
    const ready = await this.init(true);
    if (!ready || !this.metronomeSynth) return;

    try {
      this.metronomeSynth.triggerAttackRelease(
        isAccent ? "C5" : "G4",
        "32n",
        Tone.now(),
        isAccent ? 0.8 : 0.45
      );
    } catch {
      // Ignore
    }
  }
}

export const soundEngine = new SoundEngine();
