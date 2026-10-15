# San-Yuan Jiu-Wei Syndrome Differentiation System (三元九维辨证推演系统)

An offline Traditional Chinese Medicine (TCM) syndrome-differentiation inference engine built on a **3 elements × 9 dimensions × 3 states → 3⁹ = 19,683 state space**. Delivered as a native Android WebView shell + single-page H5 app with zero third-party JavaScript dependencies, fully offline, no permissions required.

## Highlights

- **State-space representation**: symptoms and macro labels (八纲/六经/体质) are aggregated into a nine-dimensional three-state vector `S ∈ {0,1,2}⁹`, with the neutral target state `T=(1,…,1)` as the health baseline.
- **Explainable deterministic inference**: aggregation → quantified diagnosis (deviation energy, tension, manifest potential, mediation fluidity, stability coefficient) → attractor identification (6 attractors: 中和/枢转/潜藏/升举/显化/关系) → stepwise migration path (single-dimension ±1, mandatory passage through mediating state 1) → formula ranking with compatibility checks (十八反/十九畏/相恶/妊娠/毒性).
- **Safety-aware**: P2/P3/P4 hard fixes eliminate real safety defects (表虚自汗 hard blocking, post-modification full-formula re-check, 附子→乌头类 eighteen-antagonism rules).
- **Verifiable**: engine regression 26/26, UI smoke tests 16/16, signed APK built (54 KB, `com.sanyuanjiuwei.bianzheng`, minSdk 24 / targetSdk 34).
- **Privacy-first**: no network, no storage, no location permissions; local records only (localStorage, max 50 entries).

## Repository Structure

```
├── app/          # Android WebView shell + H5 source (data.js / engine.js / app.js)
├── build.sh      # 7-step APK build chain (aapt2 → javac → d8 → apkbuilder → zipalign → apksigner)
├── docs/         # Architecture / Algorithm / Verification / Framework-mapping documentation
├── review/       # v1.0 audit report + regression & smoke test assets
├── paper/        # Paper (docx + markdown), corresponding author: q1z2q3@gmail.com
└── release/      # Source package zip + signed APK zip (v1.1)
```

## Verification Summary

| Item | Result |
| --- | --- |
| v1.0 audit (27 items) | 19 consistent / 6 partial / 2 unmet → fixes P1–P8 |
| Engine regression | 26/26 passed |
| UI smoke (jsdom) | 16/16 passed |
| Signed APK build | 54,368 B; `apksigner verify` OK |

## Paper

The accompanying paper describes the design, algorithms, and verification in detail:

- `paper/三元九维辨证推演系统_论文_v1.1.docx` / `.md` (bilingual abstract; Chinese full text)
- Title (EN): *San-Yuan Jiu-Wei Syndrome Differentiation System: Design and Verification of an Offline Traditional Chinese Medicine Inference Engine over a 19,683-State Space*
- Corresponding author: **q1z2q3@gmail.com**

## Disclaimer

This project is a research prototype and educational tool. It has **not** undergone clinical validation and must **not** be used to replace professional TCM diagnosis or prescription. Any medication suggestion requires review by a licensed practitioner.

## License

All rights reserved. No open-source license is granted unless explicitly stated. For collaboration or licensing inquiries, contact the corresponding author.