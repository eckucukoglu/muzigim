export interface ExerciseNote {
  midi: number;
  note: string; // e.g. "C4"
  turkishName: string; // e.g. "Do4"
  duration: "w" | "h" | "q" | "8"; // VexFlow duration
  finger?: number; // 1-5 finger number recommendation
  hand?: "R" | "L" | "BOTH";
  targetVelocity?: "p" | "mf" | "f";
  chordNotes?: number[]; // If multiple notes should be played together or sequentially
}

export interface Lesson {
  id: string;
  moduleId: string;
  order: number;
  title: string;
  subtitle: string;
  durationMin: number;
  level: "Başlangıç" | "Temel Teori" | "Kulak & Algı" | "Yaratıcılık";
  summary: string;
  theorySections: {
    heading: string;
    content: string;
    keyTakeaway: string;
    tryOnPianoTip?: string;
  }[];
  exercise: {
    title: string;
    description: string;
    instructions: string[];
    clef: "treble" | "bass" | "grand";
    bpm: number;
    mode: "sequence" | "chord";
    targetNotes: ExerciseNote[];
    aiCoachFocus: string;
  };
  quickQuestions: string[];
}

export interface CurriculumModule {
  id: string;
  number: number;
  title: string;
  description: string;
  iconName: string;
  color: string;
  lessons: Lesson[];
}

export const TURKISH_NOTE_NAMES: Record<string, string> = {
  C: "Do",
  "C#": "Do#",
  Db: "Reb",
  D: "Re",
  "D#": "Re#",
  Eb: "Mib",
  E: "Mi",
  F: "Fa",
  "F#": "Fa#",
  Gb: "Solb",
  G: "Sol",
  "G#": "Sol#",
  Ab: "Lab",
  A: "La",
  "A#": "La#",
  Bb: "Sib",
  B: "Si",
};

export function midiToNoteName(midi: number): string {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const octave = Math.floor(midi / 12) - 1;
  const note = names[midi % 12];
  return `${note}${octave}`;
}

export function midiToTurkishName(midi: number): string {
  const names = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];
  const octave = Math.floor(midi / 12) - 1;
  const note = names[midi % 12];
  return `${note}${octave}`;
}

export function velocityToDynamic(velocity: number): {
  symbol: string;
  label: string;
  color: string;
} {
  if (velocity < 30) return { symbol: "pp", label: "Pianissimo (Çok Hafif)", color: "text-sky-300" };
  if (velocity < 52) return { symbol: "p", label: "Piano (Yumuşak)", color: "text-cyan-400" };
  if (velocity < 75) return { symbol: "mp", label: "Mezzo-Piano (Orta Yumuşak)", color: "text-emerald-400" };
  if (velocity < 96) return { symbol: "mf", label: "Mezzo-Forte (Orta Güçlü)", color: "text-amber-400" };
  if (velocity < 114) return { symbol: "f", label: "Forte (Güçlü)", color: "text-orange-400" };
  return { symbol: "ff", label: "Fortissimo (Çok Güçlü)", color: "text-rose-400" };
}

export const CURRICULUM_MODULES: CurriculumModule[] = [
  {
    id: "modul-1",
    number: 1,
    title: "Sesin Doğası & Piyano ile İlk Temas",
    description:
      "Roland FP-10'un PHA-4 klavyesini tanıma, sesin fiziği, tuş haritası, oturuş/el pozisyonu ve ilk bilinçli dokunuşlar.",
    iconName: "Piano",
    color: "from-amber-500/20 to-orange-600/10 border-amber-500/30",
    lessons: [
      {
        id: "ders-1-1",
        moduleId: "modul-1",
        order: 1,
        title: "Ses Nedir? Frekans, Oktav ve PHA-4 Tuş Dinamikleri",
        subtitle: "Piyanoya sadece basmak değil, tuştan şarkı söyletmek",
        durationMin: 15,
        level: "Başlangıç",
        summary:
          "Müziğin ham maddesi olan ses titreşimlerini, kalın/ince (frekans) kavramını ve Roland FP-10'unuzun çekici mekanizmasıyla duyguları şiddet (velocity) üzerinden nasıl kontrol edeceğinizi öğrenin.",
        theorySections: [
          {
            heading: "1. Ses Nasıl Oluşur? (Titreşim ve Frekans)",
            content:
              "Müzik, havadaki düzenli basınç dalgalarının kulağımıza ulaşmasıdır. Bir piyano tuşuna bastığınızda (gerçek akustik piyanoda çekiç tellere vurur, Roland FP-10'da ise SuperNATURAL ses motoru bu telin tüm rezonansını modeller) saniyede belirli sayıda titreşim oluşur. Saniyedeki titreşim sayısına **Frekans (Hertz - Hz)** denir. Piyanonun **sol tarafına** gittikçe teller uzar ve kalınlaşır (frekans düşer, ses pesleşir); **sağ tarafına** gittikçe teller kısalır (frekans yükselir, ses tizleşir).",
            keyTakeaway:
              "Piyanoda sola gitmek = Kalın (Pes) sesler, sağa gitmek = İnce (Tiz) sesler demektir. Müzikte 'yüksek ses' ince sesi değil, gür (şiddetli) sesi ifade eder!",
            tryOnPianoTip:
              "Şimdi FP-10'unuzun en solundaki tuşa (A0) ve en sağındaki tuşa (C8) sırayla basın. Göğsünüzde hissettiğiniz bas titreşim ile kristal tiz ses arasındaki farkı dinleyin.",
          },
          {
            heading: "2. Tuş Ağırlığı ve Dinamikler (Piano & Forte)",
            content:
              "Enstrümanınızın adı neden **Piyano**? Aslında tam adı *Pianoforte*'dir! İtalyancada **piano (p)** 'yumuşak/hafif', **forte (f)** ise 'güçlü/gür' demektir. Roland FP-10'unuzda bulunan **PHA-4 Standard** klavye, gerçek bir kuyruklu piyanonun çekiç ağırlığını taklit eder. Tuşa ne kadar hızlı indirirseniz (MIDI dilinde buna **Velocity [0-127]** denir), sadece sesin yüksekliği değil, sesin **tınısı (parlaklığı)** da değişir.",
            keyTakeaway:
              "İyi bir müzisyen tuşa parmağıyla 'vurmaz'; kol ağırlığını parmak ucuna aktararak tuşun dibine kadar kontrollü iner.",
            tryOnPianoTip:
              "Orta Do (C4) tuşuna önce tüy gibi yavaşça (velocity < 45) basın, ardından kol ağırlığınızla kararlı ve hızlıca (velocity > 95) basın. Sesin sadece volümünün değil, karakterinin nasıl parlaklaştığını fark edin!",
          },
          {
            heading: "3. Parmak Numaraları ve Doğal Kubbe Duruşu",
            content:
              "Piyanoda iki elimizde de parmak numaraları **başparmaktan başlayarak 1'den 5'e kadar** numaralandırılır:\n• **1:** Başparmak\n• **2:** İşaret parmağı\n• **3:** Orta parmak\n• **4:** Yüzük parmağı\n• **5:** Serçe parmak\n\nAvucunuzun içinde hayali bir tenis topu veya portakal tutuyormuş gibi parmaklarınızı hafifçe kıvırın. Bileğiniz tuşlarla aynı hizada, omuzlarınız tamamen gevşek olmalı.",
            keyTakeaway:
              "Başparmak her iki elde de 1 numaradır! Sıfırdan başlarken doğru bilek ve parmak formu, ileride hızlı ve ağrısız çalmanın anahtarıdır.",
          },
        ],
        exercise: {
          title: "Orta Do (C4) Keşfi ve 5 Parmak Dinamik Kontrolü",
          description:
            "Piyanonun kalbi olan Orta Do (C4) notasını bulun ve sağ elinizin 1-2-3-4-5 parmaklarıyla Do-Re-Mi-Fa-Sol-Fa-Mi-Re-Do yürüyüşünü dengeli bir tuşeyle çalın.",
          instructions: [
            "Piyanonuzun tam ortasındaki 'Roland' logosunun hemen altındaki ikili siyah tuş grubunu bulun.",
            "Bu ikili siyah tuş grubunun hemen solundaki beyaz tuş **Orta Do (C4)** notasıdır. Sağ el başparmağınızı (1) buraya yerleştirin.",
            "Sırasıyla Do4 - Re4 - Mi4 - Fa4 - Sol4 ve geri dönüşü (Fa4 - Mi4 - Re4 - Do4) çalın.",
            "Ekranın altındaki tuş şiddeti (Velocity) göstergesini takip ederek tüm notaları orta güçte (mf: 65-95 arası) dengeli çalmaya çalışın.",
          ],
          clef: "treble",
          bpm: 72,
          mode: "sequence",
          targetNotes: [
            { midi: 60, note: "C4", turkishName: "Do4", duration: "q", finger: 1, hand: "R", targetVelocity: "mf" },
            { midi: 62, note: "D4", turkishName: "Re4", duration: "q", finger: 2, hand: "R", targetVelocity: "mf" },
            { midi: 64, note: "E4", turkishName: "Mi4", duration: "q", finger: 3, hand: "R", targetVelocity: "mf" },
            { midi: 65, note: "F4", turkishName: "Fa4", duration: "q", finger: 4, hand: "R", targetVelocity: "mf" },
            { midi: 67, note: "G4", turkishName: "Sol4", duration: "q", finger: 5, hand: "R", targetVelocity: "mf" },
            { midi: 65, note: "F4", turkishName: "Fa4", duration: "q", finger: 4, hand: "R", targetVelocity: "mf" },
            { midi: 64, note: "E4", turkishName: "Mi4", duration: "q", finger: 3, hand: "R", targetVelocity: "mf" },
            { midi: 62, note: "D4", turkishName: "Re4", duration: "q", finger: 2, hand: "R", targetVelocity: "mf" },
            { midi: 60, note: "C4", turkishName: "Do4", duration: "w", finger: 1, hand: "R", targetVelocity: "mf" },
          ],
          aiCoachFocus:
            "Kullanıcının C4-G4 arasındaki 5 parmak egzersizinde tuş hızı (velocity) dengesini, özellikle 4. ve 5. parmaklarda (Fa4 ve Sol4) sesin zayıflayıp zayıflamadığını ve ritim akıcılığını değerlendir.",
        },
        quickQuestions: [
          "Roland FP-10'da PHA-4 tuş ağırlığı ayarı (Key Touch) nasıl kullanılır?",
          "4. ve 5. parmaklarım diğerlerine göre daha güçsüz hissediyor, nasıl geliştirebilirim?",
          "Frekans ile oktav arasındaki matematiksel ilişki (440 Hz La4) tam olarak nedir?",
        ],
      },
      {
        id: "ders-1-2",
        moduleId: "modul-1",
        order: 2,
        title: "88 Tuşun Haritası: Siyah Tuş Grupları, Oktav ve 7 Nota",
        subtitle: "88 tuşluk devasa klavyeyi 12 tuşluk tekrar eden bir desene indirgemek",
        durationMin: 20,
        level: "Başlangıç",
        summary:
          "İlk bakışta karmaşık görünen 88 tuşun aslında sadece 2'li ve 3'lü siyah tuş gruplarından oluşan basit bir harita olduğunu ve hem Türkçe (Do-Re-Mi) hem uluslararası (C-D-E) nota sistemini öğrenin.",
        theorySections: [
          {
            heading: "1. Siyah Tuşlar Pusulanızdır (2'li ve 3'lü Gruplar)",
            content:
              "Piyanonuza yukarıdan baktığınızda siyah tuşların rastgele dizilmediğini görürsünüz: **2 siyah tuş – boşluk – 3 siyah tuş – boşluk** şeklinde sürekli tekrar ederler.\n• **2'li siyah tuş grubunun** hemen solundaki beyaz tuş her zaman **DO (C)** notasıdır.\n• **3'lü siyah tuş grubunun** hemen solundaki beyaz tuş ise her zaman **FA (F)** notasıdır.",
            keyTakeaway:
              "Gözünüzü kapatsanız bile parmak uçlarınızla 2'li ve 3'lü siyah tuş tümseklerini hissederek piyanonun üzerindeki her Do ve Fa notasını anında bulabilirsiniz!",
            tryOnPianoTip:
              "Piyanonuzdaki tüm 2'li siyah tuş gruplarını bulun ve her birinin solundaki beyaz tuşlara (C1, C2, C3, C4, C5, C6, C7) sırayla basın. Aynı notanın farklı inceliklerde (oktavlarda) nasıl tınladığını dinleyin.",
          },
          {
            heading: "2. İki Dil: Do-Re-Mi (Solfej) ve C-D-E (Harf Sistemi)",
            content:
              "Müzik dünyasında hem Latin/Türkçe nota isimlerini hem de uluslararası harf kodlarını aynı anda bilmek çok büyük avantaj sağlar:\n\n• **Do = C** | **Re = D** | **Mi = E** | **Fa = F** | **Sol = G** | **La = A** | **Si = B**\n\nNeden A harfi Do değil de **La**'dır? Çünkü tarihsel olarak müzik teorisi dikte edilirken o dönemin en kalın referans sesi La (A) kabul edilmişti!",
            keyTakeaway:
              "C=Do, F=Fa, G=Sol, A=La referans noktalarını ezberlediğinizde akor şifrelerini (ör. Am, Fmaj7, G7) anında okuyabilirsiniz.",
          },
          {
            heading: "3. Oktav Kavramı: Aynı Nota, İki Kat Frekans",
            content:
              "Do'dan başlayıp 7 beyaz tuş ilerlediğinizde (Do-Re-Mi-Fa-Sol-La-Si) 8. tuşta tekrar **Do**'ya ulaşırsınız. Latince *Octavus* (sekizinci) kelimesinden gelen **Oktav**, frekansın tam **2 katına çıkması** demektir. Örneğin `La4 (A4)` saniyede 440 kez titreşirken, bir üst oktavdaki `La5 (A5)` tam 880 kez titreşir. Bu yüzden kulağımız bu iki sesi 'aynı rengin açığı ve koyusu' gibi algılar.",
            keyTakeaway:
              "Oktavlar müziğe derinlik katar: Sol elinizle kalın bir oktavda (ör. C3) kök sesi basarken sağ elinizle C4-C5 bölgesinde melodi çaldığınızda ses dolgunlaşır.",
          },
        ],
        exercise: {
          title: "Oktavlar Arası Yolculuk ve Do Majör Tam Diziye Hazırlık",
          description:
            "Farklı oktavlardaki referans notaları (Do3, Fa3, Do4, Sol4, La4, Do5) klavyede hatasız bularak klavye haritasına hakim olun.",
          instructions: [
            "İlk iki nota (Do3 ve Fa3) Orta Do'nun bir alt oktavındadır; sol elinizle 2'li ve 3'lü siyah tuşların solundaki beyaz tuşları bulun.",
            "Ardından Orta Do (Do4) bölgesine geçin ve sırasıyla Do4 - Re4 - Mi4 - Fa4 - Sol4 - La4 - Si4 - Do5 notalarını çalın.",
            "Parmak geçişi ipucu: Do4(1) - Re4(2) - Mi4(3) çaldıktan sonra başparmağınızı (1) alttan geçirerek Fa4'e basın, böylece Do5'e (5. parmak) rahatça ulaşırsınız!",
          ],
          clef: "treble",
          bpm: 76,
          mode: "sequence",
          targetNotes: [
            { midi: 48, note: "C3", turkishName: "Do3", duration: "h", finger: 5, hand: "L", targetVelocity: "mf" },
            { midi: 53, note: "F3", turkishName: "Fa3", duration: "h", finger: 2, hand: "L", targetVelocity: "mf" },
            { midi: 60, note: "C4", turkishName: "Do4", duration: "q", finger: 1, hand: "R", targetVelocity: "mf" },
            { midi: 62, note: "D4", turkishName: "Re4", duration: "q", finger: 2, hand: "R", targetVelocity: "mf" },
            { midi: 64, note: "E4", turkishName: "Mi4", duration: "q", finger: 3, hand: "R", targetVelocity: "mf" },
            { midi: 65, note: "F4", turkishName: "Fa4", duration: "q", finger: 1, hand: "R", targetVelocity: "mf" },
            { midi: 67, note: "G4", turkishName: "Sol4", duration: "q", finger: 2, hand: "R", targetVelocity: "mf" },
            { midi: 69, note: "A4", turkishName: "La4", duration: "q", finger: 3, hand: "R", targetVelocity: "mf" },
            { midi: 71, note: "B4", turkishName: "Si4", duration: "q", finger: 4, hand: "R", targetVelocity: "mf" },
            { midi: 72, note: "C5", turkishName: "Do5", duration: "w", finger: 5, hand: "R", targetVelocity: "f" },
          ],
          aiCoachFocus:
            "Kullanıcının Mi4'ten Fa4'e geçerken başparmak geçişinde (1. parmak) ritmik duraksama yaşayıp yaşamadığını ve C3/F3 oktav sıçramalarını doğru bulup bulamadığını analiz et.",
        },
        quickQuestions: [
          "Mi4'ten Fa4'e geçerken başparmağı alttan geçirme (thumb under) tekniğinin püf noktası nedir?",
          "C-D-E-F-G-A-B harf sistemini hızlıca zihnimde Türkçe notalarla eşleştirmek için bir hafıza tekniği var mı?",
          "Diyez (#) ve Bemol (b) siyah tuşları nasıl isimlendirilir?",
        ],
      },
      {
        id: "ders-1-3",
        moduleId: "modul-1",
        order: 3,
        title: "Porte (Nota Dizesi), Anahtarlar ve Ritmin Matematiği",
        subtitle: "Müziğin yazılı dilini okumak: Zaman ve Frekans grafiği olarak Porte",
        durationMin: 20,
        level: "Başlangıç",
        summary:
          "5 çizgi ve 4 aralıktan oluşan portenin aslında çok basit bir grafik olduğunu, Sol ve Fa anahtarlarının mantığını ve dörtlük/ikilik/birlik nota sürelerini öğrenin.",
        theorySections: [
          {
            heading: "1. Porte Aslında İki Boyutlu Bir Grafiktir!",
            content:
              "Nota okumaktan korkmanıza hiç gerek yok. **Porte (5 çizgi ve 4 aralık)** aslında iki eksenli bir grafiktir:\n• **Dikey eksen (Yukarı / Aşağı):** Hangi tuşa basacağınızı (sesin inceliğini/kalınlığını) gösterir. Çizgi veya aralıkta bir adım yukarı çıkmak, piyanoda bir beyaz tuş sağa gitmektir.\n• **Yatay eksen (Soldan Sağa):** Zamanın akışını gösterir.",
            keyTakeaway:
              "Her çizgi ve her boşluk (aralık) sıradaki beyaz tuşu temsil eder: Çizgi -> Boşluk -> Çizgi -> Boşluk.",
          },
          {
            heading: "2. Sol Anahtarı (Sağ El) ve Fa Anahtarı (Sol El)",
            content:
              "Piyano 88 tuşla çok geniş bir ses aralığına sahip olduğu için tek bir 5 çizgi yetmez; bu yüzden **Büyük Porte (Grand Staff)** kullanırız:\n• **Sol Anahtarı (Treble Clef):** Alttan 2. çizgiyi sarmalar ve o çizginin **Sol4 (G4)** olduğunu ilan eder. Genellikle sağ el ile çalınır.\n• **Fa Anahtarı (Bass Clef):** İki noktasının arasındaki üstten 2. çizginin **Fa3 (F3)** olduğunu ilan eder. Genellikle sol el ile çalınır.\n• İki portenin tam ortasındaki görünmez ek çizgide ise **Orta Do (C4)** oturur!",
            keyTakeaway:
              "Orta Do (C4), Sol anahtarının hemen altındaki ek çizgide, Fa anahtarının ise hemen üstündeki ek çizgide yer alarak iki eli birbirine bağlayan köprüdür.",
          },
          {
            heading: "3. Ritim ve Nota Değerleri (Müziğin Kalp Atışı)",
            content:
              "Notaların şekli, o tuşu ne kadar süre basılı tutacağımızı söyler (4/4'lük ölçüde):\n• **Birlik Nota (Whole Note - İçi boş, sapı yok):** 4 vuruş boyunca uzar (1 - 2 - 3 - 4).\n• **İkilik Nota (Half Note - İçi boş, saplı):** 2 vuruş boyunca uzar.\n• **Dörtlük Nota (Quarter Note - İçi dolu, saplı):** 1 vuruş (her metronom tıkı bir dörtlüktür).\n• **Sekizlik Nota (Eighth Note - Çengelli):** Yarım vuruş (bir metronom vuruşuna iki eşit nota sığar).",
            keyTakeaway:
              "Doğru notaya yanlış zamanda basmak müziğin akışını bozar; bu yüzden her zaman içimizden düzenli bir nabız (1-2-3-4) sayarak çalarız.",
          },
        ],
        exercise: {
          title: "Porte Okuma ve Ritim Senkronizasyonu (Ode to Joy - Neşeye Övgü)",
          description:
            "Beethoven'ın 9. Senfonisindeki ölümsüz 'Neşeye Övgü' (Ode to Joy) temasını porteden okuyarak ve dörtlük/ikilik ritim dengesine dikkat ederek çalın.",
          instructions: [
            "Sağ elinizin 3. parmağını (orta parmak) **Mi4 (E4)** tuşuna koyun.",
            "Portedeki notaları takip edin: Mi - Mi - Fa - Sol | Sol - Fa - Mi - Re | Do - Do - Re - Mi | Mi - Re - Re.",
            "İsterseniz üst bardan Metronomu açarak her vuruşta bir nota gelecek şekilde sabit tempoyla çalın.",
          ],
          clef: "treble",
          bpm: 84,
          mode: "sequence",
          targetNotes: [
            { midi: 64, note: "E4", turkishName: "Mi4", duration: "q", finger: 3, hand: "R", targetVelocity: "mf" },
            { midi: 64, note: "E4", turkishName: "Mi4", duration: "q", finger: 3, hand: "R", targetVelocity: "mf" },
            { midi: 65, note: "F4", turkishName: "Fa4", duration: "q", finger: 4, hand: "R", targetVelocity: "mf" },
            { midi: 67, note: "G4", turkishName: "Sol4", duration: "q", finger: 5, hand: "R", targetVelocity: "f" },
            { midi: 67, note: "G4", turkishName: "Sol4", duration: "q", finger: 5, hand: "R", targetVelocity: "f" },
            { midi: 65, note: "F4", turkishName: "Fa4", duration: "q", finger: 4, hand: "R", targetVelocity: "mf" },
            { midi: 64, note: "E4", turkishName: "Mi4", duration: "q", finger: 3, hand: "R", targetVelocity: "mf" },
            { midi: 62, note: "D4", turkishName: "Re4", duration: "q", finger: 2, hand: "R", targetVelocity: "mf" },
            { midi: 60, note: "C4", turkishName: "Do4", duration: "q", finger: 1, hand: "R", targetVelocity: "mf" },
            { midi: 60, note: "C4", turkishName: "Do4", duration: "q", finger: 1, hand: "R", targetVelocity: "mf" },
            { midi: 62, note: "D4", turkishName: "Re4", duration: "q", finger: 2, hand: "R", targetVelocity: "mf" },
            { midi: 64, note: "E4", turkishName: "Mi4", duration: "q", finger: 3, hand: "R", targetVelocity: "mf" },
            { midi: 64, note: "E4", turkishName: "Mi4", duration: "h", finger: 3, hand: "R", targetVelocity: "mf" },
            { midi: 62, note: "D4", turkishName: "Re4", duration: "h", finger: 2, hand: "R", targetVelocity: "p" },
          ],
          aiCoachFocus:
            "Beethoven Ode to Joy melodisinde kullanıcının notalar arası sürekliliğini (legato), Sol4 zirve notasındaki dinamik vurgusunu ve son iki notadaki (Mi4-Re4) yumuşak bitişi değerlendir.",
        },
        quickQuestions: [
          "Portedeki notaları tek tek saymadan bir bakışta tanımanın (Sight Reading) sırrı nedir?",
          "Legato (bağlı çalma) ile Staccato (kesik çalma) arasındaki farkı FP-10'da nasıl uygularım?",
          "4/4'lük ölçü işareti tam olarak ne anlama geliyor?",
        ],
      },
    ],
  },
  {
    id: "modul-2",
    number: 2,
    title: "Müzik Teorisi & Armoninin Sırları",
    description:
      "Neden bazı sesler birlikte muhteşem tınlarken bazıları gerilim yaratır? Gam formülleri, Majör/Minör akorlar ve şarkıların armonik iskeleti.",
    iconName: "Sparkles",
    color: "from-indigo-500/20 to-violet-600/10 border-indigo-500/30",
    lessons: [
      {
        id: "ders-2-1",
        moduleId: "modul-2",
        order: 1,
        title: "Yarım Ses, Tam Ses ve Majör Gamın Altın Formülü",
        subtitle: "Batı müziğinin DNA'sı: T - T - Y - T - T - T - Y",
        durationMin: 20,
        level: "Temel Teori",
        summary:
          "Siyah ve beyaz tuşlar arasındaki en küçük mesafe olan 'Yarım Ses' kavramını ve hangi notadan başlarsanız başlayın Majör gam kurmanızı sağlayan evrensel formülü keşfedin.",
        theorySections: [
          {
            heading: "1. Yarım Ses (Semitone) ve Tam Ses (Whole Tone)",
            content:
              "Piyanoda yan yana duran herhangi iki tuş (siyah veya beyaz fark etmez, aralarında başka tuş yoksa) arasındaki mesafeye **Yarım Ses (Y)** denir.\n• Örneğin `Do` ile `Do# (siyah tuş)` arası **Yarım Ses**tir.\n• Çok önemli istisna: `Mi - Fa` ve `Si - Do` arasında siyah tuş yoktur! Dolayısıyla `Mi` ile `Fa` arası ve `Si` ile `Do` arası doğal olarak **Yarım Ses**tir.\n• İki yarım sesin birleşimine ise **Tam Ses (T)** denir (ör. `Do` -> `Re` arası, çünkü ortalarında `Do#` siyah tuşu vardır).",
            keyTakeaway:
              "Mi-Fa ve Si-Do arasında siyah tuş yoktur; bu iki çift doğal olarak yarım sestir!",
            tryOnPianoTip:
              "Do4'ten başlayarak siyah-beyaz hiçbir tuşu atlamadan (kromatik olarak) Do5'e kadar 12 yarım adımı tek tek çalın.",
          },
          {
            heading: "2. Majör Gamın Evrensel Formülü: T - T - Y - T - T - T - Y",
            content:
              "Do'dan Do'ya sadece beyaz tuşlara bastığınızda kulağınıza neşeli, aydınlık ve dengeli bir dizi gelir. Bunun sebebi beyaz tuşların şu mesafe dizilimine sahip olmasıdır:\n\n**Tam - Tam - Yarım - Tam - Tam - Tam - Yarım**\n\nBu formülü **Sol (G)** notasından başlatırsanız, 7. adımda `Fa` yerine `Fa# (siyah tuş)` basmanız gerektiğini görürsünüz! İşte şarkılardaki siyah tuşların (diyez ve bemollerin) varlık sebebi budur: Aynı melodik oranı farklı başlangıç notalarında korumak!",
            keyTakeaway:
              "T-T-Y-T-T-T-Y formülünü bildiğinizde, ezber yapmadan 12 farklı tonda Majör gam çıkarabilirsiniz.",
          },
        ],
        exercise: {
          title: "Sol Majör (G Major) Gamını Formülle İnşa Etmek (Fa# Siyah Tuşu ile)",
          description:
            "T-T-Y-T-T-T-Y formülünü Sol (G4) notasından başlatarak uygulayın ve 7. derecedeki Fa# (F#4) siyah tuşunun diziyi nasıl aydınlık bir şekilde Sol5'e bağladığını duyun.",
          instructions: [
            "Sağ el başparmağınızı **Sol4 (G4)** tuşuna koyun.",
            "Sırasıyla: Sol4 - La4 - Si4 (başparmağı alttan geçirin) - Do5 - Re5 - Mi5 - **Fa#5 (3'lü siyah tuş grubunun en solu)** - Sol5 çalın.",
            "Fa#5 tuşuna bastığınızda oluşan 'Eve (Sol5'e) dönme isteğini' (Yeden Nota / Leading Tone gerilimini) dikkatle dinleyin!",
          ],
          clef: "treble",
          bpm: 80,
          mode: "sequence",
          targetNotes: [
            { midi: 67, note: "G4", turkishName: "Sol4", duration: "q", finger: 1, hand: "R", targetVelocity: "mf" },
            { midi: 69, note: "A4", turkishName: "La4", duration: "q", finger: 2, hand: "R", targetVelocity: "mf" },
            { midi: 71, note: "B4", turkishName: "Si4", duration: "q", finger: 3, hand: "R", targetVelocity: "mf" },
            { midi: 72, note: "C5", turkishName: "Do5", duration: "q", finger: 1, hand: "R", targetVelocity: "mf" },
            { midi: 74, note: "D5", turkishName: "Re5", duration: "q", finger: 2, hand: "R", targetVelocity: "mf" },
            { midi: 76, note: "E5", turkishName: "Mi5", duration: "q", finger: 3, hand: "R", targetVelocity: "mf" },
            { midi: 78, note: "F#5", turkishName: "Fa#5", duration: "q", finger: 4, hand: "R", targetVelocity: "mf" },
            { midi: 79, note: "G5", turkishName: "Sol5", duration: "w", finger: 5, hand: "R", targetVelocity: "f" },
          ],
          aiCoachFocus:
            "Kullanıcının Sol Majör gamında Fa doğal (F5) yerine doğru şekilde Fa#5 (MIDI 78) basıp basmadığını ve Si4'ten Do5'e geçişini değerlendir.",
        },
        quickQuestions: [
          "Fa# yerine normal beyaz Fa tuşuna bassaydım neden kulağa farklı (Miksolidyen mod) gelirdi?",
          "Minör gamın formülü Majör gamdan nasıl türetilir?",
          "Yeden nota (7. derece) neden kulağımızda çözülme isteği uyandırır?",
        ],
      },
      {
        id: "ders-2-2",
        moduleId: "modul-2",
        order: 2,
        title: "Duyguların Kimyası: Majör ve Minör Akorlar (Triadlar)",
        subtitle: "Tek bir tuşu yarım ses kaydırarak neşeyi hüzne dönüştürmek",
        durationMin: 25,
        level: "Temel Teori",
        summary:
          "Üç sesli akorların (Triad) nasıl kurulduğunu, Majör (4+3 yarım ses) ve Minör (3+4 yarım ses) akorların duygusal karakterini piyanoda bizzat deneyimleyin.",
        theorySections: [
          {
            heading: "1. Akor (Chord) Nedir? Üçlü Kurulum (1 - 3 - 5)",
            content:
              "Tek tek çalınan notalar **Melodi**yi (yatay çizgi), aynı anda basılan 3 veya daha fazla nota ise **Armoni / Akor**u (dikey derinlik) oluşturur.\nEn temel akorlara **Triad (Üçlü Akor)** denir ve bir tuş basıp bir tuş atlayarak (1. - 3. - 5. dereceler) kurulur:\n• **Kök Ses (1):** Akora adını veren temel nota (Ör. Do).\n• **Üçlü (3):** Akorun duygusunu (Majör/Neşeli mi, Minör/Hüzünlü mü) belirleyen kalp notası (Ör. Mi veya Mib).\n• **Beşli (5):** Akoru sağlamlaştıran çerçeve nota (Ör. Sol).",
            keyTakeaway:
              "Bir akorun Majör mü yoksa Minör mü olduğunu belirleyen tek şey ortadaki 3. derecedir!",
          },
          {
            heading: "2. Majör (4 + 3) vs. Minör (3 + 4) Formülü",
            content:
              "Herhangi bir tuştan başlayarak:\n• **Majör Akor (Aydınlık, Kararlı):** Kök sesten **4 yarım ses** yukarı çıkın (Büyük Üçlü), oradan **3 yarım ses** daha çıkın. Örnek: **Do Majör (C)** = `Do - Mi - Sol`.\n• **Minör Akor (Melankolik, Derin, Duygusal):** Kök sesten **3 yarım ses** yukarı çıkın (Küçük Üçlü), oradan **4 yarım ses** daha çıkın. Örnek: **Do Minör (Cm)** = `Do - Mib - Sol` veya sadece beyaz tuşlarla **La Minör (Am)** = `La - Do - Mi`.",
            keyTakeaway:
              "Herhangi bir Majör akorun ortadaki notasını yarım ses sola (kalına) kaydırırsanız anında Minör akor elde edersiniz!",
            tryOnPianoTip:
              "Sağ elinizin 1-3-5 parmaklarıyla aynı anda Do4-Mi4-Sol4 (Do Majör) basın. Sonra sadece 3. parmağınızı Mi4'ten siyah tuş olan Mib4'e (Eb4) kaydırıp Do4-Mib4-Sol4 (Do Minör) basın. Odayı kaplayan duygu değişimini dinleyin!",
          },
        ],
        exercise: {
          title: "Majör ve Minör Akorları Duyarak ve Basarak Keşfetmek",
          description:
            "Sırasıyla Do Majör (C), Do Minör (Cm), La Minör (Am) ve Fa Majör (F) akorlarının notalarını piyanoda basarak armonik renk farkını hissedin.",
          instructions: [
            "Bu egzersizde her akorun 3 notasını arpej (sırayla veya birlikte) olarak basacağız.",
            "1. Grup: **Do Majör** (Do4 - Mi4 - Sol4) -> Aydınlık ve kararlı.",
            "2. Grup: **Do Minör** (Do4 - Mib4 [2'li siyah tuşun sağı] - Sol4) -> Ortadaki ses yarım ses indi, anında sinematik ve hüzünlü oldu!",
            "3. Grup: **La Minör** (La3 - Do4 - Mi4) -> Beyaz tuşların doğal minör akoru.",
          ],
          clef: "treble",
          bpm: 72,
          mode: "sequence",
          targetNotes: [
            { midi: 60, note: "C4", turkishName: "Do4", duration: "q", finger: 1, hand: "R", targetVelocity: "mf" },
            { midi: 64, note: "E4", turkishName: "Mi4", duration: "q", finger: 3, hand: "R", targetVelocity: "mf" },
            { midi: 67, note: "G4", turkishName: "Sol4", duration: "h", finger: 5, hand: "R", targetVelocity: "mf" },
            { midi: 60, note: "C4", turkishName: "Do4", duration: "q", finger: 1, hand: "R", targetVelocity: "p" },
            { midi: 63, note: "Eb4", turkishName: "Mib4", duration: "q", finger: 3, hand: "R", targetVelocity: "p" },
            { midi: 67, note: "G4", turkishName: "Sol4", duration: "h", finger: 5, hand: "R", targetVelocity: "p" },
            { midi: 57, note: "A3", turkishName: "La3", duration: "q", finger: 1, hand: "R", targetVelocity: "mf" },
            { midi: 60, note: "C4", turkishName: "Do4", duration: "q", finger: 2, hand: "R", targetVelocity: "mf" },
            { midi: 64, note: "E4", turkishName: "Mi4", duration: "w", finger: 5, hand: "R", targetVelocity: "mf" },
          ],
          aiCoachFocus:
            "Kullanıcının Mi4 (Majör 3'lü) ile Mib4 (Minör 3'lü) arasındaki geçişini ve Do Minör kısmında daha yumuşak (piano) bir tuşe kullanıp kullanmadığını analiz et.",
        },
        quickQuestions: [
          "Aynı anda 3 tuşa basarken (akor çalarken) seslerin aynı anda ve dengeli çıkması için elimi nasıl tutmalıyım?",
          "Sus2, Sus4 ve Yedili (Maj7, m7) akorlar bu üçlü akorlara ne eklenerek yapılır?",
          "Akor çevrimi (Inversion) nedir ve piyanistler neden akorları hep kök pozisyonda çalmaz?",
        ],
      },
      {
        id: "ders-2-3",
        moduleId: "modul-2",
        order: 3,
        title: "Şarkıların İskeleti: Akor Dereceleri (I - V - vi - IV)",
        subtitle: "Binlerce hit şarkının arkasındaki armonik yolculuk: Ev, Yolculuk ve Dönüş",
        durationMin: 25,
        level: "Temel Teori",
        summary:
          "Dinlediğiniz şarkıların neden belirli bir hikaye hissi verdiğini (Tonik, Subdominant, Dominant fonksiyonları) öğrenin ve iki elinizle ilk tam akor yürüyüşünüzü çalın.",
        theorySections: [
          {
            heading: "1. Müzikte Hikaye Anlatımı: Ev (I), Uzaklaşma (IV) ve Gerilim (V)",
            content:
              "Bir gamın her notası üzerine bir akor kurduğumuzda 7 kardeş akor elde ederiz (Do Majör tonunda):\n• **I. Derece – Do Majör (C):** **Tonik (Ev).** Huzur, başlangıç ve bitiş hissi verir.\n• **IV. Derece – Fa Majör (F):** **Subdominant (Yolculuk).** Evden ayrılıp yeni bir atmosfere açılma hissi verir.\n• **V. Derece – Sol Majör (G):** **Dominant (Gerilim / Mıknatıs).** İçindeki `Si` notası nedeniyle şiddetle tekrar `Do Majör`e (Eve) dönmek ister.\n• **vi. Derece – La Minör (Am):** **İlgili Minör.** Ev hissine çok yakın ama duygusal/melankolik gölge.",
            keyTakeaway:
              "Müzik tamamen 'Gerilim (Tension)' ve 'Çözülme (Resolution)' sanatıdır: I (Ev) -> IV (Hareket) -> V (Gerilim) -> I (Eve Dönüş).",
          },
          {
            heading: "2. Efsanevi Yürüyüş: I - V - vi - IV (C - G - Am - F)",
            content:
              "Beatles (*Let It Be*), Adele (*Someone Like You*), Hans Zimmer film müzikleri ve yüzlerce Türkçe pop/rock şarkısı şu dört akorun döngüsü üzerine kuruludur:\n**C (Do Majör) -> G (Sol Majör) -> Am (La Minör) -> F (Fa Majör)**.\nBu yürüyüşü öğrendiğiniz an, dinlediğiniz yüzlerce şarkının altyapısını piyanoda anında çalabilir ve üzerine kendi melodilerinizi doğaçlayabilirsiniz!",
            keyTakeaway:
              "Sol elinizle akorun kök notasını (Do - Sol - La - Fa) basarken sağ elinizle akoru tınlatmak, piyanonuzdan tam bir orkestra dolgunluğu çıkarır.",
          },
        ],
        exercise: {
          title: "İki El Koordinasyonuyla C - G - Am - F Akor Yürüyüşü",
          description:
            "Sol elinizle bas kök sesini basıp hemen ardından sağ elinizle akorun notalarını duyurarak sinematik C - G - Am - F yürüyüşünü icra edin.",
          instructions: [
            "1. Ölçü (**C**): Sol el **Do3** basar -> Sağ el **Mi4 - Sol4 - Do5** çalar.",
            "2. Ölçü (**G**): Sol el **Sol2** basar -> Sağ el **Re4 - Sol4 - Si4** çalar.",
            "3. Ölçü (**Am**): Sol el **La2** basar -> Sağ el **Mi4 - La4 - Do5** çalar.",
            "4. Ölçü (**F**): Sol el **Fa2** basar -> Sağ el **Fa4 - La4 - Do5** çalar ve sonunda **Do4** ile eve çözülür.",
          ],
          clef: "treble",
          bpm: 76,
          mode: "sequence",
          targetNotes: [
            { midi: 48, note: "C3", turkishName: "Do3", duration: "q", finger: 5, hand: "L", targetVelocity: "f" },
            { midi: 64, note: "E4", turkishName: "Mi4", duration: "q", finger: 1, hand: "R", targetVelocity: "mf" },
            { midi: 67, note: "G4", turkishName: "Sol4", duration: "q", finger: 2, hand: "R", targetVelocity: "mf" },
            { midi: 72, note: "C5", turkishName: "Do5", duration: "q", finger: 5, hand: "R", targetVelocity: "mf" },
            { midi: 43, note: "G2", turkishName: "Sol2", duration: "q", finger: 5, hand: "L", targetVelocity: "f" },
            { midi: 62, note: "D4", turkishName: "Re4", duration: "q", finger: 1, hand: "R", targetVelocity: "mf" },
            { midi: 67, note: "G4", turkishName: "Sol4", duration: "q", finger: 3, hand: "R", targetVelocity: "mf" },
            { midi: 71, note: "B4", turkishName: "Si4", duration: "q", finger: 5, hand: "R", targetVelocity: "mf" },
            { midi: 45, note: "A2", turkishName: "La2", duration: "q", finger: 4, hand: "L", targetVelocity: "f" },
            { midi: 64, note: "E4", turkishName: "Mi4", duration: "q", finger: 1, hand: "R", targetVelocity: "mf" },
            { midi: 69, note: "A4", turkishName: "La4", duration: "q", finger: 3, hand: "R", targetVelocity: "mf" },
            { midi: 72, note: "C5", turkishName: "Do5", duration: "q", finger: 5, hand: "R", targetVelocity: "mf" },
            { midi: 41, note: "F2", turkishName: "Fa2", duration: "q", finger: 5, hand: "L", targetVelocity: "f" },
            { midi: 65, note: "F4", turkishName: "Fa4", duration: "q", finger: 1, hand: "R", targetVelocity: "mf" },
            { midi: 69, note: "A4", turkishName: "La4", duration: "q", finger: 3, hand: "R", targetVelocity: "mf" },
            { midi: 60, note: "C4", turkishName: "Do4", duration: "w", finger: 1, hand: "R", targetVelocity: "p" },
          ],
          aiCoachFocus:
            "Sol el bas notaları (C3, G2, A2, F2) ile sağ el arpej notaları arasındaki geçiş akıcılığını, bas notaların doygunluğunu ve armonik ifadeyi değerlendir.",
        },
        quickQuestions: [
          "Dinlediğim bir şarkının akorlarını ve tonunu kulaktan nasıl bulabilirim?",
          "Bu C - G - Am - F yürüyüşünde Roland FP-10'un sustain pedalını tam olarak hangi anlarda indirip kaldırmalıyım?",
          "Neden La Minör (Am) akoruna Do Majörün 'İlgili Minörü' deniyor?",
        ],
      },
    ],
  },
  {
    id: "modul-3",
    number: 3,
    title: "Müzik Kulağı Geliştirme (Duyduğunu Anlama)",
    description:
      "Dinlediğiniz bir melodinin aralıklarını, akor renklerini ve gerilim-çözülme noktalarını zihninizde çözümleyip piyanoda bulma eğitimi.",
    iconName: "Ear",
    color: "from-emerald-500/20 to-teal-600/10 border-emerald-500/30",
    lessons: [
      {
        id: "ders-3-1",
        moduleId: "modul-3",
        order: 1,
        title: "Aralıkları (Intervals) Duyarak Tanıma Rehberi",
        subtitle: "Melodinin yapı taşları: İki nota arasındaki mesafeyi kulaktan ölçmek",
        durationMin: 20,
        level: "Kulak & Algı",
        summary:
          "Bir melodiyi duyduğunuzda piyanoda hemen çalabilmenin sırrı 'Mutlak Kulak' değil, notalar arasındaki mesafeyi (Aralık / Interval) tanıyan 'Bağıl Kulak' (Relative Pitch) becerisidir.",
        theorySections: [
          {
            heading: "1. Mutlak Kulak vs. Bağıl Kulak (Relative Pitch)",
            content:
              "Birçok kişi doğuştan 'Mutlak Kulak' (Perfect Pitch) olmadan duyduğunu çalamayacağını sanır. Bu tamamen yanlıştır! Profesyonel müzisyenlerin %95'i **Bağıl Kulak (Relative Pitch)** kullanır: Yani referans bir notayı bildiğinde, ikinci notanın ondan ne kadar uzakta olduğunu (2'li mi, 3'lü mü, 5'li mi) kulaktan ölçer. Ve bu beceri %100 antrenmanla gelişir!",
            keyTakeaway:
              "Duyduğun melodiyi piyanoda çalabilmek doğuştan gelen bir büyü değil, aralıkları (intervals) tanıma kasının gelişmesidir.",
          },
          {
            heading: "2. Temel Aralıkların Karakteri ve Hafıza Şarkıları",
            content:
              "Her aralığın kendine has bir duygusu vardır:\n• **Büyük İkili (Major 2nd - Do -> Re):** Adım atma hissi (Ör. *İyi ki Doğdun* başlangıcı).\n• **Büyük Üçlü (Major 3rd - Do -> Mi):** Sıcak, aydınlık kapı zili hissi.\n• **Tam Dörtlü (Perfect 4th - Do -> Fa):** Marş ve resmi çağrı hissi (Ör. *İstiklal Marşı* veya *Star Wars / Düğün Marşı*).\n• **Tam Beşli (Perfect 5th - Do -> Sol):** Kahramanca, uzay boşluğu kadar geniş ve güçlü (Ör. *Star Wars Ana Tema* veya *Twinkle Twinkle Little Star*).\n• **Oktav (Do4 -> Do5):** Tamamen bütünleşen ayna ses.",
            keyTakeaway:
              "Her aralığı bildiğiniz bir şarkının ilk iki notasıyla eşleştirdiğinizde, duyduğunuz her melodiyi saniyeler içinde çözebilirsiniz.",
          },
        ],
        exercise: {
          title: "Do Referans Noktasından Tüm Temel Aralıkları Duyarak Çalmak",
          description:
            "Her seferinde Do4'e dönerek sırasıyla Büyük 2'li (Re), Büyük 3'lü (Mi), Tam 4'lü (Fa), Tam 5'li (Sol), Büyük 6'lı (La) ve Oktav (Do5) sıçramalarını çalın ve kulağınıza kazıyın.",
          instructions: [
            "Her aralık çiftinde önce **Do4**'ü basın, ardından hedef notaya sıçrayıp iki ses arasındaki mesafeyi içinizden mırıldanın.",
            "Do4 -> Re4 (2'li) | Do4 -> Mi4 (3'lü) | Do4 -> Fa4 (4'lü) | Do4 -> Sol4 (5'li) | Do4 -> La4 (6'lı) | Do4 -> Do5 (Oktav).",
          ],
          clef: "treble",
          bpm: 72,
          mode: "sequence",
          targetNotes: [
            { midi: 60, note: "C4", turkishName: "Do4", duration: "q", finger: 1, hand: "R", targetVelocity: "mf" },
            { midi: 62, note: "D4", turkishName: "Re4", duration: "h", finger: 2, hand: "R", targetVelocity: "mf" },
            { midi: 60, note: "C4", turkishName: "Do4", duration: "q", finger: 1, hand: "R", targetVelocity: "mf" },
            { midi: 64, note: "E4", turkishName: "Mi4", duration: "h", finger: 3, hand: "R", targetVelocity: "mf" },
            { midi: 60, note: "C4", turkishName: "Do4", duration: "q", finger: 1, hand: "R", targetVelocity: "mf" },
            { midi: 65, note: "F4", turkishName: "Fa4", duration: "h", finger: 4, hand: "R", targetVelocity: "mf" },
            { midi: 60, note: "C4", turkishName: "Do4", duration: "q", finger: 1, hand: "R", targetVelocity: "mf" },
            { midi: 67, note: "G4", turkishName: "Sol4", duration: "h", finger: 5, hand: "R", targetVelocity: "f" },
            { midi: 60, note: "C4", turkishName: "Do4", duration: "q", finger: 1, hand: "R", targetVelocity: "mf" },
            { midi: 69, note: "A4", turkishName: "La4", duration: "h", finger: 4, hand: "R", targetVelocity: "f" },
            { midi: 60, note: "C4", turkishName: "Do4", duration: "q", finger: 1, hand: "R", targetVelocity: "mf" },
            { midi: 72, note: "C5", turkishName: "Do5", duration: "w", finger: 5, hand: "R", targetVelocity: "f" },
          ],
          aiCoachFocus:
            "Kullanıcının artan aralık sıçramalarında (Do4'ten Fa4, Sol4, La4, Do5'e) isabet oranını ve aralık genişledikçe dinamik ifadeyi nasıl yönettiğini değerlendir.",
        },
        quickQuestions: [
          "Küçük Üçlü (Minor 3rd) ile Büyük Üçlü (Major 3rd) aralığını kulaktan ayırt etmenin en kolay yolu nedir?",
          "Triton (Artık 4'lü / Eksik 5'li - Şeytan Aralığı) neden bu kadar gerilimli tınlar?",
          "Günde 10 dakika kulak eğitimi yapmak için nasıl bir rutin izlemeliyim?",
        ],
      },
    ],
  },
  {
    id: "modul-4",
    number: 4,
    title: "Zihindekini Müziğe Dökmek (Doğaçlama & Kompozisyon)",
    description:
      "Nota kağıdına bağımlı kalmadan içinizden geçen duyguları piyanoda ifade etme, Pentatonik dizi, Soru-Cevap cümleleme ve sol el arpej eşliği.",
    iconName: "Wand2",
    color: "from-rose-500/20 to-amber-500/10 border-rose-500/30",
    lessons: [
      {
        id: "ders-4-1",
        moduleId: "modul-4",
        order: 1,
        title: "Pentatonik Güvenli Liman ve Soru-Cevap (Call & Response) Sanatı",
        subtitle: "Zihninizdeki melodiyi piyanoda konuşturmanın formülü",
        durationMin: 25,
        level: "Yaratıcılık",
        summary:
          "Doğaçlamaya başlarken 'yanlış nota basma' korkusunu tamamen ortadan kaldıran 5 sesli Pentatonik diziyi ve müzikal cümle kurmanın sırrı olan Soru-Cevap tekniğini öğrenin.",
        theorySections: [
          {
            heading: "1. Pentatonik Dizi: Birbiriyle Çatışmayan 5 Sihirli Nota",
            content:
              "Do Majör gamındaki 7 notadan keskin yarım ses gerilimi yaratan **Fa (4. derece)** ve **Si (7. derece)** notalarını çıkardığımızda geriye 5 nota kalır:\n\n**Do - Re - Mi - Sol - La** (C Majör / La Minör Pentatonik)\n\nBu 5 notadan hangisine hangi sırayla basarsanız basın, kulağa uyumsuz (falsolu) gelmez! Üstelik piyanonuzdaki **tüm siyah tuşlar** da tek başına kusursuz bir Fa# Pentatonik dizidir.",
            keyTakeaway:
              "Do - Re - Mi - Sol - La notaları doğaçlamanın güvenli oyun alanıdır; bu 5 notayla anında etkileyici melodiler üretebilirsiniz.",
          },
          {
            heading: "2. Melodi Nasıl Konuşur? Soru (Gerilim) ve Cevap (Çözülme)",
            content:
              "Zihninizdeki bir fikri müziğe dökerken rastgele notalar dizmek yerine **konuşma cümleleri** gibi düşünün:\n• **1. Cümle (Soru Cümlesi):** `Do` veya `La`dan başlayıp cümleyi **Re** veya **Sol** notasında havada bırakın (Sanki cümlenin sonunda soru işareti varmış gibi!).\n• **2. Cümle (Cevap Cümlesi):** Benzer bir ritimle başlayıp bu kez cümleyi kararlı bir şekilde **Do** (Majör huzur) veya **La** (Minör derinlik) notasında bitirin.",
            keyTakeaway:
              "Havada kalan nota (Re/Sol) = Soru işareti (?), Kök notaya dönüş (Do/La) = Nokta (.). İşte besteciliğin en temel sırrı budur!",
            tryOnPianoTip:
              "Sol elinizle La2 ve Mi3 tuşlarına basılı tutarken, sağ elinizle sadece Do-Re-Mi-Sol-La tuşlarını kullanarak önce Sol4'te biten bir soru, sonra La4'te biten bir cevap melodisi çalın!",
          },
        ],
        exercise: {
          title: "Soru - Cevap (Call & Response) Pentatonik Melodi Uygulaması",
          description:
            "İlk cümlede Sol4 üzerinde asılı kalan bir 'Müzikal Soru', ikinci cümlede ise Do4'e çözülen bir 'Müzikal Cevap' çalarak cümleleme (phrasing) mantığını hissedin.",
          instructions: [
            "1. Cümle (Soru): Do4 - Re4 - Mi4 - Sol4 - La4 - **Sol4 (Uzun tutun, soru havada kaldı!)**",
            "2. Cümle (Cevap): La4 - Sol4 - Mi4 - Re4 - **Do4 (Eve döndük, cümle tamamlandı!)**",
            "Bu egzersizi bitirdikten sonra 'Serbest Atölye' sekmesine geçip kendi soru-cevap melodilerinizi üretin!",
          ],
          clef: "treble",
          bpm: 78,
          mode: "sequence",
          targetNotes: [
            { midi: 60, note: "C4", turkishName: "Do4", duration: "q", finger: 1, hand: "R", targetVelocity: "mf" },
            { midi: 62, note: "D4", turkishName: "Re4", duration: "q", finger: 2, hand: "R", targetVelocity: "mf" },
            { midi: 64, note: "E4", turkishName: "Mi4", duration: "q", finger: 3, hand: "R", targetVelocity: "mf" },
            { midi: 67, note: "G4", turkishName: "Sol4", duration: "q", finger: 4, hand: "R", targetVelocity: "mf" },
            { midi: 69, note: "A4", turkishName: "La4", duration: "q", finger: 5, hand: "R", targetVelocity: "f" },
            { midi: 67, note: "G4", turkishName: "Sol4", duration: "h", finger: 4, hand: "R", targetVelocity: "mf" },
            { midi: 69, note: "A4", turkishName: "La4", duration: "q", finger: 5, hand: "R", targetVelocity: "f" },
            { midi: 67, note: "G4", turkishName: "Sol4", duration: "q", finger: 4, hand: "R", targetVelocity: "mf" },
            { midi: 64, note: "E4", turkishName: "Mi4", duration: "q", finger: 3, hand: "R", targetVelocity: "mf" },
            { midi: 62, note: "D4", turkishName: "Re4", duration: "q", finger: 2, hand: "R", targetVelocity: "p" },
            { midi: 60, note: "C4", turkishName: "Do4", duration: "w", finger: 1, hand: "R", targetVelocity: "p" },
          ],
          aiCoachFocus:
            "Kullanıcının Soru cümlesindeki kreşendo (La4'e doğru güçlenme) ile Cevap cümlesindeki dekreşendo (Do4'e doğru yumuşayarak çözülme) müzikalitesini değerlendir.",
        },
        quickQuestions: [
          "Zihnimde duyduğum bir melodiyi piyanoda ararken ilk notayı nasıl bulabilirim?",
          "Sol elimle nasıl bir arpej eşliği çalarsam sağ elimdeki pentatonik doğaçlama film müziği gibi duyulur?",
          "Pentatonik diziye hangi 'mavi notayı' (Blue Note) eklersem caz/blues tınısı elde ederim?",
        ],
      },
    ],
  },
];
