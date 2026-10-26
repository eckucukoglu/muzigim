"use client";

import * as Tone from "tone";
import { midiToNoteName } from "@/data/curriculum";

class SoundEngine {
  private synth: Tone.PolySynth | null = null;
  private metronomeSynth: Tone.MembraneSynth | null = null;
  private reverb: Tone.Reverb | null = null;
  private isInitialized = false;

  public async init() {
    if (this.isInitialized || typeof window === "undefined") return;
    try {
      await Tone.start();
      this.reverb = new Tone.Reverb({
        decay: 2.2,
        wet: 0.22,
      }).toDestination();

      this.synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: "triangle8",
        },
        envelope: {
          attack: 0.008,
          decay: 0.8,
          sustain: 0.25,
          release: 1.4,
        },
      }).connect(this.reverb);
      this.synth.maxPolyphony = 16;

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

      this.isInitialized = true;
    } catch (e) {
      console.warn("Ses motoru başlatılamadı:", e);
    }
  }

  public async noteOn(midi: number, velocity = 80) {
    if (typeof window === "undefined") return;
    if (!this.isInitialized) await this.init();
    if (!this.synth) return;

    const noteName = midiToNoteName(midi);
    const normalizedVel = Math.max(0.1, Math.min(1, velocity / 127));
    try {
      this.synth.triggerAttack(noteName, Tone.now(), normalizedVel);
    } catch {
      // Ignore polyphony overflow
    }
  }

  public noteOff(midi: number) {
    if (!this.synth) return;
    const noteName = midiToNoteName(midi);
    try {
      this.synth.triggerRelease(noteName, Tone.now());
    } catch {
      // Ignore
    }
  }

  public async playNoteDuration(midi: number, duration: string = "4n", velocity = 85) {
    if (typeof window === "undefined") return;
    if (!this.isInitialized) await this.init();
    if (!this.synth) return;

    const noteName = midiToNoteName(midi);
    const normalizedVel = Math.max(0.15, Math.min(1, velocity / 127));
    this.synth.triggerAttackRelease(noteName, duration, Tone.now(), normalizedVel);
  }

  public async playSequence(
    notes: { midi: number; durationMs?: number; delayMs: number; velocity?: number }[]
  ) {
    if (typeof window === "undefined") return;
    if (!this.isInitialized) await this.init();
    if (!this.synth) return;

    const now = Tone.now();
    for (const item of notes) {
      const noteName = midiToNoteName(item.midi);
      const vel = Math.max(0.2, Math.min(1, (item.velocity ?? 85) / 127));
      const durSec = (item.durationMs ?? 500) / 1000;
      this.synth.triggerAttackRelease(noteName, durSec, now + item.delayMs / 1000, vel);
    }
  }

  public async playChord(midis: number[], durationSec = 1.2, velocity = 80) {
    if (typeof window === "undefined") return;
    if (!this.isInitialized) await this.init();
    if (!this.synth) return;

    const noteNames = midis.map((m) => midiToNoteName(m));
    const vel = Math.max(0.2, Math.min(1, velocity / 127));
    this.synth.triggerAttackRelease(noteNames, durationSec, Tone.now(), vel);
  }

  public async playMetronomeClick(isAccent = false) {
    if (typeof window === "undefined") return;
    if (!this.isInitialized) await this.init();
    if (!this.metronomeSynth) return;

    this.metronomeSynth.triggerAttackRelease(isAccent ? "C5" : "G4", "32n", Tone.now(), isAccent ? 0.8 : 0.45);
  }
}

export const soundEngine = new SoundEngine();
