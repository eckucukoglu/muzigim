"use client";

import React, { useEffect, useRef } from "react";
import { ExerciseNote, midiToNoteName, midiToTurkishName } from "@/data/curriculum";

interface StaffVisualizerProps {
  targetNotes?: ExerciseNote[];
  currentStepIndex?: number;
  activeMidis?: number[];
  wrongMidi?: number | null;
  mode?: "exercise" | "live";
}

function midiToVexKey(midi: number): { key: string; accidental: string | null } {
  const noteName = midiToNoteName(midi); // e.g., "C#4", "Eb4", "F4"
  const match = noteName.match(/^([A-G])([#b]?)(-?\d+)$/);
  if (!match) return { key: "c/4", accidental: null };
  const [, letter, acc, octave] = match;
  return {
    key: `${letter.toLowerCase()}${acc}/${octave}`,
    accidental: acc || null,
  };
}

export default function StaffVisualizer({
  targetNotes = [],
  currentStepIndex = 0,
  activeMidis = [],
  wrongMidi = null,
  mode = "exercise",
}: StaffVisualizerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function renderStaff() {
      if (!containerRef.current || typeof window === "undefined") return;
      const VF = await import("vexflow");
      if (!isMounted || !containerRef.current) return;

      const container = containerRef.current;
      container.innerHTML = "";

      const width = Math.max(580, container.clientWidth || 720);
      const height = 195;

      const renderer = new VF.Renderer(container, VF.Renderer.Backends.SVG);
      renderer.resize(width, height);
      const context = renderer.getContext();
      context.setFont("Inter, sans-serif", 11);

      const stave = new VF.Stave(16, 22, width - 32);
      stave.addClef("treble").addTimeSignature("4/4");
      stave.setStyle({ strokeStyle: "#64748b", fillStyle: "#94a3b8" });
      stave.setContext(context).draw();

      if (mode === "exercise" && targetNotes.length > 0) {
        // Slice window if more than 12 notes so it always fits cleanly
        const windowSize = 12;
        const startIdx =
          targetNotes.length > windowSize
            ? Math.min(
                Math.max(0, currentStepIndex - 3),
                targetNotes.length - windowSize
              )
            : 0;
        const visibleNotes = targetNotes.slice(startIdx, startIdx + windowSize);

        const staveNotes = visibleNotes.map((item, idx) => {
          const globalIdx = startIdx + idx;
          const { key, accidental } = midiToVexKey(item.midi);
          const sn = new VF.StaveNote({
            clef: "treble",
            keys: [key],
            duration: item.duration || "q",
            auto_stem: true,
          });

          if (accidental) {
            sn.addModifier(new VF.Accidental(accidental), 0);
          }

          // Label: Turkish note name + finger number
          const labelText = item.finger
            ? `${item.turkishName} (${item.finger})`
            : item.turkishName;
          const annotation = new VF.Annotation(labelText)
            .setFont("Inter", 10, "bold")
            .setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM);
          sn.addModifier(annotation, 0);

          if (globalIdx < currentStepIndex) {
            // Completed note -> Emerald
            sn.setStyle({ fillStyle: "#10b981", strokeStyle: "#10b981" });
          } else if (globalIdx === currentStepIndex) {
            // Current target note -> Amber (or Rose if wrong note pressed right now)
            if (wrongMidi !== null) {
              sn.setStyle({ fillStyle: "#f43f5e", strokeStyle: "#f43f5e" });
            } else {
              sn.setStyle({ fillStyle: "#f59e0b", strokeStyle: "#f59e0b" });
            }
          } else {
            // Upcoming note -> Slate
            sn.setStyle({ fillStyle: "#e2e8f0", strokeStyle: "#cbd5e1" });
          }

          return sn;
        });

        const voice = new VF.Voice({
          num_beats: visibleNotes.length,
          beat_value: 4,
        }).setStrict(false);
        voice.addTickables(staveNotes);

        new VF.Formatter().joinVoices([voice]).format([voice], width - 125);
        voice.draw(context, stave);
      } else {
        // Live mode: render currently pressed keys on the staff
        const midisToDraw = activeMidis.length > 0 ? [...activeMidis].sort((a, b) => a - b) : [60];
        const keys = midisToDraw.map((m) => midiToVexKey(m).key);
        const sn = new VF.StaveNote({
          clef: "treble",
          keys,
          duration: "w",
        });

        midisToDraw.forEach((m, i) => {
          const { accidental } = midiToVexKey(m);
          if (accidental) {
            sn.addModifier(new VF.Accidental(accidental), i);
          }
        });

        const label =
          activeMidis.length > 0
            ? midisToDraw.map((m) => midiToTurkishName(m)).join(" + ")
            : "Orta Do (Do4) - Piyanoda bir tuşa basın";

        const annotation = new VF.Annotation(label)
          .setFont("Inter", 11, "bold")
          .setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM);
        sn.addModifier(annotation, 0);

        sn.setStyle({
          fillStyle: activeMidis.length > 0 ? "#38bdf8" : "#64748b",
          strokeStyle: activeMidis.length > 0 ? "#38bdf8" : "#64748b",
        });

        const voice = new VF.Voice({ num_beats: 4, beat_value: 4 }).setStrict(false);
        voice.addTickables([sn]);
        new VF.Formatter().joinVoices([voice]).format([voice], width - 140);
        voice.draw(context, stave);
      }

      // Style SVG lines for dark mode readability
      const svg = container.querySelector("svg");
      if (svg) {
        svg.style.width = "100%";
        svg.style.height = "100%";
        svg.style.overflow = "visible";
      }
    }

    renderStaff();
    window.addEventListener("resize", renderStaff);
    return () => {
      isMounted = false;
      window.removeEventListener("resize", renderStaff);
    };
  }, [targetNotes, currentStepIndex, activeMidis, wrongMidi, mode]);

  return (
    <div className="relative w-full rounded-xl bg-slate-900/90 border border-slate-800/90 px-4 py-2 shadow-inner overflow-x-auto">
      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
        <div className="flex items-center gap-3">
          <span className="font-medium text-slate-300">🎼 Canlı İnteraktif Porte</span>
          {mode === "exercise" && (
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Tamamlandı
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Sıradaki Hedef Nota
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" /> Bekleyen
              </span>
            </div>
          )}
        </div>
        <div className="text-[11px] text-slate-400">
          Parantez içi rakamlar önerilen{" "}
          <span className="text-amber-400 font-medium">parmak numaralarıdır (1=Başparmak ... 5=Serçe)</span>
        </div>
      </div>
      <div
        ref={containerRef}
        className="w-full min-h-[185px] flex items-center justify-center [&_.vf-annotation_text]:fill-amber-300 [&_.vf-Clef_path]:fill-slate-300 [&_.vf-TimeSig_path]:fill-slate-300"
      />
    </div>
  );
}
