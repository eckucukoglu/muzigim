import { Chord, Note, Scale } from "tonal";
import { midiToNoteName, midiToTurkishName, TURKISH_NOTE_NAMES } from "@/data/curriculum";

export interface DetectedHarmony {
  chordSymbol: string | null;
  turkishChordName: string | null;
  intervalName: string | null;
  semitones: number | null;
  moodDescription: string | null;
  suggestedNextChords: string[];
}

const INTERVAL_NAMES_TR: Record<number, { name: string; feel: string }> = {
  0: { name: "Tam Birli (Unison)", feel: "Aynı ses, tam odak" },
  1: { name: "Küçük İkili (Yarım Ses / Minor 2nd)", feel: "Yüksek gerilim, gizemli (Jaws teması)" },
  2: { name: "Büyük İkili (Tam Ses / Major 2nd)", feel: "Doğal adım, melodik yürüyüş" },
  3: { name: "Küçük Üçlü (Minor 3rd)", feel: "Hüzünlü, derin, içsel (Minör karakteri)" },
  4: { name: "Büyük Üçlü (Major 3rd)", feel: "Aydınlık, sıcak, neşeli (Majör karakteri)" },
  5: { name: "Tam Dörtlü (Perfect 4th)", feel: "Çağrı, marş, askeri/epik kararlılık" },
  6: { name: "Artık Dörtlü / Eksik Beşli (Triton)", feel: "Maksimum armonik gerilim, çözülmeyi bekleyen enerji" },
  7: { name: "Tam Beşli (Perfect 5th)", feel: "Güçlü, dengeli, uzay boşluğu gibi açık (Star Wars)" },
  8: { name: "Küçük Altılı (Minor 6th)", feel: "Sinematik, romantik-melankolik sıçrama" },
  9: { name: "Büyük Altılı (Major 6th)", feel: "Pastoral, lirik, sevecen" },
  10: { name: "Küçük Yedili (Minor 7th)", feel: "Caz, blues ve dominant gerilimi" },
  11: { name: "Büyük Yedili (Major 7th)", feel: "Rüya gibi, sofistike, modern caz/lofi tınısı" },
  12: { name: "Tam Sekizli (Oktav)", feel: "Kusursuz bütünlük, iki kat frekans" },
};

export function translateChordToTurkish(symbol: string): {
  turkishName: string;
  mood: string;
} {
  const chord = Chord.get(symbol);
  const tonic = chord.tonic ? TURKISH_NOTE_NAMES[chord.tonic] || chord.tonic : "";
  const type = chord.type || "";

  if (type === "major" || symbol === chord.tonic) {
    return {
      turkishName: `${tonic} Majör (${symbol})`,
      mood: "Aydınlık, dengeli, kararlı ve pozitif.",
    };
  }
  if (type === "minor" || symbol.endsWith("m")) {
    return {
      turkishName: `${tonic} Minör (${symbol})`,
      mood: "Duygusal, melankolik, derin ve içsel.",
    };
  }
  if (symbol.includes("maj7") || symbol.includes("M7")) {
    return {
      turkishName: `${tonic} Majör Yedili (${symbol})`,
      mood: "Rüya gibi, sıcak, sofistike (Caz / Lo-Fi tınısı).",
    };
  }
  if (symbol.includes("m7")) {
    return {
      turkishName: `${tonic} Minör Yedili (${symbol})`,
      mood: "Yumuşak hüzün, modern soul/caz akıcılığı.",
    };
  }
  if (symbol.includes("7")) {
    return {
      turkishName: `${tonic} Dominant Yedili (${symbol})`,
      mood: "Güçlü çekim ve gerilim; kök akora (Eve) çözülmek ister.",
    };
  }
  if (symbol.includes("dim")) {
    return {
      turkishName: `${tonic} Eksik (Diminished) Akor (${symbol})`,
      mood: "Dramatik gerilim ve gizemli geçiş akoru.",
    };
  }
  if (symbol.includes("sus4")) {
    return {
      turkishName: `${tonic} Asılı Dörtlü (${symbol})`,
      mood: "Havada asılı kalan, 3'lüye çözülmeyi bekleyen ferah tını.",
    };
  }
  if (symbol.includes("sus2")) {
    return {
      turkishName: `${tonic} Asılı İkili (${symbol})`,
      mood: "Modern, açık ve ferah atmosferik tını.",
    };
  }

  return {
    turkishName: `${tonic} ${symbol}`,
    mood: "Zengin çok sesli armonik yapı.",
  };
}

export function analyzeActiveMidis(midis: number[]): DetectedHarmony {
  const sorted = [...midis].sort((a, b) => a - b);
  if (sorted.length < 2) {
    return {
      chordSymbol: null,
      turkishChordName: null,
      intervalName: null,
      semitones: null,
      moodDescription: null,
      suggestedNextChords: [],
    };
  }

  if (sorted.length === 2) {
    const diff = sorted[1] - sorted[0];
    const modDiff = diff <= 12 ? diff : diff % 12;
    const info = INTERVAL_NAMES_TR[modDiff] || {
      name: `${diff} Yarım Ses Aralık`,
      feel: "Geniş melodik aralık",
    };
    return {
      chordSymbol: `${midiToTurkishName(sorted[0])} + ${midiToTurkishName(sorted[1])}`,
      turkishChordName: info.name,
      intervalName: info.name,
      semitones: diff,
      moodDescription: info.feel,
      suggestedNextChords: ["Üçüncü bir nota ekleyerek tam bir Triad (Akor) oluşturmayı deneyin!"],
    };
  }

  const noteNamesWithOctave = sorted.map((m) => midiToNoteName(m));
  const pitchClasses = sorted.map((m) => Note.pitchClass(midiToNoteName(m)));
  const detected = Chord.detect(noteNamesWithOctave);
  const fallbackDetected = detected.length > 0 ? detected : Chord.detect(pitchClasses);

  if (fallbackDetected.length > 0) {
    const primary = fallbackDetected[0].replace(/\/.*$/, ""); // clean slash if simple
    const fullSymbol = fallbackDetected[0];
    const tr = translateChordToTurkish(primary);

    const rootPc = Chord.get(primary).tonic || pitchClasses[0];
    const scaleChords = rootPc
      ? [
          `${rootPc} (I)`,
          `${Note.transpose(rootPc, "4P")} (IV)`,
          `${Note.transpose(rootPc, "5P")} (V)`,
          `${Note.transpose(rootPc, "6M")}m (vi)`,
        ]
      : ["C (Do Majör)", "F (Fa Majör)", "G (Sol Majör)", "Am (La Minör)"];

    return {
      chordSymbol: fullSymbol,
      turkishChordName: tr.turkishName,
      intervalName: null,
      semitones: null,
      moodDescription: tr.mood,
      suggestedNextChords: scaleChords,
    };
  }

  return {
    chordSymbol: sorted.map((m) => midiToTurkishName(m)).join(" - "),
    turkishChordName: "Özel Ses Kümesi / Polifoni",
    intervalName: null,
    semitones: null,
    moodDescription: "Deneysel / Modern armonik tını",
    suggestedNextChords: ["Do Majör (Do-Mi-Sol)", "La Minör (La-Do-Mi)", "Fa Majör (Fa-La-Do)"],
  };
}

export function getScaleNotes(root: string, scaleType: string): {
  midis: number[];
  turkishNames: string[];
  formula: string;
} {
  const scale = Scale.get(`${root} ${scaleType}`);
  const rootMidi = Note.midi(`${root}4`) || 60;
  const intervals = scale.intervals;
  const midis = intervals.map((ivl) => {
    const n = Note.transpose(`${root}4`, ivl);
    return Note.midi(n) || rootMidi;
  });
  // Add octave on top
  midis.push(rootMidi + 12);

  const turkishNames = midis.map((m) => midiToTurkishName(m));
  const formulas: Record<string, string> = {
    major: "T - T - Y - T - T - T - Y (Neşeli, Aydınlık, Kararlı)",
    minor: "T - Y - T - T - Y - T - T (Doğal Minör: Duygusal, Melankolik)",
    "major pentatonic": "1 - 2 - 3 - 5 - 6 (Yanlış Nota Olmayan Aydınlık Doğaçlama Dizisi)",
    "minor pentatonic": "1 - b3 - 4 - 5 - b7 (Sinematik, Blues ve Rock Doğaçlama Dizisi)",
    "harmonic minor": "T - Y - T - T - Y - 1.5T - Y (Doğu/Klasik Dramatik Tınısı)",
    dorian: "T - Y - T - T - T - Y - T (Caz, Funk ve Film Müziği Minörü)",
  };

  return {
    midis,
    turkishNames,
    formula: formulas[scaleType] || "Özel Gam Yapısı",
  };
}
