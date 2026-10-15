#!/bin/bash
# 三元九维辨证推演 · 离线APK构建脚本
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
APP="$ROOT/app"
SDK="$ROOT/android/sdk"
BT="$SDK/build-tools/35.0.0"
PLATFORM="$SDK/platforms/android-34/android.jar"
BUILD="/tmp/tcm9d_build"
PKG="com.sanyuanjiuwei.bianzheng"

rm -rf "$BUILD" && mkdir -p "$BUILD/gen" "$BUILD/obj" "$BUILD/dex" "$BUILD/apk"

echo "== [1/7] aapt2 编译资源 =="
"$BT/aapt2" compile --dir "$APP/res" -o "$BUILD/res.zip"

echo "== [2/7] aapt2 链接生成基础APK与R.java =="
"$BT/aapt2" link -o "$BUILD/apk/base.apk" \
  -I "$PLATFORM" \
  --manifest "$APP/AndroidManifest.xml" \
  --java "$BUILD/gen" \
  --auto-add-overlay \
  --min-sdk-version 24 --target-sdk-version 34 \
  "$BUILD/res.zip"

echo "== [3/7] javac 编译 Java =="
javac -source 11 -target 11 -bootclasspath "$PLATFORM" -classpath "$PLATFORM" \
  -d "$BUILD/obj" -encoding UTF-8 \
  "$APP/src/com/sanyuanjiuwei/bianzheng/MainActivity.java" "$BUILD/gen/com/sanyuanjiuwei/bianzheng/R.java" 2>/dev/null || \
javac --release 11 -classpath "$PLATFORM" -d "$BUILD/obj" -encoding UTF-8 \
  "$APP/src/com/sanyuanjiuwei/bianzheng/MainActivity.java" "$BUILD/gen/com/sanyuanjiuwei/bianzheng/R.java"

echo "== [4/7] d8 生成 classes.dex =="
"$BT/d8" --release --min-api 24 --lib "$PLATFORM" --output "$BUILD/dex" \
  $(find "$BUILD/obj" -name '*.class')

echo "== [5/7] 组装 APK（assets + dex）=="
cp "$BUILD/apk/base.apk" "$BUILD/apk/unsigned.apk"
cd "$APP" && zip -qr "$BUILD/apk/unsigned.apk" assets
cd "$BUILD/dex" && zip -qj "$BUILD/apk/unsigned.apk" classes.dex

echo "== [6/7] zipalign 对齐 =="
"$BT/zipalign" -f 4 "$BUILD/apk/unsigned.apk" "$BUILD/apk/aligned.apk"

echo "== [7/7] 签名 =="
KS="/tmp/tcm9d.keystore"
if [ ! -f "$KS" ]; then
  keytool -genkeypair -v -keystore "$KS" -alias tcm9d \
    -keyalg RSA -keysize 2048 -validity 10950 \
    -storepass tcm9d2026 -keypass tcm9d2026 \
    -dname "CN=SanYuanJiuWei, OU=TCM, O=Offline, L=Shanghai, C=CN"
fi
"$BT/apksigner" sign --ks "$KS" --ks-key-alias tcm9d \
  --ks-pass pass:tcm9d2026 --key-pass pass:tcm9d2026 \
  --out "$BUILD/三元九维辨证推演_v1.1.apk" "$BUILD/apk/aligned.apk"

"$BT/apksigner" verify --print-certs "$BUILD/三元九维辨证推演_v1.1.apk" | head -5
ls -la "$BUILD/三元九维辨证推演_v1.1.apk"
cp "$BUILD/三元九维辨证推演_v1.1.apk" "$ROOT/dist/" && echo "BUILD_OK"
