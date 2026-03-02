
PROJETO THAIS — PLAYSTORE (ZIP COMPLETO)

O que já vem pronto:
✅ App branco/rosa premium (várias telas)
✅ Ícone Play Store (assets/icon_512.png) + set de mipmaps em /android-resources
✅ Splash images em /android-resources (legacy) + assets/splash_1080x1920.png
✅ Funciona OFFLINE (dados ficam no celular)

GERAR APK (PowerShell):
1) Extraia o ZIP
2) Abra PowerShell dentro da pasta do projeto
3) Rode:
   npm install
   npx cap add android
   npx cap copy
   npx cap open android

COLOCAR ÍCONE E SPLASH NO ANDROID (deixar nível Play Store):
Depois que abrir o Android Studio (passo acima):
A) Ícone:
   Copie as pastas dentro de /android-resources/mipmap-* para:
   android/app/src/main/res/
B) Splash (simples/legacy):
   Copie as pastas /android-resources/drawable-* para:
   android/app/src/main/res/
   (opcional) use assets/splash_1080x1920.png como referência.

Depois: Build > Build APK

Se você me mandar um print do Android Studio (tela aberta), eu te digo exatamente onde colar (pasta certa).
