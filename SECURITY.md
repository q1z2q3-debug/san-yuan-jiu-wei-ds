# Security Policy

## Supported versions

| Version | Supported |
| --- | --- |
| v1.1 | ✅ current |
| v1.0 | ⚠️ superseded — upgrade recommended |

## Security properties of the shipped APK

The application is deliberately minimal and offline:

- **No network access** — the manifest requests no `INTERNET` permission.
  The app cannot transmit data anywhere.
- **No storage or location permissions** — no `READ/WRITE_EXTERNAL_STORAGE`,
  no `ACCESS_FINE_LOCATION`.
- **No third-party JavaScript** — all code is first-party, bundled locally.
- **Local-only records** — user notes are stored in the WebView
  `localStorage` on the device only (capped at 50 entries).

### APK signing certificate

The released APK (`release/三元九维辨证推演_v1.1.apk`) is signed with the
project's release key:

- Certificate DN: `CN=SanYuanJiuWei, OU=TCM, O=Offline, L=Shanghai, C=CN`
- SHA-256 fingerprint:
  `8067D0858E5BD211452AA9948308AA7B6F9BB3D99FE1C5AA29065B01F924328A`

Verify locally with Android build-tools:

```bash
apksigner verify --print-certs 三元九维辨证推演_v1.1.apk
```

If the fingerprint does not match, **do not install the APK** — it did not
come from this project.

### What is never committed

- The APK signing keystore (`.jks` / `.keystore` / `.p12`) and its passwords.
- Any API tokens, credentials or private keys.
- The Android SDK toolchain.

These are excluded by `.gitignore`; if you ever find such material in the
repository or its history, please report it immediately (see below).

## Reporting a vulnerability

Please email **q1z2q3@gmail.com** with:

1. affected version (v1.0 / v1.1) and component (`app/`, `build.sh`, APK),
2. a minimal reproduction (steps or a proof-of-concept file),
3. impact assessment if you have one.

Expect an acknowledgement within 48 hours. Please do **not** open a public
issue for an unfixed vulnerability; coordinated disclosure is appreciated.

## Out of scope

- The correctness of TCM diagnostic conclusions — that is a domain and safety
  question covered by `DISCLAIMER.md`, not a software vulnerability.
- Devices with modified system images or rooted environments.