# Muzigim - Proje Çalışma Kuralları

Bu projede yapılan tüm geliştirmelerde aşağıdaki kurallar istisnasız uygulanmalıdır:

## 1. Versiyonlama Kuralı (`vX.Y.Z`)
- Uygulama versiyonu `src/lib/version.ts` (`APP_VERSION`) ve `package.json` (`version`) dosyalarında tutulur ve üst navigasyon barında (`src/app/page.tsx`) küçük bir etiket olarak gösterilir.
- Projede yapılan **her değişiklik sonrasında** versiyonun **3. hanesi (patch)** otomatik olarak `+1` artırılmalıdır (ör. `v0.0.1` -> `v0.0.2` -> `v0.0.3`).
- İlk iki hane (`X.Y`) **yalnızca kullanıcı açıkça belirttiğinde** değiştirilir; kendi başınıza ilk iki haneyi değiştirmeyin.

## 2. Otomatik Commit ve Push Kuralı
- Yapılan her kod değişikliği (yeni versiyon numarası güncellemeleriyle birlikte) tamamlandığında kullanıcı sormadan otomatik olarak `git add`, `git commit` (commit mesajında yeni versiyon numarasını belirterek, ör. `v0.0.2: ...`) ve `git push origin main` ile GitHub'a gönderilmelidir.

## 3. Canlıya Alma (Production Deploy) Kuralı
- Canlı ortam adresi `https://muzigim.web.app` (Firebase Hosting - `muzigim` projesi) üzerindedir.
- Kullanıcı açıkça **"canlıya al"** (veya belirli bir versiyonu yayına al) demedikçe Firebase deploy işlemi yapılmaz.
- Kullanıcı canlıya alınmasını istediğinde sırasıyla `npm run build` ile statik çıktı (`out/`) üretilmeli ve `firebase deploy --only hosting` komutuyla `muzigim.web.app` güncellenmelidir.
