#!/usr/bin/env bash
set -euo pipefail

app_dir="$(cd "$(dirname "$0")/.." && pwd)"
workspace_dir="$(cd "$app_dir/../.." && pwd)"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
if [[ -z "${JAVA_HOME:-}" && -d /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home ]]; then
  export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
fi
if [[ -n "${JAVA_HOME:-}" ]]; then export PATH="$JAVA_HOME/bin:$PATH"; fi
export PATH="$ANDROID_HOME/platform-tools:$PATH"

cd "$workspace_dir"
npm run gen:audio
cd "$app_dir"
npm run gen:dict
npx expo prebuild --platform android --no-install
cd android
# Standalone release bundle, signed with the generated development key for PoC use.
./gradlew :app:assembleRelease -PreactNativeArchitectures=arm64-v8a --max-workers=2 "$@"
mkdir -p "$workspace_dir/dist/android"
cp app/build/outputs/apk/release/app-release.apk "$workspace_dir/dist/android/lingolyrics-poc.apk"
printf '\nAPK: %s\n' "$workspace_dir/dist/android/lingolyrics-poc.apk"
