"use client";

import React, { useEffect, useState } from "react";
import { usePiano } from "@/context/PianoContext";
import { KeyRound, X, CheckCircle2, Usb, Sliders } from "lucide-react";

export default function SettingsModal() {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    geminiApiKey,
    setGeminiApiKey,
    browserPianoSoundOnMidi,
    setBrowserPianoSoundOnMidi,
    midiStatus,
    midiDevices,
  } = usePiano();

  const [keyInput, setKeyInput] = useState(geminiApiKey);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setKeyInput(geminiApiKey);
  }, [geminiApiKey, isSettingsOpen]);

  if (!isSettingsOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setGeminiApiKey(keyInput);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      setIsSettingsOpen(false);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">
              Roland FP-10 & Gemini AI Öğretmen Ayarları
            </h2>
          </div>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Gemini API Key Section */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-amber-300">
              <KeyRound className="w-4 h-4" />
              <span>Gemini API Anahtarı (AI Müzik Öğretmeni İçin)</span>
            </label>
            <p className="text-xs text-slate-400 leading-relaxed">
              Google AI Studio üzerinden aldığınız Gemini API anahtarınızı buraya girebilirsiniz. Anahtarınız yalnızca kendi tarayıcınızda (<code>localStorage</code>) saklanır. Alternatif olarak proje kök dizinindeki <code>.env.local</code> dosyasına <code>GEMINI_API_KEY=...</code> olarak da ekleyebilirsiniz.
            </p>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none"
            />
          </div>

          {/* Audio Routing Preference */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-white">
                  USB-MIDI Tuşlarında Tarayıcı Sesi Üretilsin mi?
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Roland FP-10 kendi hoparlöründen veya kulaklık çıkışından zaten gerçek SuperNATURAL piyano sesi verir. Çift ses duymamak için bu ayarı kapalı tutmanız önerilir.
                </p>
              </div>
              <input
                type="checkbox"
                checked={browserPianoSoundOnMidi}
                onChange={(e) => setBrowserPianoSoundOnMidi(e.target.checked)}
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Roland FP-10 USB-B Connection Guide */}
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase">
              <Usb className="w-4 h-4" />
              <span>Roland FP-10 BK USB-MIDI Bağlantı Rehberi</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
              <li>
                Piyanonuzun arka panelindeki kare şeklindeki <strong>USB COMPUTER (USB-B / Yazıcı Kablosu)</strong> portunu bilgisayarınızın USB-A veya USB-C girişine bağlayın. (Yandaki <em>USB MEMORY</em> portu yalnızca flash bellek içindir, bilgisayara bağlamak için <strong>USB COMPUTER</strong> portunu kullanın).
              </li>
              <li>
                Ek sürücü kurmanıza gerek yoktur; Roland FP-10 &quot;Class-Compliant USB MIDI&quot; destekler ve açıldığı an otomatik tanınır.
              </li>
              <li>
                <strong>Şu Anki Durum:</strong>{" "}
                {midiStatus === "connected" ? (
                  <span className="text-emerald-400 font-semibold">
                    Bağlı ({midiDevices.map((d) => d.name).join(", ")})
                  </span>
                ) : (
                  <span className="text-amber-300">
                    Henüz USB-MIDI cihazı algılanmadı (Kabloyu takıp piyanonuzu açtığınızda otomatik bağlanır).
                  </span>
                )}
              </li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Kapat
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition"
            >
              {savedNotice ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Kaydedildi!</span>
                </>
              ) : (
                <span>Ayarları Kaydet</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
