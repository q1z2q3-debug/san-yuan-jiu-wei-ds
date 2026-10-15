# San-Yuan Jiu-Wei Syndrome Differentiation System: Design and Verification of an Offline Traditional Chinese Medicine Inference Engine over a 19,683-State Space

RUNZEAI

Independent Researcher

Corresponding Author: q1z2q3@gmail.com

---

**Abstract**: Computerization of syndrome differentiation (辨证论治) in Traditional Chinese Medicine (TCM) faces lasting challenges in knowledge representation granularity, inference explainability, and deployment accessibility. This paper presents the San-Yuan Jiu-Wei Syndrome Differentiation System (SYJW-DS), which instantiates the cognitive framework of "three elements × nine dimensions × three states → 3⁹ = 19,683 state space" into a runnable TCM syndrome-differentiation inference engine. The system consists of a native Android WebView shell and a single-page H5 application with zero third-party JavaScript dependencies, running fully offline. The inference pipeline comprises: (1) constructing a nine-dimensional three-state state vector S from symptom voting and macro-label anchoring (thresholded at ±1.5); (2) quantifying the diagnosis through five indices—deviation energy, tension index, manifest potential, mediation fluidity, and ontological stability coefficient; (3) identifying the current stable basin among six attractors; (4) generating pull paths toward the neutral state following migration rules of "single-dimension ±1 steps, mandatory passage through the mediating state 1, and layer-by-layer progression"; and (5) ranking interventions by weighted scores of formula-vector distance, attractor fit, label corroboration, and contraindication penalties, with compatibility checks for the eighteen antagonisms, nineteen incompatibilities, mutual antagonism, pregnancy prohibitions, and toxicity grades. The system incorporates 75 symptoms, 23 macro labels, 14 formulas, and 66 herbs. In engineering verification, a 27-item audit identified eight fixes (P1–P8); after the fixes, engine regression passed 26/26 and UI smoke tests passed 16/16, and a signed APK of 54 KB was built. The system emphasizes determinism, reproducibility, and auditability: the noise term is set to zero and all inference logic is verifiable through scripted regression. This paper honestly reports the scope of framework instantiation and engineering trade-offs, and explicitly states that the system has not undergone clinical validation and is intended for research and teaching reference only.

**Keywords**: TCM syndrome differentiation; state space; attractor; explainable inference; offline mobile application; WebView; H5

---

## 1 Introduction

Traditional Chinese Medicine is a traditional medical system with a long history and a distinctive theoretical framework, and syndrome differentiation (辨证论治) is its core methodology for clinical practice [1,2]. With the development of artificial intelligence and mobile health technology, converting the tacit knowledge of syndrome differentiation into explicit models that are computable, explainable, and reproducible has become one of the central problems in TCM informatization and intellectualization. Existing work mainly follows two paths: the early knowledge-engineering path based on expert systems and rule bases, and the modern path based on data-driven deep learning. The former is transparent but suffers from coarse knowledge granularity and high maintenance cost; the latter achieves strong performance but lacks explainability and often outputs conclusions in a "black-box" manner, which is in tension with the disciplinary tradition of syndrome differentiation that requires the self-consistent chain of "principle, method, formula, and medicinals" [3].

This paper proposes and implements the San-Yuan Jiu-Wei Syndrome Differentiation System (SYJW-DS), which makes explicit choices along three dimensions—knowledge representation granularity, explainability, and deployment accessibility—by adopting the "three elements × nine dimensions × three states → 19,683 state space" cognitive framework as the unified knowledge representation, a deterministic rule engine as the inference core, and an offline Android application as the delivery form.

The main contributions of this paper include:

1. **State-space-based syndrome representation**: heterogeneous evidence such as symptoms, eight-principle (八纲) syndromes, six-meridian (六经) syndromes, and constitution types is uniformly mapped to a nine-dimensional three-state state vector S ∈ {0,1,2}⁹, with a theoretical state space of 3⁹ = 19,683 and the target state T = (1,…,1) as the healthy baseline, providing computable coordinates for syndrome differentiation;
2. **Explainable deterministic inference engine**: a six-step inference chain of "aggregation–diagnosis–attractor identification–migration path–formula scoring–compatibility review" is implemented entirely with auditable pure functions, the noise term is set to zero, and results are guaranteed reproducible;
3. **Zero-dependency offline delivery**: implemented as a native Android WebView shell plus a single-page H5 application with no third-party JavaScript libraries and no network or storage permissions, producing a signed APK of 54 KB that runs independently in network-free environments;
4. **Engineering-grade verification process**: a 27-item item-by-item audit identified and fixed eight defects (P1–P8, three of which were genuine safety defects); after the fixes, engine regression passed 26/26 and UI smoke tests passed 16/16, and the verification scripts are archived together with the source code for reproduction.

The remainder of this paper is organized as follows. Section 2 reviews related work. Section 3 presents the overall system architecture. Section 4 details the core algorithms. Section 5 describes implementation considerations. Section 6 reports the verification method and results and honestly discusses limitations. Section 7 discusses engineering trade-offs and future work. Section 8 concludes the paper.

## 2 Related Work

**Classical theory of syndrome differentiation**. Syndrome differentiation was established as a six-meridian framework by the *Shanghan Zabing Lun* [1], and its predecessor, the *Huangdi Neijing*, already systematically discussed the basic concepts of yin–yang, viscera, and meridians [2]. The process of syndrome differentiation can be understood as: taking the four-diagnosis information as input, passing through syndrome recognition and pathogenesis induction, and outputting treatment principles and formulas. In information structure, this process is isomorphic to the pattern-recognition path of "symptoms/evidence → state estimation → intervention decision," which makes state-space modeling possible.

**TCM informatization and expert systems**. Since early expert systems such as the "Guan Youbo Hepatitis Syndrome-Differentiation Program" in the 1970s, TCM knowledge engineering has gone through rule bases, fuzzy inference, Bayesian networks, and other stages. Expert-system approaches are transparent and auditable but suffer from high knowledge-acquisition and maintenance costs, and their rules often remain at the macroscopic level of "syndrome type–formula," lacking fine-grained modeling of the constraints between symptom-level evidence and syndrome mechanisms.

**Data-driven methods**. Deep learning and large language models have been widely applied to assisted diagnosis in recent years, but most models lack a traceable evidence chain and have difficulty handling the strongly context-dependent nature of "same disease with different syndromes, different diseases with the same syndrome" in TCM. International organizations have also emphasized the need to integrate traditional medicine with modern evidence systems [4]. This system chooses to introduce "state-space + attractor" dynamical modeling within the rule-engine framework, improving the granularity of knowledge representation while maintaining full explainability.

**Offline mobile health applications**. Privacy and usability requirements in health applications have driven a return to "local computing." The Android WebView component allows an H5 logic layer to be hosted inside a native shell, maintaining UI development efficiency while preserving offline capability and permission minimization [5]. This system adopts that architecture: the application declares no permissions at all, consistent with the privacy-minimization principle.

## 3 System Architecture

### 3.1 Architecture Overview

The system adopts a two-layer offline implementation of "native Android WebView shell + single-page H5 application," as shown in Figure 1.

```
+--------------------------------------------------------------+
| Android shell (Java)                                         |
| MainActivity - WebView loads assets/index.html               |
| (no network permission, no storage permission, pure offline) |
+--------------------------------------------------------------+
| Single-page H5 (native JS, zero third-party dependencies)    |
| index.html      layout / navigation / disclaimer             |
| css/app.css     dark-green nine-dimensional radar theme      |
| js/data.js      data layer - symptoms/formulas/herbs/contra  |
| js/engine.js    engine layer - aggregation/diagnosis/recommend|
| js/app.js       UI layer - three-step wizard/render/history   |
+--------------------------------------------------------------+
| localStorage (inference records, max 50 entries, no cloud)   |
+--------------------------------------------------------------+
```
Figure 1. Overall system architecture

Layering principle: the data layer declares only structured data; the engine layer performs only pure-function computation (runnable and verifiable independently in Node.js); the UI layer handles only interaction and rendering. The engine and data layers do not depend on any DOM/BOM, which is the foundation of the system's testability.

### 3.2 Directory and Build Chain

The source structure is as follows: `app/` contains AndroidManifest.xml, assets (index.html, css/app.css, js/data.js, js/engine.js, js/app.js), res icons, and MainActivity.java; `build.sh` is a seven-step build chain; `docs/` holds five engineering and technical documents; `review/` stores audit reports and test scripts.

The build chain is: aapt2 compile → aapt2 link → javac --release 11 → d8 --min-api 24 → aapt2 add/apkbuilder → zipalign -f 4 → apksigner sign/verify. The final artifact is a signed APK (54,368 B, package com.sanyuanjiuwei.bianzheng, versionName 1.1, minSdk 24 / targetSdk 34).

### 3.3 Runtime Data Flow

After the user selects symptoms and macro labels, the UI layer calls `Engine.run(symptoms, tagObjs, ctx)`, which executes in order: state aggregation (aggregateState) → quantitative diagnosis (diagnose) → attractor identification (matchAttractor) → formula scoring and contraindications (scoreFormulas) → migration path and Top-3 enhancement (buildPath/compat) → rendering of the report card (radar chart, indices, attractor, formula cards, migration overview, neutral-state dedicated card).

## 4 Core Algorithms

### 4.1 State Space and Three-Element Mapping

The system maps the "three elements" to three foundational quantifiable objects: (1) **T—target state**, the neutral-state vector with all nine dimensions at the median value 1, representing the baseline of "yin and yang in equilibrium, healthy qi retained within"; all inference takes T as the endpoint; (2) **S—state vector**, the coordinate of the current syndrome in the 19,683-state space; (3) **C—coupling structure**, four pairs of opposing couplings and a three-layer dimension hierarchy.

The nine dimensions (d1–d9) are, in order: ontology, time, space, energy, information, relation, order, value, and action; each dimension takes three states: 0 = hidden/deficient, 1 = neutral/appropriate, 2 = manifest/excessive. The theoretical state space is therefore 3⁹ = 19,683. The four opposing coupling pairs (0-based indices): time–space coupling (d2·d3), energy–information coupling (d4·d5), group–order coupling (d6·d7), and knowing–doing coupling (d8·d9). Dimensions are layered as the inner core layer (d1, d2, d3), the dynamic layer (d4, d5, d6, d7), and the expressive layer (d8, d9), embodying the layer semantics that "evolution transmits from inside outward, and the expressive layer changes fast but is easy to revert."

### 4.2 Step 1: Aggregating Evidence into a State Vector

`aggregateState(selectedSymptoms, selectedTags, ctx)` proceeds in four steps:

1. **Symptom voting**: each symptom's `v` field is a "dimension→vote" mapping (e.g., cold extremities 四肢厥冷 `v:{3:-2, 8:-1, 0:-1}`), accumulated dimension-wise with interpretable traces recorded;
2. **Macro-label anchoring**: eight-principle labels have weight w=1, six-meridian/constitution labels have weight w=2; components of a label's typical vector that are not 1 vote by (val−1)×w;
3. **Trinarization**: each dimension's vote is mapped to 2 if ≥1.5, 0 if ≤−1.5, and 1 otherwise; the raw strength is retained separately for display;
4. **Symptom-level tag pass-through**: the UI layer aggregates tags from the `tag` fields of selected symptoms (superficial deficiency/excess, stasis, cold, heat, deficiency, phlegm-dampness, damp-heat, qi stagnation, shaoyang, etc.) into `ctx.symTags` for syndrome contraindications and indication corroboration, avoiding hollow inference in which "symptoms are selected but the engine has no evidence."

### 4.3 Step 2: Quantitative Diagnostic Indices

`diagnose(S)` outputs five indices (Table 1):

| Index | Formula | Semantics |
| --- | --- | --- |
| Deviation energy E | E = sum abs(Δᵢ) = sum abs(Sᵢ−Tᵢ) | Total deviation from the neutral state; E=0 means fully neutral |
| Tension index | tension = sum abs(Sₐ−S_b) (sum of four coupling-pair differences) | Difference within opposing couplings → internal friction |
| Manifest potential | potential = (d1+d4+d8+d9)/4 × w7 | Output capacity × order weight (w7=0.6/1.0/1.2) |
| Mediation fluidity | fluidity = ones/9 | Fraction of dimensions at 1 → regulatory flexibility |
| Ontological stability | stability = (d1+d7+d8)/3 | Ontology+order+value joint anti-perturbation capacity |

Index linkage rules: high tension + low fluidity → the mediation channel must be restored first; high potential + low stability → deficient fire, strong manifestation prohibited; low stability + high tension → most dangerous combination; high fluidity + low tension → healthy and adjustable. The system also defines four types of hard blockage: d6=2∧d7=0, d5=2∧d4=0, d9=2∧d8=0, d1=0∧d9=2, plus coupling warnings for "pair difference ≥2."

### 4.4 Step 3: Attractor Identification

`matchAttractor(S, dx, ctx)` computes a fit score for each of the six attractors (neutral/rotation/hidden/ascending/manifest/relation): structural feature scoring (e.g., hidden: yin deficiency with yang floating +3, yang deficiency with cold excess +2, d1=d4=d8=0 co-hidden +3; manifest requires passing the "manifest gate" d4=2 ∨ (d3=0∧d2=2) ∨ (d5=2∧d4≥1)) plus macro-label prior bonuses (six-meridian/constitution/eight-principle → attractor, read from `ctx.tags ∪ ctx.liujing ∪ ctx.tizhi`). The highest score is selected following the framework's prescribed switching order (neutral→rotation→hidden→ascending→manifest→relation); when the score ≤0, it falls back to "neutral."

### 4.5 Steps 4–8: Formula Scoring, Migration Path, and Compatibility Review

**Scoring**: for each formula compute

```
score = −sum wᵢ·abs(Sᵢ − vᵢ)      (wᵢ: d1/d3/d7 = 1.5, others = 1.0)
      + attractor fit (primary attractor +4)
      + label corroboration (eight-principle/six-meridian/constitution
        consistent with formula indication, up to +4)
      − contraindication penalty P
```

**Hard blocking (excluded from candidates, listed separately)**: pregnancy prohibition; d1=0 prohibits strong manifestation; stability coefficient ≤0.5 prohibits strong attack and strong sweating; syndrome contraindications (e.g., superficial deficiency with spontaneous sweating forbids Mahuang Decoction, reading the "superficial deficiency" tag from `ctx.symTags` since P2). **Soft penalty (kept in candidates but down-weighted)**: insufficient syndrome indication (e.g., Buyang Huanwu Decoction is down-weighted when no stasis evidence is present, reading the "stasis" tag since P5); caution conditions.

**Migration path**: `buildPath(S)` moves each step by ±1 in a single dimension, first rising/contracting to the mediation channel 1, forbidding direct 0↔2 jumps; layer-by-layer progression follows PATH_ORDER=[d1, d7, d3, d6, d5, d4, d8, d2, d9] (first repair the load-bearing dimensions d1/d7/d3 → relation d6/information d5 → energy d4 → then converge value d8/time d2/action d9); `nextState` applies the first three steps and returns S₁ for user preview.

**Top-3 enhancement**: `run()` attaches to the Top-3 passed formulas the original-formula compatibility review (compat: eighteen antagonisms/nineteen incompatibilities/mutual antagonism/pregnancy/toxicity), a full-formula re-review after suggested additions (compatFull: merges the herbs suggested by each dimension's addition/subtraction reasoning into the original formula and re-reviews, avoiding the missed report of "the original formula is safe but becomes toxic after addition"), a step-by-step migration path, the expected next state S₁, and addition/subtraction reasoning generated from the residual deviation.

**Compatibility review**: `checkCompat(herbList, ctx)` covers the eighteen-antagonism table (including aconite → pinellia/trichosanthes/fritillaria/white peony/bletilla, with aconite recognized as processed aconite root), the nineteen-incompatibility table, the mutual-antagonism table, the pregnancy-prohibited/caution tables, and toxicity grades (highly toxic reduce by six-tenths, toxic reduce by seven-tenths, mildly toxic reduce by eight-tenths), outputting graded entries for UI coloring.

### 4.6 Determinism Principle

The framework's state-update formula is "new state = current state + pulling force − resistance + noise." The system provides a one-to-one implementation for pulling force (migration path and formula scoring) and resistance (contraindication penalties and hard blockages), and sets the noise term to zero—a deliberate trade-off in exchange for reproducibility, regression testability, and auditability.

## 5 Implementation

### 5.1 Data Scale

System-embedded data (measured in data.js): 75 symptoms/signs (9 cold–heat + 16 head–body + 12 stool–urine + 7 emotion + 6 skin + 8 tongue + 11 pulse + 6 context); 23 macro labels (8 eight-principle / 6 six-meridian / 9 constitution); 14 formulas (Guizhi Decoction, Liuwei Dihuang Pill, Mahuang Decoction, Xiaochaihu Decoction, Buzhong Yiqi Decoction, Sini Decoction, Lizhong Pill, Xiaoyao Powder, Xuefu Zhuyu Decoction, Buyang Huanwu Decoction, Longdan Xiegan Decoction, Yinchenhao Decoction, Baihu Decoction, Dachengqi Decoction); 66 herbs (four natures, five flavors, channel tropism, toxicity, plus nine-dimensional operations); 11 mapping tables. All data is declared as structured JS constants for audit and re-annotation.

### 5.2 Interface and Interaction

The interface is a three-step wizard: select symptoms → select macro labels (eight-principle/six-meridian/constitution) → generate the inference report. The report contains the nine-dimensional radar chart, five indices, the attractor card, formula cards (including dual logs of original-formula review and full-formula re-review), a step-by-step migration overview (discrimination conditions, six-attractor fit scores), and a neutral-state dedicated card (when E=0, it prompts that no medication intervention is needed and does not render prescription recommendations). Inference records are stored in localStorage (up to 50 entries, no cloud).

### 5.3 Build and Testability

- **Engine runs independently**: concatenating `data.js + engine.js` runs directly in Node.js, and all inference logic can be verified by scripts;
- **UI can be smoke-tested in jsdom**: after inlining the three JS files into index.html, a full inference flow is simulated in jsdom (with stubs injected for canvas/alert/confirm);
- **Zero dependencies**: no third-party libraries and no network requests on the JS side, suitable for offline audit and re-packaging;
- **Version control**: v1.1 modifies only three files (data.js/engine.js/app.js) and version-related fields, with a small and traceable change surface.

## 6 Verification and Evaluation

### 6.1 Verification Method

Verification uses a four-layer method: (1) full source-code reading (data, engine, UI, manifest, build scripts); (2) engine dynamic verification: the data layer and engine are concatenated into a single file and run in Node.js; (3) UI smoke verification: three JS files inlined into index.html simulate a complete inference flow in jsdom; (4) baseline alignment: the same scripts compare v1.0 and v1.1 item by item, confirming no behavioral drift except at the repair points.

### 6.2 v1.0 Audit Conclusions

Among the 27 item-by-item checks: 19 consistent, 6 partially implemented, and 2 not achieved. Three items were confirmed as genuine safety defects: failure of the superficial-deficiency-with-spontaneous-sweating hard block (P2), missing full-formula re-review after additions (P3), and failure of the aconite→aconitum eighteen-antagonism rule (P4).

### 6.3 v1.1 Fix List and Verification Results

| ID | Severity | Fix | Verification result |
| --- | --- | --- | --- |
| P1 | Medium | Symptom count adjusted 60→75 (documentation revision) | Document verified |
| P2 | High | ctx.symTags pass-through; superficial-deficiency spontaneous-sweating syndrome contraindication hard block | Regression blocking; UI blocking list rendered |
| P3 | High | Top-3 original-formula + post-addition full-formula re-review (compatFull); dual-section UI logs | Regression includes "aconite 反 pinellia"; UI full-formula re-review rendered |
| P4 | High | Eighteen antagonisms: add aconite → pinellia/trichosanthes/fritillaria/white peony/bletilla | checkCompat detects "antagonism"; UI danger prompt rendered |
| P5 | Medium | Stasis-four-symptoms evidence pass-through | Buyang Huanwu Decoction shows insufficient-indication warning and is not hard-blocked |
| P6 | Low | Neutral state (E=0) changed to dedicated card, no prescription Top rendered | E=0 & attractor=neutral; UI dedicated card has no f-card |
| P7 | Low | buildPath semantic copywriting by start/end state | No old fixed copy |
| P8 | Low | Migration overview supplemented with scene/cond/switchPre/risk and six-attractor fit | UI discrimination conditions/six attractors rendered |

The verification process also found and fixed one independent fatal defect: the initial v1.1 app.js introduced an unclosed `else` branch during the P6 refactoring; `node --check` reported `Unexpected end of input` (which would cause a white screen in the browser). After locating and fixing it, the syntax check passed.

### 6.4 Regression and Smoke Results

**Engine regression passed 26/26**. Six typical syndrome groups aligned with the v1.0 baseline (yangming heat-excess, shaoyin cold-transformation, liver depression and qi stagnation, yin deficiency with fire effulgence, pregnancy state, neutral state) + targeted verification of P2–P5/P7 + two root-cause checks. Taking the shaoyin cold-transformation smoke scenario as an example: symptoms "marked aversion to cold not relieved by adding clothes / cold extremities / loose stools / clear copious urine / pale tongue with white coating / deep pulse," labels "cold syndrome / yin syndrome / shaoyin disease," constitution "yang deficiency," yields S=(0,1,0,0,1,0,0,0,0), attractor=hidden (15), Top=Sini Decoction (8)/Lizhong Pill (8), fully consistent with the v1.0 baseline.

**UI smoke passed 16/16**. Coverage: initialization rendering; the full shaoyin cold-transformation flow (hidden card, Sini Decoction card, dual review sections, migration overview); the neutral-state dedicated card (no prescription Top rendered); superficial-deficiency spontaneous-sweating blocking; stasis-four-symptoms Buyang Huanwu no-warning check; shaoyang + yang deficiency full-formula re-review containing "aconite 反 pinellia"; localStorage record save and reload; no runtime errors throughout.

**Build verification**: the complete chain produced a signed APK (54,368 B); `apksigner verify` and `aapt2 dump badging` passed; certificate SHA-256 8067d085…; assets and dex complete.

### 6.5 Limitations

The system explicitly has the following boundaries: (1) **Sparse reachability**—the full 19,683 space is not enumerated; only the interpretable subset reached by the combinatorial voting of 75 symptoms × 23 labels is explored; (2) **Manually annotated data**—the symptom→nine-dimension mappings, formula vectors, and attractor scoring functions were annotated according to the framework paradigm and have not yet been item-by-item audited against clinical data; (3) **No clinical validation**—the system does not replace physician diagnosis and prescription; any medication advice must be reviewed by a licensed TCM practitioner; the system also embeds a disclaimer in the UI; (4) **Deterministic trade-off**—the noise and continuous-time evolution dynamics of the framework are not implemented.

## 7 Discussion

**Framework instantiation scope**. The system instantiates the minimal complete subset of "state space + attractor + migration rules" that covers syndrome-differentiation inference; the framework's four opposing couplings, three-layer hierarchy, five-index linkage, and four hard-blockage types are all mapped one-to-one into code and documents (see the *Relationship with the San-Yuan-Jiu-Wei 19,683 Framework* document). Unimplemented parts—including continuous-time evolution and multi-objective switching optimization under noise perturbations in general cognitive dynamics—are honestly disclosed.

**Engineering trade-offs**. Discretization (three states plus preserved vote strength) is the minimal discretization required by engineering; determinism (noise set to zero) buys reproducibility and auditability; the full space is implicitly carried by the target state T, deviation Δ, and formula vectors, avoiding the storage and maintenance burden of enumerating 19,683 states.

**Safety and compliance**. The compatibility review covers the eighteen antagonisms, nineteen incompatibilities, mutual antagonism, pregnancy, and toxicity grades, and the P2/P3/P4 safety defects have all been eliminated after the fixes; the application has zero permissions and no networking, satisfying privacy minimization. It must nevertheless be re-emphasized: automated compatibility review cannot replace the final verification by licensed pharmacists and physicians, and the system must not be used for real prescriptions in unsupervised settings.

**Future work**: (1) data audit—item-by-item audit of the annotations of 75 symptoms/66 herbs/14 formulas against the coding-rule Excel mapping tables; (2) knowledge expansion—extending the syndrome–formula associations to a more complete TCM formulary; (3) clinical comparative evaluation—conducting retrospective/prospective controlled studies under the guidance of licensed practitioners to verify diagnostic agreement rates and treatment reliability with real cases; (4) multi-platform adaptation—packaging the same engine into an iOS shell and desktop versions; (5) framework feedback—consolidating the structured data and discrimination rules supplemented during instantiation back into the cognitive framework knowledge base.

## 8 Conclusion

This paper designs and verifies the San-Yuan Jiu-Wei Syndrome Differentiation System: with the 3⁹ = 19,683 state space as the unified coordinates and a deterministic rule engine as the core, it completes the full inference chain from symptom evidence to state estimation, quantitative diagnosis, attractor identification, migration paths, and formula recommendation, delivered as a zero-dependency offline APK. The system achieves fully explainable, reproducible, and auditable syndrome differentiation, and the risk fixes and regression verification (26/26 and 16/16) demonstrate engineering-level publishable quality. The system has not yet undergone clinical validation and is currently positioned as a research prototype and teaching tool instantiating the cognitive framework; the source code, documentation, and verification scripts are open-sourced together with this paper for peer audit and extension.

## References

[1] Zhang Zhongjing. Shang Han Lun (Treatise on Cold Damage) [M]. Eastern Han Dynasty (ca. 3rd century AD). (Original in Chinese.)

[2] Anonymous (attributed to the Yellow Emperor). Huangdi Neijing: Suwen [M]. Compiled from the Warring States to the Western Han Dynasty. (Original in Chinese.)

[3] Buditjahjanto I G P A. Decision Support System for Syndrome Differentiation in Traditional Chinese Medicine Based on Expert System[J]. International Journal of Soft Computing.

[4] World Health Organization. WHO Traditional Medicine Strategy 2014–2023[R]. Geneva: WHO, 2013.

[5] The State Council Information Office of the People's Republic of China. Traditional Chinese Medicine in China (White Paper)[R]. Beijing, 2016.

[6] Strogatz S H. Nonlinear Dynamics and Chaos: With Applications to Physics, Biology, Chemistry, and Engineering[M]. 2nd ed. Boulder: Westview Press, 2015.

[7] Google. Android Developers: WebView Documentation[EB/OL]. https://developer.android.com/reference/android/webkit/WebView.

[8] ECMA International. ECMAScript 2023 Language Specification (ECMA-262)[S]. 2023.

---

*Note: all data, algorithm conventions, and verification results in this paper come from the source code (data.js / engine.js / app.js), engineering documents (docs/), and test assets (review/), and can be reproduced in the open-source repository accompanying this paper.*