# 🎹 Roland FP-10 Müzik Akademisi & Maestro AI Öğretmen

Yeni **Roland FP-10 BK** dijital stage piyanonuz için sıfırdan müzik teorisi, armoni, kulak eğitimi, doğaçlama ve **gerçek zamanlı USB-MIDI performans analizi** sunan interaktif Türkçe müzik eğitim platformu.

## ✨ Temel Özellikler

1. **Roland FP-10 USB-MIDI Canlı Entegrasyonu (`Web MIDI API`)**
   - Piyanonuzun arkasındaki **USB COMPUTER (USB-B)** portundan bilgisayarınıza bağladığınız kabloyla bastığınız her tuşu, **PHA-4 tuş hızı/şiddetini (`Velocity 0-127` -> `pp, p, mp, mf, f, ff`)**, notalar arası milisaniye zamanlamasını ve **Sustain Pedalını (`CC 64`)** anlık takip eder.
   - Çift ses oluşmaması için **FP-10 Hoparlör Modu** (MIDI geldiğinde tarayıcı sesini susturma, yalnızca referans/kulak eğitimi seslerini çalma) varsayılan olarak aktiftir.

2. **Bağlama Duyarlı Uzman Yapay Zeka Müzik Öğretmeni (`Maestro AI` - Gemini)**
   - Ekranın sağ panelinde her an yanınızdadır.
   - O an çalıştığınız dersi, ekrandaki VexFlow portesini, bastığınız akoru ve **son bastığınız 20 MIDI notasını (velocity ve ritim farklarıyla)** bilir.
   - Ders içindeki her kavrama tek tıkla *"Anlamadım / Öğretmene Sor"* diyebilir veya egzersiz sonunda *"Performansımı AI Öğretmenime Yorumlat"* butonuyla canlı tuşe/ritim analizi alabilirsiniz.

3. **Sıfırdan Bütüncül Türkçe Müfredat**
   - **Modül 1:** Sesin Doğası, Frekans, Oktav, PHA-4 Dinamik Kontrolü, 88 Tuş Haritası, Porte & Ritim Matematiği (*Ode to Joy* uygulaması).
   - **Modül 2:** Yarım/Tam Ses, Majör Gamın Altın Formülü (`T-T-Y-T-T-T-Y`), Majör & Minör Üçlü Akorların Duygu Kimyası, Şarkıların İskeleti (`I - V - vi - IV` / `C - G - Am - F`).
   - **Modül 3:** Bağıl Kulak (Relative Pitch) ve Aralıkları Duyarak Tanıma.
   - **Modül 4:** Zihindekini Müziğe Dökmek — Pentatonik Güvenli Liman ve Soru-Cevap (*Call & Response*) Melodi Kurma Sanatı.

4. **İnteraktif Kulak Eğitimi Laboratuvarı (`EarTrainingLab`)**
   - **Aralık Avcısı:** Duyduğunuz iki nota arasındaki mesafeyi listeden seçin veya doğrudan Roland FP-10 klavyenizde çalarak bulun.
   - **Akor Karakteri & Duygu Analizi:** Majör, Minör, Maj7 ve Dominant 7 akorları renginden tanıyın.
   - **Melodik Dikte (Duy ve Piyanoda Çal):** Uygulamanın çaldığı 4 notalık melodiyi dinleyip Roland FP-10 üzerinde kulaktan bulun.

5. **Zihindekini Müziğe Dök: Serbest Doğaçlama & Armoni Atölyesi (`ImprovisationStudio`)**
   - Bastığınız her akoru anında tanıyan **Canlı Armoni Dedektifi** ve uyumlu sonraki akor önerileri.
   - Seçtiğiniz gamı (Majör, Minör, Pentatonik, Armonik Minör, Dorian) 88 tuşlu klavyede aydınlatan **Doğaçlama Pusulası**.
   - **Müzikal Fikir Kaydedici (MIDI):** Çaldığınız melodiyi kaydedin, dinleyin ve Maestro AI'a nasıl devam ettirebileceğinizi sorun.

## 🚀 Çalıştırma

```bash
npm run dev
```

Tarayıcınızda `http://localhost:3000` adresini açın. Sağ üstteki **Ayarlar & API** butonundan Gemini API anahtarınızı girebilirsiniz.
