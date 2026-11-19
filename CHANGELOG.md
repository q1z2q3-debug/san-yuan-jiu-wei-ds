# Changelog

All notable changes to this project are documented in this file.

## [v1.1] — 2026-11-19 (unified open-source release)

Repository-wide consistency and licensing release. No algorithmic change to
the engine; this release makes the project properly open source and makes the
APK directly obtainable.

### Added

- `LICENSE` (MIT) for source code, `LICENSE-docs.md` (CC BY 4.0) for
  documentation and papers — replaces the previous "All rights reserved"
  statement.
- `SECURITY.md` — supported versions, APK signing-certificate fingerprint,
  reporting channel, and the list of material that is never committed.
- `DISCLAIMER.md` — bilingual medical safety notice (research/education only,
  not a medical device, no self-medication).
- `NOTICE` — license map and third-party component statement.
- `CHANGELOG.md` and `.gitignore` (excludes the Android SDK toolchain and any
  signing material).
- `release/三元九维辨证推演_v1.1.apk` — the signed APK itself, so it can be
  downloaded straight from the repository without unzipping.
- GitHub Release `v1.1` with the APK and source package attached.

### Changed

- `README.md` — License section rewritten (MIT + CC BY 4.0), download section
  added, version table clarified, links to SECURITY / DISCLAIMER / NOTICE.
- Project version semantics corrected: the `v1.0` tag predates the v1.1
  content; `v1.1` now has its own tag and release.

### Verified

- Engine regression: 26/26 passed.
- UI smoke tests: 16/16 passed.
- APK signature: `apksigner verify` OK — SHA-256
  `8067D0858E5BD211452AA9948308AA7B6F9BB3D99FE1C5AA29065B01F924328A`.

## [v1.1] — 2026-10-15 (initial v1.1 content)

- English manuscript added (`paper/三元九维辨证推演系统_论文_EN_v1.1`).
- Safety hard fixes P2/P3/P4 (表虚自汗 blocking, post-modification re-check,
  附子→乌头类 eighteen-antagonism rules).
- v1.0 audit follow-up (P1–P8), engine regression 26/26, UI smoke 16/16.

## [v1.0] — 2026-10-15

- First public snapshot: WebView shell + H5 engine over 3^9 = 19,683 states.
- v1.0 audit report (27 items) in `review/`.