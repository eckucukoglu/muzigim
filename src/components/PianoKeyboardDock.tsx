"use client";

import React, { useMemo, useState } from "react";
import { usePiano } from "@/context/PianoContext";
import { midiToNoteName, midiToTurkishName, velocityToDynamic } from "@/data/curriculum";
import { Volume2, VolumeX, Usb, RefreshCw, Maximize2, Minimize2, Disc } from "lucide-react";

interface PianoKeyboardDockProps {
  targetMidi?: number | null;
  secondaryTargetMidis?: number[];
}

function isBlackKey(midi: number): boolean {
  const mod = midi % 12;
  return mod === 1 || mod === 3 || mod === 6 || mod === 8 || mod === 10;
}

export default function PianoKeyboardDock({
  targetMidi = null,
  secondaryTargetMidis = [],
}: PianoKeyboardDockProps) {
  const {
    midiStatus,
    midiDevices,
    selectedDeviceId,
    selectMidiDevice,
    refreshMidi,
    activeNotes,
    sustainPedal,
    sustainValue,
    recentNotes,
    detectedHarmony,
    triggerVirtualNoteOn,
    triggerVirtualNoteOff,
    browserPianoSoundOnMidi,
    setBrowserPianoSoundOnMidi,
    highlightedMidis,
  } = usePiano();

  const [full88Mode, setFull88Mode] = useState(false);

  // 49 keys (C2=36 to C6=84) by default for clear visibility, or full 88 keys (A0=21 to C8=108)
  const startMidi = full88Mode ? 21 : 36;
  const endMidi = full88Mode ? 108 : 84;

  const keys = useMemo(() => {
    const list: {
      midi: number;
      isBlack: boolean;
      note: string;
      turkish: string;
      isC: boolean;
      isMiddleC: boolean;
    }[] = [];
    for (let m = startMidi; m <= endMidi; m++) {
      const note = midiToNoteName(m);
      const turkish = midiToTurkishName(m);
      list.push({
        midi: m,
        isBlack: isBlackKey(m),
        note,
        turkish,
        isC: m % 12 === 0,
        isMiddleC: m === 60,
      });
    }
    return list;
  }, [startMidi, endMidi]);

  const whiteKeys = useMemo(() => keys.filter((k) => !k.isBlack), [keys]);

  const lastPlayed = recentNotes.length > 0 ? recentNotes[recentNotes.length - 1] : null;
  const lastDynamic = lastPlayed ? velocityToDynamic(lastPlayed.velocity) : null;

  return (
    <div className="w-full bg-[#0a0d14] border-t border-slate-800/90 shadow-2xl select-none z-30">
      {/* Roland FP-10 Top Telemetry Strip */}
      <div className="px-4 py-2 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Roland FP-10 Branding & MIDI Connection */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700/80">
            <span className="font-bold tracking-wider text-amber-400">ROLAND FP-10</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest">PHA-4 MIDI</span>
          </div>

          <div className="flex items-center gap-2">
            <Usb
              className={`w-4 h-4 ${
                midiStatus === "connected"
                  ? "text-emerald-400"
                  : midiStatus === "connecting"
                  ? "text-amber-400 animate-pulse"
                  : "text-slate-400"
              }`}
            />
            {midiStatus === "connected" ? (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <select
                  value={selectedDeviceId || ""}
                  onChange={(e) => selectMidiDevice(e.target.value)}
                  className="bg-slate-800 text-emerald-300 font-medium px-2 py-1 rounded border border-emerald-500/30 text-xs focus:outline-none"
                >
                  {midiDevices.map((d) => (
                    <option key={d.id} value={d.id}>
                      🎹 {d.name} (USB Bağlı)
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <span className="text-amber-300/90 font-medium">
                {midiStatus === "no-device"
                  ? "USB-MIDI Kablosu Bekleniyor (Fare veya A-L tuşlarıyla da çalabilirsiniz)"
                  : midiStatus === "unsupported"
                  ? "Tarayıcı Web MIDI desteklemiyor (Chrome/Edge önerilir)"
                  : "MIDI İzni Bekleniyor"}
              </span>
            )}

            <button
              onClick={refreshMidi}
              title="USB MIDI Bağlantısını Yenile"
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center: Live Note, Velocity & Harmony Readout */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Active Note / Velocity */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-800">
            <span className="text-slate-400">Son Tuş & Tuşe:</span>
            {lastPlayed ? (
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">
                  {lastPlayed.turkishName}{" "}
                  <span className="text-slate-400 font-normal">({lastPlayed.note})</span>
                </span>
                <span className={`font-bold px-1.5 py-0.5 rounded bg-slate-800 ${lastDynamic?.color}`}>
                  {lastDynamic?.symbol} ({lastPlayed.velocity})
                </span>
              </div>
            ) : (
              <span className="text-slate-500 italic">Tuşa basın...</span>
            )}
          </div>

          {/* Detected Chord / Interval */}
          {detectedHarmony.turkishChordName && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-950/60 border border-indigo-500/40 text-indigo-200">
              <span className="text-indigo-400 font-semibold">Armoni:</span>
              <span className="font-bold text-white">{detectedHarmony.turkishChordName}</span>
            </div>
          )}

          {/* Sustain Pedal Status */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition ${
              sustainPedal
                ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                : "bg-slate-900 border-slate-800 text-slate-400"
            }`}
          >
            <Disc className={`w-3.5 h-3.5 ${sustainPedal ? "text-amber-400 animate-spin" : ""}`} />
            <span>Pedal: {sustainPedal ? `Açık (${sustainValue})` : "Serbest"}</span>
          </div>
        </div>

        {/* Right: Audio Echo & 88-Key View Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBrowserPianoSoundOnMidi(!browserPianoSoundOnMidi)}
            title="Roland FP-10'un kendi hoparlörünü kullanıyorsanız çift ses olmaması için tarayıcı MIDI sesini kapatabilirsiniz."
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition ${
              browserPianoSoundOnMidi
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800"
            }`}
          >
            {browserPianoSoundOnMidi ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>MIDI Tarayıcı Sesi: Açık</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                <span>FP-10 Hoparlör Modu (MIDI Sesi Kapalı)</span>
              </>
            )}
          </button>

          <button
            onClick={() => setFull88Mode(!full88Mode)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs transition"
          >
            {full88Mode ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                <span>49 Tuş Yakınlaştır</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Tam 88 Tuş (FP-10)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Interactive Stage Piano Keys */}
      <div className="relative w-full h-36 sm:h-40 bg-[#07090e] px-2 pt-1 pb-2 overflow-x-auto">
        <div className="relative flex h-full min-w-[740px] w-full">
          {whiteKeys.map((wk) => {
            const isPressed = Boolean(activeNotes[wk.midi]);
            const isPrimaryTarget = targetMidi === wk.midi;
            const isSecondaryTarget =
              secondaryTargetMidis.includes(wk.midi) || highlightedMidis.includes(wk.midi);

            // Check if there is a black key immediately after this white key
            const nextMidi = wk.midi + 1;
            const hasBlackAfter = nextMidi <= endMidi && isBlackKey(nextMidi);
            const blackPressed = hasBlackAfter && Boolean(activeNotes[nextMidi]);
            const blackPrimaryTarget = hasBlackAfter && targetMidi === nextMidi;
            const blackSecondaryTarget =
              hasBlackAfter &&
              (secondaryTargetMidis.includes(nextMidi) || highlightedMidis.includes(nextMidi));

            return (
              <div
                key={wk.midi}
                className="relative flex-1 h-full select-none"
              >
                {/* White Key */}
                <button
                  onMouseDown={() => triggerVirtualNoteOn(wk.midi, 85)}
                  onMouseUp={() => triggerVirtualNoteOff(wk.midi)}
                  onMouseLeave={() => {
                    if (activeNotes[wk.midi]?.source === "virtual") {
                      triggerVirtualNoteOff(wk.midi);
                    }
                  }}
                  className={`w-full h-full rounded-b-md border transition-all flex flex-col justify-end items-center pb-1.5 ${
                    isPressed
                      ? "bg-gradient-to-b from-cyan-300 to-emerald-400 border-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.7)] translate-y-[2px]"
                      : isPrimaryTarget
                      ? "bg-gradient-to-b from-amber-100 via-amber-300 to-amber-400 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.75)]"
                      : isSecondaryTarget
                      ? "bg-gradient-to-b from-indigo-100 to-indigo-300 border-indigo-400"
                      : wk.isMiddleC
                      ? "bg-gradient-to-b from-slate-100 to-amber-50 border-amber-400/70 hover:from-white hover:to-amber-100"
                      : "bg-gradient-to-b from-slate-100 to-slate-200 border-slate-400/80 hover:from-white hover:to-slate-100"
                  }`}
                >
                  {isPrimaryTarget && (
                    <span className="mb-1 px-1 py-0.5 rounded bg-amber-600 text-white text-[9px] font-bold animate-bounce">
                      HEDEF
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-bold leading-tight ${
                      isPressed
                        ? "text-slate-950"
                        : wk.isMiddleC
                        ? "text-amber-700"
                        : wk.isC
                        ? "text-slate-800"
                        : "text-slate-500"
                    }`}
                  >
                    {!full88Mode || wk.isC ? wk.turkish : ""}
                  </span>
                  {(!full88Mode || wk.isC) && (
                    <span className="text-[9px] text-slate-400 leading-none">
                      {wk.note}
                    </span>
                  )}
                </button>

                {/* Black Key (if present on right boundary) */}
                {hasBlackAfter && (
                  <button
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      triggerVirtualNoteOn(nextMidi, 85);
                    }}
                    onMouseUp={(e) => {
                      e.stopPropagation();
                      triggerVirtualNoteOff(nextMidi);
                    }}
                    onMouseLeave={() => {
                      if (activeNotes[nextMidi]?.source === "virtual") {
                        triggerVirtualNoteOff(nextMidi);
                      }
                    }}
                    className={`absolute top-0 -right-[32%] w-[64%] h-[62%] z-20 rounded-b-md border transition-all flex flex-col justify-end items-center pb-1.5 ${
                      blackPressed
                        ? "bg-gradient-to-b from-emerald-400 to-cyan-500 border-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.8)] translate-y-[2px]"
                        : blackPrimaryTarget
                        ? "bg-gradient-to-b from-amber-400 to-amber-600 border-amber-300 shadow-[0_0_14px_rgba(245,158,11,0.9)]"
                        : blackSecondaryTarget
                        ? "bg-gradient-to-b from-indigo-500 to-violet-700 border-indigo-400"
                        : "bg-gradient-to-b from-slate-800 via-slate-900 to-black border-slate-700 hover:from-slate-700 hover:to-slate-900"
                    }`}
                  >
                    {!full88Mode && (
                      <span className="text-[8px] font-semibold text-slate-300 leading-none">
                        {midiToTurkishName(nextMidi).replace(/\d+$/, "")}
                      </span>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
