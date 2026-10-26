#!/usr/bin/env bash
set -euo pipefail
set +x

required=(ANDROID_KEYSTORE_BASE64 ANDROID_KEYSTORE_PASSWORD ANDROID_KEY_ALIAS ANDROID_KEY_PASSWORD)
missing=()
for name in "${required[@]}"; do
  [[ -n "${!name:-}" ]] || missing+=("$name")
done
if (( ${#missing[@]} )); then
  printf 'Missing signing secrets: %s\n' "${missing[*]}"
  exit 1
fi

sdk="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
[[ -n "$sdk" && -d "$sdk/build-tools" ]] || { echo 'Android build tools are required'; exit 1; }
build_tools=$(find "$sdk/build-tools" -mindepth 1 -maxdepth 1 -type d | sort -V | tail -n 1)
input=android/app/build/outputs/apk/release/app-release-unsigned.apk
[[ -f "$input" ]] || { echo 'Unsigned release APK is missing'; exit 1; }
temp_dir=$(mktemp -d)
trap 'rm -rf "$temp_dir"' EXIT
umask 077
printf '%s' "$ANDROID_KEYSTORE_BASE64" | base64 --decode > "$temp_dir/release.keystore"
mkdir -p release-android
"$build_tools/zipalign" -P 16 -f 4 "$input" "$temp_dir/aligned.apk"
"$build_tools/apksigner" sign --ks "$temp_dir/release.keystore" \
  --ks-key-alias "$ANDROID_KEY_ALIAS" \
  --ks-pass env:ANDROID_KEYSTORE_PASSWORD --key-pass env:ANDROID_KEY_PASSWORD \
  --out release-android/squishy-rustore.apk "$temp_dir/aligned.apk"
"$build_tools/apksigner" verify --verbose --print-certs release-android/squishy-rustore.apk > release-android/signature.txt
"$build_tools/zipalign" -c -P 16 4 release-android/squishy-rustore.apk
sha256sum release-android/squishy-rustore.apk > release-android/SHA256SUMS
echo 'Release APK signed and verified.'
