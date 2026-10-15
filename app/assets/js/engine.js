/* ============================================================
 * 三元九维中医辨证推演系统 · 推演引擎
 * 实现《编码规则》§10量化诊断、§9吸引子切换、§11状态迁移算法(11步)
 * ============================================================ */
"use strict";

const Engine = (() => {
  const W = [1.5, 1, 1.5, 1, 1, 1, 1.5, 1, 1]; // 承载维度 d1/d3/d7 加权 (§11.3)
  const T = [1,1,1,1,1,1,1,1,1];                 // 中和目标态
  const COUPLES = [[1,2],[3,4],[5,6],[7,8]];     // 时位/能信/群序/知行 (0-based)
  const COUPLE_NAMES = ["时位耦合(d2·d3)","能信耦合(d4·d5)","群序耦合(d6·d7)","知行耦合(d8·d9)"];
  const ATTRACTOR_ORDER = ["中和","枢转","潜藏","升举","显化","关系"]; // 同分优先级(切换顺序§9.1)

  /* ---- 步骤1：症状+标签 → 九维状态向量 S (§12.3 辨证即诊断) ---- */
  function aggregateState(selectedSymptoms, selectedTags, ctx) {
    const votes = [0,0,0,0,0,0,0,0,0];
    const traces = []; // 可解释性记录
    selectedSymptoms.forEach(s => {
      if (!s.v) return;
      Object.keys(s.v).forEach(k => {
        const d = +k; votes[d] += s.v[d];
        traces.push(`${s.n} → ${DATA.dimensions[d].key}${s.v[d]>0?"↑显":"↓潜"}(${Math.abs(s.v[d])})`);
      });
    });
    // 宏观辨证标签：典型状态向量锚定（八纲权重1，六经/体质权重2）
    selectedTags.forEach(t => {
      const w = t.w || 2;
      t.vec.forEach((val, d) => {
        if (val !== 1) { votes[d] += (val - 1) * w; traces.push(`${t.n}锚定 → ${DATA.dimensions[d].key}=${val}`); }
      });
    });
    // 久病/新病对d2的修正已含在情境条目中
    const S = votes.map(v => v >= 1.5 ? 2 : (v <= -1.5 ? 0 : 1));
    const strength = votes.map(v => Math.min(Math.abs(v), 4)); // 判定强度(展示用)
    return {S, votes, strength, traces};
  }

  /* ---- 步骤2：偏差与量化诊断指标 (§10) ---- */
  function diagnose(S) {
    const delta = S.map((v,i)=>v-T[i]);
    const E = delta.reduce((a,b)=>a+Math.abs(b),0);
    const coupleDiff = COUPLES.map(([a,b])=>Math.abs(S[a]-S[b]));
    const tension = coupleDiff.reduce((a,b)=>a+b,0);
    const ones = S.filter(v=>v===1).length;
    const fluidity = ones/9;
    // 显化势能：w(d7)秩序加权 —— d7=0→0.6, d7=1→1.0, d7=2→1.2 [补充实现]
    const w7 = [0.6, 1.0, 1.2][S[6]];
    const potential = ((S[0]+S[3]+S[7]+S[8])/4) * w7;
    const stability = (S[0]+S[6]+S[7])/3;
    const levels = { // 三层结构评估
      core: (S[0]+S[1]+S[2])/3, power: (S[3]+S[4]+S[5]+S[6])/4, express: (S[7]+S[8])/2
    };
    // 指标联动规则 (§10.2)
    const links = [];
    if (tension>=4 && fluidity<4/9) links.push("张力指数高+中介通畅度低：系统高度僵化，必须优先恢复中介通道（如开空间d3）");
    if (potential>1.5 && stability<1) links.push("显化势能高+本体稳固系数低：虚火状态，强显化将加速耗散");
    if (stability<1 && tension>=4) links.push("本体不稳+张力高：基础不牢且内耗严重，属最危险组合，先固本体");
    if (fluidity>=7/9 && tension<4) links.push("中介通畅+张力低：系统健康可调节，可选择方向性吸引子");
    // 阻滞判定 (§6.3)
    const blocks = [];
    if (S[5]>=2 && S[6]===0) blocks.push("d6关系已到2而d7秩序仍为0：关系网络缺乏结构，易纠缠混乱");
    if (S[4]===2 && S[3]===0) blocks.push("d5信息已到2而d4能量仍为0：认知清楚却无力执行，易空转焦虑");
    if (S[8]===2 && S[7]===0) blocks.push("d9行动已到2而d8价值仍为0：行为变成重复消耗，易倦怠放弃");
    if (S[0]===0 && S[8]===2) blocks.push("d1本体为0而d9行动为2：根基不稳却高强度输出，易突然崩溃");
    // 耦合警示
    const coupleWarn = coupleDiff.map((dv,i)=> dv>=2 ? `${COUPLE_NAMES[i]}差值${dv}：明显恢复力已启动，属主要矛盾之一` : null).filter(Boolean);
    return {delta, E, tension, coupleDiff, coupleWarn, fluidity, potential, stability, levels, links, blocks};
  }

  /* ---- 步骤3：吸引子判别 (§9.2 简化判定流程，模糊适配度打分[补充]) ----
   * 宏观辨证标签对吸引子的先验加成[补充]：依据Excel三张映射表
   * （六经→吸引子、体质→代表方→吸引子） */
  const ATTR_TAG_BOOST = {
    "太阳病":["显化",2], "阳明病":["显化",2], "少阳病":["枢转",3],
    "太阴病":["潜藏",3], "少阴病":["潜藏",3], "厥阴病":["枢转",2],
    "平和质":["中和",4], "气虚质":["升举",3], "阳虚质":["潜藏",3],
    "阴虚质":["潜藏",3], "痰湿质":["中和",2], "湿热质":["显化",3],
    "血瘀质":["枢转",3], "气郁质":["枢转",3], "特禀质":["中和",2],
    "表证":["显化",2], "里证":["中和",1], "寒证":["潜藏",2], "热证":["显化",2],
    "虚证":["潜藏",2], "实证":["显化",2], "阴证":["潜藏",2], "阳证":["显化",2]
  };
  function matchAttractor(S, dx, ctx) {
    const [d1,d2,d3,d4,d5,d6,d7,d8,d9]=S;
    const lowCount = [d3,d7,d8].filter(v=>v===0).length;
    const yinXu = d4===2 && d3===0;           // 阴虚阳浮特征
    const yangXu = d4===0 && d1===0;           // 阳虚寒盛特征
    const fit = {"中和":0,"潜藏":0,"升举":0,"枢转":0,"显化":0,"关系":0};
    fit["中和"] = (dx.tension>=4?3:0) + (dx.E>=5&&dx.fluidity<4/9?2:0) + (lowCount>=2&&dx.tension>=2?2:(lowCount>=2?1:0));
    fit["潜藏"] = ((d4===2||d9===2)&&(d1===0||d3===0)?3:0) + (yinXu?3:0) + (yangXu?2:0) + (d9===2&&d8<=1?1:0) + (d1===0&&d4===0&&d8===0?3:0);
    fit["升举"] = ([d1,d4,d7,d9].filter(v=>v===0).length>=3?4:0) + (d1===0&&d9===0?2:0) + (d8>=1&&d9===0?1:0);
    fit["枢转"] = (d6===0&&d7===0) ? (4+(d3===1?1:0)+(d2>=1?1:0))
                : (d6===0&&d3===1) ? 2
                : (d7===0&&d6<=1&&d3===1) ? 1 : (d6===0||d7===0 ? 0 : -2);
    const xianHuaGate = (d4===2) || (d3===0&&d2===2) || (d5===2&&d4>=1);
    fit["显化"] = xianHuaGate ? ((d1>=1&&d7>=1&&d8>=1?2:0) + (d3===0&&d2===2?2:0) + (d4===2&&d5===2?3:0) + (d4===2&&d7>=1?1:0)) : 0;
    fit["关系"] = (d6===0&&d1>=1&&d7>=1?3:0) + (d6===0&&d8>=1?1:0) + (d1===0?-2:0);
    // 宏观标签先验加成
    if (ctx){
      ctx.tags.concat(ctx.liujing||[], ctx.tizhi||[]).forEach(t=>{
        const b = ATTR_TAG_BOOST[t];
        if (b) fit[b[0]] += b[1];
      });
    }
    let best=null, bestScore=-99;
    ATTRACTOR_ORDER.forEach(name=>{ // 依优先级顺序遍历，严格大于才替换→同分取高优先
      if (fit[name]>bestScore){bestScore=fit[name];best=name;}
    });
    if (bestScore<=0){best="中和";bestScore=0;} // 兜底：系统乱/无明显方向，先回中和
    const info = DATA.attractors.find(a=>a.name===best);
    return {name:best, score:bestScore, fit, info};
  }

  /* ---- 步骤4-8：方剂检索、评分、禁忌惩罚、Top-K (§11.2/11.3) ---- */
  function patternFlags(S, ctx) {
    const [d1,d2,d3,d4,d5,d6,d7,d8,d9]=S;
    return {
      yinXu: d4===2 && d3===0,               // 阴虚阳浮
      yangXuHan: d4===0 && (d1===0||d3===0),  // 阳虚寒盛/脾胃虚寒
      shiRe: d4===2 && d5===2,                // 实热壅盛
      shiZheng: S.filter(v=>v===2).length>=4, // 邪气盛实
      biaoZheng: ctx.tags.includes("表证") || ctx.liujing.includes("太阳病"),
      /* v1.1：症状级标签透传（P2/P5）——"表虚/表实/瘀/寒/热"等出现在症状 tag 或宏观标签中均生效 */
      biaoxu: ctx.tags.includes("表虚") || (ctx.symTags||[]).includes("表虚"),
      bleeding: ctx.bleeding
    };
  }

  /* 方剂证候关键词表[补充]：用于宏观标签与方剂适用辨证的互证加分 */
  const FORMULA_KEYWORDS = {
    "桂枝汤":["表虚","太阳","营卫","表证"],
    "六味地黄丸":["阴虚","肾阴","虚火","热证"],
    "麻黄汤":["表实","表证","太阳","风寒","寒证","实证"],
    "小柴胡汤":["少阳","半表半里","气郁"],
    "补中益气汤":["气虚","虚证","太阴","里证"],
    "四逆汤":["寒证","阴证","阳虚","少阴","虚证"],
    "理中丸":["寒证","太阴","虚证","里证","阴证"],
    "逍遥散":["气郁","肝郁","血瘀","里证"],
    "血府逐瘀汤":["血瘀","瘀","气郁"],
    "补阳还五汤":["血瘀","瘀","气虚","中风"],
    "龙胆泻肝汤":["湿热","热证","实证","阳证"],
    "茵陈蒿汤":["湿热","黄疸","热证","实证"],
    "白虎汤":["热证","实热","阳证","阳明","实证"],
    "大承气汤":["实证","实热","阳明","里证","热证"]
  };

  function scoreFormulas(S, dx, attractor, ctx) {
    const pf = patternFlags(S, ctx);
    const results = [];
    DATA.formulas.forEach(f => {
      let score = 0, hard = [], warns = [];
      // (1) 向量距离：方剂九维向量=其主治证型的典型状态，越接近得分越高
      let dist = 0;
      for (let i=0;i<9;i++) dist += W[i]*Math.abs(S[i]-f.vec[i]);
      score -= dist;
      // (2) 吸引子契合
      if (f.attractor === attractor.name) score += 4;
      // (3) 宏观标签契合（关键词互证，封顶+4）
      let tagBonus = 0;
      ctx.tags.concat(ctx.liujing, ctx.tizhi).forEach(t=>{
        (FORMULA_KEYWORDS[f.name]||[]).forEach(k=>{
          if (t.includes(k) && tagBonus<4){ tagBonus+=2; }
        });
      });
      score += tagBonus;
      // (3b) 证候指征不足降权[补充]：主证未显则不宜投方（源自各方"禁忌条件"）
      if (f.name==="麻黄汤" && !(S[1]===2||S[2]===0||pf.biaoZheng)) warns.push({t:"表寒证指征不足（无表闭/脉浮紧象）", p:4});
      if (f.name==="桂枝汤" && S[5]!==2 && S[6]!==0) warns.push({t:"营卫不和指征不足", p:3});
      if (f.name==="六味地黄丸" && !(S[3]===2||pf.yinXu)) warns.push({t:"肾阴虚指征不足", p:3});
      if (f.name==="白虎汤" && S[3]!==2) warns.push({t:"气分大热未显（d4≠2），不宜辛寒重剂", p:4});
      if (f.name==="大承气汤" && !(S[6]===2&&S[8]===2&&S[3]===2)) warns.push({t:"痞满燥实坚未俱备，峻下须慎", p:5});
      if (f.name==="四逆汤" && !(S[3]===0&&S[8]===0)) warns.push({t:"阳衰厥逆指征不足", p:4});
      if (f.name==="龙胆泻肝汤" && !(S[3]===2||S[4]===2)) warns.push({t:"肝胆实火/湿热指征不足", p:4});
      if (f.name==="茵陈蒿汤" && !(S[3]===2&&S[4]>=1)) warns.push({t:"湿热黄疸指征不足", p:4});
      if (f.name==="补中益气汤" && !(S[0]===0&&S[8]===0)) warns.push({t:"中气下陷指征不足", p:3});
      if (f.name==="血府逐瘀汤" && !(S[5]===0||S[6]===0||ctx.tags.includes("血瘀质"))) warns.push({t:"血瘀指征不足", p:3});
      if (f.name==="补阳还五汤" && !((ctx.symTags||[]).includes("瘀")||ctx.tizhi.includes("血瘀质"))) warns.push({t:"血瘀指征不足（无瘀血症状/体征支持）", p:3});
      if (f.name==="理中丸" && !(S[3]===0&&S[0]<=1)) warns.push({t:"中焦虚寒指征不足", p:3});
      // (4) 禁忌审查：硬拦截 + 惩罚P (§11.4 配伍约束)
      const stab = dx.stability;
      if (ctx.pregnant) {
        if (f.flags.preg==="forbid") hard.push("妊娠禁用（破血/峻下，d9剧烈行动+d3空间动荡）");
        else if (f.flags.preg==="caution") warns.push({t:"妊娠慎用（含活血/攻下药）", p:5});
      }
      if (stab<=0.5 && (f.flags.strongAttack||f.flags.strongSweat||f.flags.strongManifest))
        hard.push("本体稳固系数≤0.5（极脆弱），禁强攻/强发汗/强显化");
      if (S[0]===0 && f.flags.strongManifest) hard.push("d1=0：本体闸门关闭，禁用强显化方");
      if (f.name==="桂枝汤" && S[8]===0 && S[2]===0) warns.push({t:"d9=0且d3=0：表闭无汗不宜桂枝汤", p:5});
      if (f.name==="麻黄汤") {
        if (pf.biaoxu) hard.push("表虚自汗忌用");
        if (pf.yinXu) warns.push({t:"阴虚阳亢慎用", p:4});
        if (pf.bleeding) hard.push("衄血/出血倾向者忌用");
      }
      if (f.name==="六味地黄丸") {
        if (pf.yangXuHan) hard.push("阳虚寒盛忌用");
        if (S[4]===2&&S[6]<=0) warns.push({t:"脾虚湿盛慎用", p:3});
        if (pf.biaoZheng) warns.push({t:"表证未解不宜", p:4});
      }
      if (f.name==="小柴胡汤") {
        if ((pf.biaoZheng && S[2]!==1) || S.filter(v=>v===2).length>=5) warns.push({t:"纯表证/纯里证或实热壅盛不宜", p:4});
      }
      if (f.name==="补中益气汤") {
        if (pf.shiZheng) hard.push("实证忌用");
        if (pf.yinXu) warns.push({t:"阴虚阳亢忌用", p:4});
        if (S[2]===2&&S[6]===2) warns.push({t:"气滞胀满慎用", p:3});
        if (pf.biaoZheng&&S[3]>=1) warns.push({t:"外感发热忌用", p:4});
      }
      if (f.name==="四逆汤") {
        if (pf.yinXu) hard.push("阴虚阳亢忌用");
        if (pf.shiRe) hard.push("真热假寒忌用");
      }
      if (f.name==="理中丸" && pf.shiRe) hard.push("实热积滞忌用");
      if (f.name==="逍遥散" && pf.shiRe) warns.push({t:"湿热内蕴忌；阴虚火旺慎用", p:4});
      if (f.name==="血府逐瘀汤" && pf.bleeding) warns.push({t:"出血倾向慎用", p:5});
      if (f.name==="补阳还五汤") {
        if (pf.yinXu) warns.push({t:"阴虚阳亢忌", p:5});
        if (pf.bleeding) warns.push({t:"出血急性期慎用", p:5});
      }
      if (f.name==="龙胆泻肝汤") {
        if (pf.yangXuHan) hard.push("脾胃虚寒忌");
        if (pf.yinXu) warns.push({t:"阴虚津伤忌", p:4});
      }
      if (f.name==="茵陈蒿汤" && S[3]===0&&S[4]<=0) hard.push("寒湿黄疸（阴黄）忌用");
      if (f.name==="白虎汤") {
        if (S[3]===0) hard.push("阳明虚寒忌用");
        if (pf.biaoZheng && S[2]>=1) warns.push({t:"表证未解忌单用", p:4});
      }
      if (f.name==="大承气汤") {
        if (pf.biaoZheng && S[2]>=1) hard.push("表证未解忌下");
        if (stab<1) warns.push({t:"体虚慎用（本体稳固系数<1）", p:5});
      }
      // 全局：d9不能从0直接跳2（配伍约束）——强动d9的方在d9=0时降权
      if (S[8]===0 && f.vec[8]===2) warns.push({t:"d9=0不可直跳2，需经中介过渡，牵引须分步", p:2});
      const P = warns.reduce((a,w)=>a+w.p,0);
      score -= P;
      results.push({f, score:Math.round(score*10)/10, dist:Math.round(dist*10)/10, P, hard, warns,
        attrBonus: f.attractor===attractor.name});
    });
    const passed = results.filter(r=>r.hard.length===0).sort((a,b)=>b.score-a.score);
    const blocked = results.filter(r=>r.hard.length>0);
    return {passed, blocked};
  }

  /* ---- 步骤5：牵引路径生成 (§11.2 层级递进：先d1/d7/d3→d6/d5→d4→d8/d2/d9) ---- */
  const PATH_ORDER = [0,6,2,5,4,3,7,1,8];
  function buildPath(S) {
    const steps = [], cur = S.slice();
    PATH_ORDER.forEach(d => {
      while (cur[d] !== 1) {
        const dir = cur[d] > 1 ? -1 : +1;
        const from = cur[d];
        cur[d] += dir;
        const to = cur[d];
        const dim = DATA.dimensions[d];
        const bridgeWhy = from===0
          ? `${dim.name}处于潜态(0)，先升入中介通道1，不可直跳显态2`
          : `${dim.name}处于显态(2)，先收敛回中介通道1，不可直落潜态0`;
        steps.push({
          dim: d, key: dim.key, name: dim.name,
          from: from, to: to,
          text: `${dim.key}${dim.name}：${from}(${dim.states[from].split("/")[0]}) → ${to}(${dim.states[to].split("/")[0]})`,
          why: `${dir>0?`升发${dim.name}`:`收敛${dim.name}`}，${bridgeWhy}`
        });
      }
    });
    return steps;
  }

  /* ---- 步骤9：药味加减建议（剩余偏差→药性向量映射§15） ---- */
  function buildAdvice(S, topFormula) {
    const advice = [];
    S.forEach((v,d)=>{
      if (v===1) return;
      const a = v===0 ? DATA.dimAdvice[d].low : DATA.dimAdvice[d].high;
      advice.push({dim:d, key:DATA.dimensions[d].key, name:DATA.dimensions[d].name,
        state:v, dir:v===0?"偏低(0态)":"偏高(2态)", herbs:a.herbs, act:a.act});
    });
    return advice;
  }

  /* ---- 步骤10：配伍禁忌审查（十八反/十九畏/妊娠/毒性） ---- */
  function checkCompat(herbList, ctx) {
    const issues = [], set = new Set(herbList);
    const has = n => set.has(n) || herbList.some(h=>h.includes(n)||n.includes(h));
    DATA.contra.shibaFan.forEach(r=>{
      if (has(r.a)) r.b.forEach(b=>{ if(has(b)) issues.push({lv:"反", t:`${r.a} 反 ${b}`, why:r.why, risk:r.risk}); });
    });
    DATA.contra.shijiuWei.forEach(([a,b])=>{
      if (has(a)&&has(b)) issues.push({lv:"畏", t:`${a} 畏 ${b}`, why:"药性剧烈互相制约，可能产生毒性或失效"});
    });
    DATA.contra.xiangE.forEach(([a,b])=>{
      if (has(a)&&has(b)) issues.push({lv:"恶", t:`${a} 恶 ${b}`, why:"相恶：一药减另一药疗效"});
    });
    if (ctx.pregnant) {
      DATA.contra.pregForbid.forEach(h=>{ if(has(h)) issues.push({lv:"妊娠禁用", t:`妊娠禁用 ${h}`, why:"强攻逐水破血，d9剧烈行动+d3空间动荡，可致堕胎"}); });
      DATA.contra.pregCaution.forEach(h=>{ if(has(h)) issues.push({lv:"妊娠慎用", t:`妊娠慎用 ${h}`, why:"活血/攻下/温里之品，影响d1/d3稳定，必要时慎用、中病即止"}); });
    }
    /* 毒性/峻烈提示（仅对实际入方的药给出，避免噪音）[补充] */
    const TOX_NOTES = {
      "附子":"大毒，须炮制先煎久煎，中病即止，不可久服（大毒治病十去其六）",
      "半夏":"生品有毒，须用制半夏；反乌头类（有毒治病十去其七）",
      "杏仁":"苦杏仁小毒，用量宜轻（小毒治病十去其八）",
      "细辛":"小毒，用量宜轻，不过钱（≤3g）",
      "大黄":"攻下伤胃气，中病即止，体虚者减量",
      "芒硝":"咸寒峻下，脾胃虚寒及妊娠忌",
      "麻黄":"发汗峻烈，过汗伤阳，表虚者忌",
      "龙胆草":"大苦大寒，易伤胃气，不宜久服"
    };
    herbList.forEach(h=>{
      if (TOX_NOTES[h]) issues.push({lv:"毒性提示", t:`${h}：${TOX_NOTES[h]}`, why:"注意炮制、用量与疗程"});
    });
    return issues;
  }

  /* ---- 步骤11：下一步状态 S1（施加首步牵引，检验平滑性） ---- */
  function nextState(S, steps, n=3) {
    const S1 = S.slice();
    steps.slice(0, n).forEach(st=>{ S1[st.dim] = st.to; });
    return S1;
  }

  /* ---- 主流程 ---- */
  function run(selectedSymptoms, selectedTags, ctx) {
    const agg = aggregateState(selectedSymptoms, selectedTags, ctx);
    const dx = diagnose(agg.S);
    const attractor = matchAttractor(agg.S, dx, ctx);
    const {passed, blocked} = scoreFormulas(agg.S, dx, attractor, ctx);
    const top = passed.slice(0, Math.min(3, passed.length)).map(r=>{
      const herbs = [].concat(r.f.jun, r.f.chen, r.f.zuo, r.f.shi);
      /* v1.1 P3：建议加味后的全方复查——原方 + 各维度加减建议含药（过滤"类/思路"占位符） */
      const advHerbs = buildAdvice(agg.S, r.f).flatMap(a=>a.herbs.filter(h=>!h.includes("类")&&!h.includes("思路")));
      const fullHerbs = herbs.concat(advHerbs.filter(h=>!herbs.includes(h)));
      return {...r, steps: buildPath(agg.S), compat: checkCompat(herbs, ctx),
        compatFull: checkCompat(fullHerbs, ctx),
        S1: nextState(agg.S, buildPath(agg.S)), advice: buildAdvice(agg.S, r.f)};
    });
    return {agg, dx, attractor, top, passed, blocked, ctx};
  }

  return {run, diagnose, aggregateState, buildPath, checkCompat, T, COUPLES, COUPLE_NAMES};
})();
