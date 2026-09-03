# Como gerar o APK do Trinca Mania

Guia prático para compilar o `.apk` localmente na sua máquina Windows.

O projeto é **Expo (React Native)** compilado **localmente com Gradle** (não usa a
nuvem do EAS). A pasta `android/` é código nativo _gerado_ a partir do `app.json`
— por isso ela está no `.gitignore` e não vai para o Git.

> **Sobre os caminhos deste guia:** onde aparecer `SEU_USUARIO`, troque pelo nome
> do seu usuário do Windows. Onde o projeto estiver, use o caminho real da pasta
> (nos exemplos usamos `C:\Users\SEU_USUARIO\TrincaMania`, mas pode ser qualquer
> lugar). No PowerShell você também pode usar variáveis do sistema, por exemplo
> `$env:USERPROFILE` (sua pasta de usuário) e `$env:LOCALAPPDATA` (a pasta
> `AppData\Local`).

---

## Resumo rápido (o dia a dia)

Na maioria das vezes você só precisa destes dois comandos:

```powershell
cd C:\Users\SEU_USUARIO\TrincaMania
git pull

cd C:\Users\SEU_USUARIO\TrincaMania\android
.\gradlew.bat assembleRelease
```

O APK sai em:

```
android\app\build\outputs\apk\release\app-release.apk
```

---

## Pré-requisitos (configura só uma vez)

| Ferramenta      | Onde costuma ficar / valor de exemplo                                    |
| --------------- | ------------------------------------------------------------------------ |
| **JDK 21**      | `C:\Program Files\Android\Android Studio\jbr` (vem com o Android Studio) |
| **Android SDK** | `C:\Users\SEU_USUARIO\AppData\Local\Android\Sdk`                         |
| `JAVA_HOME`     | `C:\Program Files\Android\Android Studio\jbr`                            |
| `ANDROID_HOME`  | `C:\Users\SEU_USUARIO\AppData\Local\Android\Sdk`                         |

> As duas variáveis de ambiente (`JAVA_HOME` e `ANDROID_HOME`) são usadas pelo
> Gradle para achar o Java e o SDK. Se um dia der erro de "SDK not found" ou
> "JAVA_HOME is not set", é aqui que se resolve.

Para conferir os valores atuais no PowerShell:

```powershell
echo $env:JAVA_HOME
echo $env:ANDROID_HOME
```

---

## Passo a passo completo

### 1. Atualizar o código

```powershell
cd C:\Users\SEU_USUARIO\TrincaMania
git pull
npm install        # só se o package.json / package-lock.json tiver mudado
```

### 2. Compilar o APK

```powershell
cd C:\Users\SEU_USUARIO\TrincaMania\android
.\gradlew.bat assembleRelease
```

O comando `assembleRelease` faz o Gradle:

1. **Empacotar o código JS/TS** — o Metro gera o "bundle" e coloca dentro do APK.
2. **Compilar a parte nativa** Android.
3. **Juntar tudo e assinar** o APK.

A primeira build (ou após um `--clean`) leva ~10–15 min. As seguintes são mais
rápidas porque o Gradle reaproveita o que não mudou.

### 3. Copiar para a raiz com nome de versão (opcional, só organização)

```powershell
cd C:\Users\SEU_USUARIO\TrincaMania
copy android\app\build\outputs\apk\release\app-release.apk TrincaMania-v1.0.0.apk
```

### 4. Instalar no celular

Transfira o `.apk` para o celular (cabo USB, WhatsApp, Google Drive...) e abra o
arquivo. O Android vai pedir para permitir "instalar de fontes desconhecidas" —
é só autorizar.

---

## Quando preciso regerar a pasta nativa (`prebuild`)?

Na maioria das atualizações (mudanças só em `src/`, ou seja, JavaScript/TypeScript)
**NÃO** precisa. O `assembleRelease` já pega o código novo sozinho.

Você só precisa regerar a pasta `android/` quando mudar algo **nativo**:

- nome ou ícone do app;
- o `package` (identificador do app, ex.: `br.com.mhvtech.trincamania`);
- permissões;
- adicionar/remover plugins Expo ou bibliotecas nativas no `app.json` / `package.json`.

Nesses casos, rode antes de compilar:

```powershell
cd C:\Users\SEU_USUARIO\TrincaMania
npx expo prebuild --platform android --clean
```

> ⚠️ `--clean` apaga e recria a pasta `android/`. Se você tiver feito ajustes
> manuais dentro dela, faça backup antes.

---

## Assinatura (importante saber)

Atualmente o APK de release é assinado com a **chave de debug**
(veja `android/app/build.gradle`, no bloco `release`).

- ✅ Serve para **testar e distribuir o `.apk` por fora** (instalação manual).
- ❌ **Não** serve para publicar na **Play Store** — a Play exige uma keystore
  própria e um formato `.aab` (Android App Bundle), gerado com `bundleRelease`
  no lugar de `assembleRelease`.

---

## Alternativas ao build local

| Comando                                  | O que faz                                                                                                                   |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `npx expo run:android`                   | Compila **e instala** direto num celular/emulador conectado. Bom para testar rápido.                                        |
| `eas build -p android --profile preview` | Compila **na nuvem** do Expo (não usa sua máquina). O perfil `preview` já está configurado no `eas.json` para gerar `.apk`. |

---

## Problemas comuns

| Erro                                   | Solução                                                                                        |
| -------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `JAVA_HOME is not set`                 | Definir `JAVA_HOME` = pasta do JDK (ex.: `C:\Program Files\Android\Android Studio\jbr`).       |
| `SDK location not found`               | Definir `ANDROID_HOME` = pasta do SDK (ex.: `C:\Users\SEU_USUARIO\AppData\Local\Android\Sdk`). |
| Build trava / erros estranhos de cache | `cd android` → `.\gradlew.bat clean` e compilar de novo.                                       |
| Caminho muito longo (Windows)          | Compilar num caminho curto (ex.: copiar o projeto para `C:\tm_build`).                         |
