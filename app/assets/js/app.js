/* ============ 三元九维辨证推演 · 界面逻辑 ============ */
"use strict";

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const DISCLAIMER = "本工具仅供中医理论推演与学习参考，不构成医疗诊断或用药建议。实际诊疗请遵执业医师面诊意见。";

const UI = {
  selectedSymptoms: [],   // {n, v, special?}
  curGroup: 0,
  tags: {bagang:[], liujing:[], tizhi:null},
  result: null
};

/* ---------- 免责声明 ---------- */
function initDisclaimer(){
  const seen = localStorage.getItem("tcm9d_disclaimer");
  if (!seen) $("#disclaimerModal").classList.remove("hide");
  $("#btnAgree").onclick = ()=>{ localStorage.setItem("tcm9d_disclaimer","1"); $("#disclaimerModal").classList.add("hide"); };
  $("#reportDisclaimer").textContent = "⚠ " + DISCLAIMER;
}

/* ---------- 底部导航 ---------- */
function initTabs(){
  $$(".tab").forEach(t=>{
    t.onclick = ()=>{
      $$(".tab").forEach(x=>x.classList.remove("on"));
      t.classList.add("on");
      $$(".page").forEach(p=>p.classList.remove("active"));
      $("#page-"+t.dataset.page).classList.add("active");
      if (t.dataset.page==="jilu") renderRecords();
      if (t.dataset.page==="fangji") renderFormulaLib();
      if (t.dataset.page==="zhishi") renderKB();
      $("#pages").scrollTop = 0;
    };
  });
}

/* ---------- 向导步骤 ---------- */
function gotoStep(n){
  [1,2,3].forEach(i=>$("#wiz"+i).classList.toggle("hide", i!==n));
  $$(".step-dot").forEach(d=>{
    const s = +d.dataset.s;
    d.classList.toggle("on", s===n);
    d.classList.toggle("done", s<n);
  });
  $("#pages").scrollTop = 0;
}

/* ---------- 第一步：症状 ---------- */
function renderSymGroups(){
  const tabs = $("#symGroupTabs"), chips = $("#symChips");
  tabs.innerHTML = DATA.symptomGroups.map((g,i)=>
    `<div class="gtab ${i===UI.curGroup?"on":""}" data-i="${i}">${g.group}</div>`).join("");
  tabs.querySelectorAll(".gtab").forEach(el=>{
    el.onclick = ()=>{ UI.curGroup = +el.dataset.i; renderSymGroups(); };
  });
  const g = DATA.symptomGroups[UI.curGroup];
  chips.innerHTML = g.items.map(it=>{
    const on = UI.selectedSymptoms.some(s=>s.n===it.n);
    const warn = it.special ? "warn" : "";
    return `<div class="chip ${on?"on":""} ${warn}" data-n="${it.n}">${it.n}</div>`;
  }).join("");
  chips.querySelectorAll(".chip").forEach(el=>{
    el.onclick = ()=>{
      const n = el.dataset.n;
      const idx = UI.selectedSymptoms.findIndex(s=>s.n===n);
      const item = g.items.find(i=>i.n===n);
      if (idx>=0) UI.selectedSymptoms.splice(idx,1); else UI.selectedSymptoms.push(item);
      renderSymGroups();
    };
  });
  $("#selCount").textContent = `已选 ${UI.selectedSymptoms.length} 项`;
}

/* ---------- 第二步：宏观标签 ---------- */
function renderTagChips(){
  const mk = (arr, sel, cb, single) => arr.map(t=>{
    const on = single ? sel===t.n : sel.includes(t.n);
    return `<div class="chip ${on?"on":""}" data-n="${t.n}">${t.n}</div>`;
  }).join("");
  $("#bagangChips").innerHTML = mk(DATA.bagang, UI.tags.bagang);
  $("#liujingChips").innerHTML = mk(DATA.liujing, UI.tags.liujing);
  $("#tizhiChips").innerHTML  = mk(DATA.tizhi, UI.tags.tizhi, null, true);
  const bind = (id, key, single, src)=>{
    $$(id+" .chip").forEach(el=>{
      el.onclick = ()=>{
        const n = el.dataset.n;
        if (single){ UI.tags[key] = UI.tags[key]===n ? null : n; }
        else{
          const a = UI.tags[key], i = a.indexOf(n);
          i>=0 ? a.splice(i,1) : a.push(n);
        }
        renderTagChips();
      };
    });
  };
  bind("#bagangChips","bagang",false); bind("#liujingChips","liujing",false); bind("#tizhiChips","tizhi",true);
}

function collectTagObjects(){
  const objs = [];
  DATA.bagang.filter(t=>UI.tags.bagang.includes(t.n)).forEach(t=>objs.push({n:t.n, vec:t.vec, w:1}));
  DATA.liujing.filter(t=>UI.tags.liujing.includes(t.n)).forEach(t=>objs.push({n:t.n, vec:t.vec, w:2}));
  if (UI.tags.tizhi){ const t = DATA.tizhi.find(x=>x.n===UI.tags.tizhi); if(t) objs.push({n:t.n, vec:t.vec, w:2}); }
  return objs;
}

/* ---------- 雷达图 ---------- */
function drawRadar(canvas, S, S1){
  const dpr = window.devicePixelRatio||1;
  const size = Math.min(320, window.innerWidth-80);
  canvas.width = size*dpr; canvas.height = size*dpr;
  canvas.style.width = size+"px"; canvas.style.height = size+"px";
  const c = canvas.getContext("2d"); c.scale(dpr,dpr);
  const cx=size/2, cy=size/2, R=size/2-38, N=9;
  const pt = (i,r)=>{ const a = -Math.PI/2 + i*2*Math.PI/N; return [cx+r*Math.cos(a), cy+r*Math.sin(a)]; };
  c.clearRect(0,0,size,size);
  // 网格：0/1/2 三环
  [0.33,0.66,1].forEach((rr,gi)=>{
    c.beginPath();
    for(let i=0;i<=N;i++){const [x,y]=pt(i%N,R*rr); i?c.lineTo(x,y):c.moveTo(x,y);}
    c.closePath(); c.strokeStyle = gi===1?"#c9bfa6":"#e2dac6"; c.lineWidth=1; c.stroke();
  });
  // 轴线与标签
  const COLORS=["#5b7f95","#1d5c4a","#a63d2f"];
  for(let i=0;i<N;i++){
    const [x,y]=pt(i,R); c.beginPath(); c.moveTo(cx,cy); c.lineTo(x,y); c.strokeStyle="#e2dac6"; c.stroke();
    const [lx,ly]=pt(i,R+20);
    c.fillStyle="#6b6252"; c.font="11px sans-serif"; c.textAlign="center"; c.textBaseline="middle";
    c.fillText(DATA.dimensions[i].key+DATA.dimensions[i].name[0], lx, ly);
  }
  // 当前状态多边形（值0→0.33R? 用 (v+0.5)/2.5 保证0也可见）
  const rad = v => R*(v+0.5)/2.5;
  const poly=(arr,fill,stroke)=>{
    c.beginPath();
    for(let i=0;i<=N;i++){const [x,y]=pt(i%N,rad(arr[i])); i?c.lineTo(x,y):c.moveTo(x,y);}
    c.closePath(); c.fillStyle=fill; c.fill(); c.strokeStyle=stroke; c.lineWidth=2; c.stroke();
  };
  if (S1) poly(S1,"rgba(176,141,62,.10)","#b08d3e");
  poly(S,"rgba(29,92,74,.18)","#1d5c4a");
  // 顶点
  for(let i=0;i<N;i++){
    const [x,y]=pt(i,rad(S[i]));
    c.beginPath(); c.arc(x,y,4,0,7); c.fillStyle=COLORS[S[i]]; c.fill();
    c.strokeStyle="#fff"; c.lineWidth=1.5; c.stroke();
  }
  // 图例
  c.font="10px sans-serif"; c.textAlign="left";
  [["#5b7f95","0 潜"],[ "#1d5c4a","1 和"],["#a63d2f","2 显"]].forEach(([col,txt],i)=>{
    c.fillStyle=col; c.fillRect(8+i*64,size-14,10,10);
    c.fillStyle="#6b6252"; c.fillText(txt,22+i*64,size-5);
  });
  if (S1){ c.fillStyle="#b08d3e"; c.fillRect(8+3*64,size-14,10,10); c.fillStyle="#6b6252"; c.fillText("S₁ 预期",22+3*64,size-5); }
}

/* ---------- 第三步：结果渲染 ---------- */
function fmtPct(x){return Math.round(x*100)+"%";}
function renderResult(){
  const R = UI.result; if(!R) return;
  const {agg, dx, attractor, top, blocked} = R;
  const S = agg.S;
  const stabCls = dx.stability>=1?"":(dx.stability<=0.5?"bad":"warnv");
  const tenCls = dx.tension>=6?"bad":(dx.tension>=4?"warnv":"");
  const fluCls = dx.fluidity>=7/9?"":(dx.fluidity<4/9?"bad":"warnv");
  const potCls = (dx.potential>1.5&&S[6]<1)?"bad":"";

  let html = "";
  // 状态卡
  html += `<div class="card">
    <div class="card-h">当前九维状态 S <span class="hint">症状${UI.selectedSymptoms.length}项 + 辨证标签聚合而成</span></div>
    <div class="radar-box"><canvas id="radarCanvas"></canvas>
    <div class="vec-line">S = (${S.join(",")})　偏差能量 E = ${dx.E}</div></div>
    <div class="dim-rows" style="margin-top:10px">` +
    S.map((v,i)=>{
      const d = DATA.dimensions[i];
      return `<div class="dim-row"><div class="d-name">${d.key} ${d.name}</div>
      <div class="dim-track">${[0,1,2].map(x=>`<div class="dim-cell ${x===v?("on"+x):""}">${x}</div>`).join("")}</div>
      <div class="d-state">${d.states[v].split("/")[0]}</div></div>`;
    }).join("") + `</div></div>`;

  // 诊断指标
  html += `<div class="card"><div class="card-h">量化诊断指标</div>
    <div class="metric-grid">
      <div class="metric"><div class="m-n">张力指数</div><div class="m-v ${tenCls}">${dx.tension}</div><div class="m-t">${dx.tension>=6?"高风险":dx.tension>=4?"警惕":"正常"}（≥6高/≥4警惕）</div></div>
      <div class="metric"><div class="m-n">显化势能</div><div class="m-v ${potCls}">${dx.potential.toFixed(2)}</div><div class="m-t">${(dx.potential>1.5&&S[6]<1)?"虚火⚠":"可输出"}（>1.5且d7<1为虚火）</div></div>
      <div class="metric"><div class="m-n">中介通畅度</div><div class="m-v ${fluCls}">${fmtPct(dx.fluidity)}</div><div class="m-t">${dx.fluidity>=7/9?"弹性好":dx.fluidity>=4/9?"一般":"僵化/极端"}（值1维度占比）</div></div>
      <div class="metric"><div class="m-n">本体稳固系数</div><div class="m-v ${stabCls}">${dx.stability.toFixed(2)}</div><div class="m-t">${dx.stability>=1?"稳固":dx.stability>0.5?"脆弱":"极脆弱⚠"}（(d1+d7+d8)/3）</div></div>
    </div>`;
  dx.coupleWarn.forEach(w=>html+=`<div class="alert warn">⚡ ${w}</div>`);
  dx.blocks.forEach(b=>html+=`<div class="alert danger">⛔ 阻滞：${b}</div>`);
  dx.links.forEach(l=>html+=`<div class="alert info">◈ ${l}</div>`);
  html += `</div>`;

  // 吸引子
  html += `<div class="card"><div class="card-h">主吸引子判别</div>
    <div class="attr-box"><div class="attr-name">${attractor.name}吸引子</div>
    <div class="attr-sub">${attractor.info.scene}</div></div>
    <div class="alert info" style="margin-top:10px">判别条件：${attractor.info.cond}<br>切换前提：${attractor.info.switchPre}</div>
    <div class="alert warn">风险提示：${attractor.info.risk}</div>
    <div style="margin-top:8px;font-size:12px;color:var(--mut)">六吸引子适配度：` +
    Object.entries(attractor.fit).map(([k,v])=>`${k} ${v>0?"+":""}${v}`).join("　") + `</div></div>`;

  // 方剂推荐（v1.1 P6：中和态专卡，不渲染处方级 Top）
  if (dx.E===0){
    html += `<div class="card"><div class="card-h">方剂推演结论</div>
      <div class="alert info">◈ 当前状态即中和态（偏差能量 E=0）：「阴平阳秘，精神乃治」——无需药物干预，养生维持即可，本工具不生成处方级推荐。如有不适请遵执业医师面诊。</div>`;
    if (blocked.length){
      html += `<div class="fold-h" data-fold="blockedFold"><span style="font-size:13px;color:var(--mut)">被禁忌硬拦截的方剂（${blocked.length}首，点击查看原因）</span><span class="arr">▶</span></div>
      <div class="fold-b" id="blockedFold">` +
      blocked.sort((a,b)=>b.score-a.score).map(r=>`<div class="alert danger" style="margin-bottom:6px"><b>${r.f.name}</b>（score ${r.score}）：${r.hard.join("；")}</div>`).join("") + `</div>`;
    }
    html += `</div>`;
  } else {
  html += `<div class="card"><div class="card-h">方剂推演 Top ${top.length} <span class="hint">score = −Σwᵢ|Sᵢ−vᵢ| + 吸引子契合 − 禁忌惩罚P</span></div>`;
  if (!top.length){
    html += `<div class="alert danger">当前状态下所有方剂均触发硬性禁忌拦截，无法给出推荐。请调整症状采集或咨询执业医师。</div>`;
  }
  top.forEach((r,ri)=>{
    const f = r.f;
    /* v1.1 P3：全方复查 = 建议加味后相对于原方审查的"新增"提示 */
    const compatFullExtra = (r.compatFull||[]).filter(c=>!r.compat.some(cc=>cc.t===c.t));
    html += `<div class="f-card">
      <div class="f-head" data-fold="f${ri}">
        <div><span class="f-rank">NO.${ri+1}</span><span class="f-name">${f.name}</span>
        <span class="tag-pill">${f.attractor}吸引子</span>${r.attrBonus?'<span class="tag-pill" style="background:var(--gold-l);color:var(--gold)">✦主吸引子契合</span>':""}</div>
        <div class="f-score">匹配 <b>${r.score}</b>　P=${r.P}</div>
      </div>
      <div class="f-body" id="f${ri}">
        <div class="f-sec"><div class="f-sec-t">▍九维牵引向量</div>
          <div class="vec-line">v = (${f.vec.join(",")})　距离 Σw|S−v| = ${r.dist}</div>
          <div style="font-size:12.5px;color:var(--mut);margin-top:4px">适用辨证：${f.apply}</div></div>
        <div class="f-sec"><div class="f-sec-t">▍君臣佐使配伍</div>
          <div class="jczs">
            ${f.jun.length?`<span class="role">君</span><span>${f.jun.join("、")}</span>`:""}
            ${f.chen.length?`<span class="role">臣</span><span>${f.chen.join("、")}</span>`:""}
            ${f.zuo.length?`<span class="role">佐</span><span>${f.zuo.join("、")}</span>`:""}
            ${f.shi.length?`<span class="role">使</span><span>${f.shi.join("、")}</span>`:""}
          </div>
          <div style="font-size:12.5px;color:var(--mut);margin-top:5px">${f.note}</div></div>
        <div class="f-sec"><div class="f-sec-t">▍方剂牵引路径（原文）</div>
          <div style="font-size:13px">${f.path}</div></div>
        <div class="f-sec"><div class="f-sec-t">▍逐步迁移路径（引擎生成，每步单维±1必经中介）</div>` +
          r.steps.slice(0,8).map((st,i)=>`<div class="path-step"><div class="path-idx">${i+1}</div><div><b>${st.text}</b><div style="font-size:11.5px;color:var(--mut)">${st.why}</div></div></div>`).join("") +
          (r.steps.length>8?`<div style="font-size:12px;color:var(--mut)">…余 ${r.steps.length-8} 步从略</div>`:"") +
          (r.steps.length===0?`<div class="compat-ok">当前已处中和态 (1,1,1,1,1,1,1,1,1)，无需迁移，维持即可</div>`:"") +
        `</div>
        <div class="f-sec"><div class="f-sec-t">▍预期下一状态 S₁（施加前3步牵引）</div>
          <div class="vec-line">S₁ = (${r.S1.join(",")})</div></div>
        <div class="f-sec"><div class="f-sec-t">▍药味加减思路（据剩余偏差 × 药性向量映射）</div>` +
          (r.advice.length ? r.advice.map(a=>`<div class="advice-item"><b>${a.key}${a.name} ${a.dir}</b> → ${a.act}<br><span style="color:var(--mut)">示例药：${a.herbs.join("、")}</span></div>`).join("") : `<div class="compat-ok">九维无剩余偏差，无需加减</div>`) +
          `<div style="font-size:11px;color:var(--mut);margin-top:4px">※ 加减思路为算法示例，具体用药须由执业医师裁定</div></div>
        <div class="f-sec"><div class="f-sec-t">▍配伍禁忌审查 · 原方</div>` +
          (r.compat.length ? r.compat.map(c=>`<div class="alert ${c.lv.includes("禁")||c.lv==="反"?"danger":"warn"}">【${c.lv}】${c.t}<div style="font-size:11.5px">${c.why||""}</div></div>`).join("") : `<div class="compat-ok">✔ 原方十八反/十九畏/相恶/妊娠/毒性审查通过</div>`) +
        `</div>
        <div class="f-sec" style="margin-bottom:0"><div class="f-sec-t">▍全方复查（原方＋建议加味）</div>` +
          (compatFullExtra.length ? compatFullExtra.map(c=>`<div class="alert ${c.lv.includes("禁")||c.lv==="反"?"danger":"warn"}">【${c.lv}】${c.t}<div style="font-size:11.5px">${c.why||""}</div></div>`).join("") : `<div class="compat-ok">✔ 含建议加味后的全方复查通过（无新增禁忌）</div>`) +
          `<div style="font-size:11px;color:var(--mut);margin-top:4px">※ 加味药品按九维剩余偏差生成，具体配伍与用量须由执业医师裁定</div>` +
        `</div>
        <div class="f-sec" style="margin-bottom:0"><div class="f-sec-t">▍原表禁忌条件</div>
          <div style="font-size:12.5px;color:var(--mut)">${f.contra}</div></div>
      </div></div>`;
  });
  // 被拦截方剂
  if (blocked.length){
    html += `<div class="fold-h" data-fold="blockedFold"><span style="font-size:13px;color:var(--mut)">被禁忌硬拦截的方剂（${blocked.length}首，点击查看原因）</span><span class="arr">▶</span></div>
    <div class="fold-b" id="blockedFold">` +
    blocked.sort((a,b)=>b.score-a.score).map(r=>`<div class="alert danger" style="margin-bottom:6px"><b>${r.f.name}</b>（score ${r.score}）：${r.hard.join("；")}</div>`).join("") + `</div>`;
  }
  html += `</div>`;
  }

  // 状态迁移总览
  html += `<div class="card"><div class="card-h">状态迁移总览</div>
    <div style="font-size:13px">当前 S = <span class="fv">(${S.join(",")})</span> → 目标中和态 T = <span class="fv">(1,1,1,1,1,1,1,1,1)</span><br>
    战略方向：<b style="color:var(--gold)">${attractor.name}吸引子</b>；迁移遵循「先修复承载维度 d1/d7/d3 → 再调关系 d6/d5 → 再调能量 d4 → 最后收敛行动 d9」的层级递进原则，任何维度变化必经中介通道 1。<br>
    <span style="color:var(--mut)">场景：${attractor.info.scene}；判别条件：${attractor.info.cond}；切换前提：${attractor.info.switchPre}；风险：${attractor.info.risk}</span><br>
    六吸引子适配度：${Object.entries(attractor.fit).map(([k,v])=>`${k} ${v>0?"+":""}${v}`).join("　")}</div>
    <div class="radar-box" style="margin-top:6px"><canvas id="radarCanvas2"></canvas></div></div>`;

  $("#resultArea").innerHTML = html;
  drawRadar($("#radarCanvas"), S, top[0]?top[0].S1:null);
  const c2 = $("#radarCanvas2"); if(c2) drawRadar(c2, S, top[0]?top[0].S1:null);
  // 折叠交互
  $$("[data-fold]").forEach(h=>{
    h.onclick = ()=>{
      const b = document.getElementById(h.dataset.fold);
      if(b){ b.classList.toggle("open"); h.classList.toggle("open"); }
    };
  });
  gotoStep(3);
}

/* ---------- 推演 ---------- */
function runInference(){
  if (!UI.selectedSymptoms.length && !UI.tags.bagang.length && !UI.tags.liujing.length && !UI.tags.tizhi){
    alert("请至少选择一项症状或辨证标签"); return;
  }
  const ctx = {
    pregnant: UI.selectedSymptoms.some(s=>s.special==="pregnant"),
    bleeding: UI.selectedSymptoms.some(s=>s.special==="bleeding"),
    tags: UI.tags.bagang.slice(), liujing: UI.tags.liujing.slice(),
    tizhi: UI.tags.tizhi ? [UI.tags.tizhi] : [],
    /* v1.1 P2/P5：症状级辨证标签透传（表虚/表实/瘀/寒/热/虚/痰湿/湿热/气郁等），
       供引擎证候禁忌与方剂指征互证使用，避免"选症状却无证据"脱节 */
    symTags: UI.selectedSymptoms.map(s=>s.tag).filter(Boolean)
  };
  const tagObjs = collectTagObjects();
  UI.result = Engine.run(UI.selectedSymptoms, tagObjs, ctx);
  renderResult();
}

/* ---------- 记录 ---------- */
function saveRecord(){
  if (!UI.result) return;
  const R = UI.result;
  const rec = {
    time: new Date().toLocaleString("zh-CN"),
    S: R.agg.S, attractor: R.attractor.name,
    top: R.top.slice(0,3).map(r=>r.f.name),
    tension: R.dx.tension, stability: +R.dx.stability.toFixed(2),
    symptoms: UI.selectedSymptoms.map(s=>s.n).slice(0,20),
    tags: UI.tags
  };
  const list = JSON.parse(localStorage.getItem("tcm9d_records")||"[]");
  list.unshift(rec); localStorage.setItem("tcm9d_records", JSON.stringify(list.slice(0,50)));
  alert("已保存到本地记录");
}
function renderRecords(){
  const list = JSON.parse(localStorage.getItem("tcm9d_records")||"[]");
  $("#recordList").innerHTML = list.length ? list.map((r,i)=>`
    <div class="rec-item">
      <span class="rec-del" data-i="${i}">删除</span>
      <div class="r-t">${r.time}</div>
      <div class="r-v">S=(${r.S.join(",")})　吸引子：${r.attractor}　张力${r.tension}/稳固${r.stability}</div>
      <div class="r-f">推荐：${r.top.length?r.top.join("、"):"（全拦截）"}</div>
      <div class="r-t" style="margin-top:3px">症状：${(r.symptoms||[]).join("、")||"—"}</div>
    </div>`).join("") : `<div style="color:var(--mut);font-size:13px;padding:10px 0">暂无记录。完成一次推演后点击「保存本次推演记录」。</div>`;
  $$("#recordList .rec-del").forEach(el=>{
    el.onclick = ()=>{
      const l = JSON.parse(localStorage.getItem("tcm9d_records")||"[]");
      l.splice(+el.dataset.i,1); localStorage.setItem("tcm9d_records",JSON.stringify(l));
      renderRecords();
    };
  });
}

/* ---------- 方剂库 ---------- */
function renderFormulaLib(){
  $("#formulaList").innerHTML = DATA.formulas.map((f,i)=>`
    <div class="fold-h" data-fold="lib${i}"><span>${f.name} <span class="tag-pill">${f.attractor}</span></span><span class="arr">▶</span></div>
    <div class="fold-b" id="lib${i}">
      <div class="vec-line">v = (${f.vec.join(",")})</div>
      <div class="f-sec" style="margin-top:8px"><div class="f-sec-t">君臣佐使</div>
        <div class="jczs">
          ${f.jun.length?`<span class="role">君</span><span>${f.jun.join("、")}</span>`:""}
          ${f.chen.length?`<span class="role">臣</span><span>${f.chen.join("、")}</span>`:""}
          ${f.zuo.length?`<span class="role">佐</span><span>${f.zuo.join("、")}</span>`:""}
          ${f.shi.length?`<span class="role">使</span><span>${f.shi.join("、")}</span>`:""}
        </div></div>
      <div class="f-sec"><div class="f-sec-t">牵引路径</div><div style="font-size:13px">${f.path}</div></div>
      <div class="f-sec"><div class="f-sec-t">适用辨证</div><div style="font-size:13px">${f.apply}</div></div>
      <div class="f-sec"><div class="f-sec-t">禁忌条件</div><div style="font-size:12.5px;color:var(--red)">${f.contra}</div></div>
      <div class="f-sec" style="margin-bottom:0"><div class="f-sec-t">配伍解析</div><div style="font-size:12.5px;color:var(--mut)">${f.note}</div></div>
    </div>`).join("");
  $$("#formulaList [data-fold]").forEach(h=>{
    h.onclick = ()=>{ const b=document.getElementById(h.dataset.fold); b.classList.toggle("open"); h.classList.toggle("open"); };
  });
}

/* ---------- 知识库 ---------- */
const KB_SECS = ["九维定义","吸引子","演化规则","诊断指标","八纲映射","六经映射","体质辨识","药性映射","治则治法","配伍禁忌","药材库"];
let kbCur = "九维定义";
function renderKB(){
  $("#kbTabs").innerHTML = KB_SECS.map(s=>`<div class="kb-tab ${s===kbCur?"on":""}" data-s="${s}">${s}</div>`).join("");
  $$("#kbTabs .kb-tab").forEach(el=>el.onclick=()=>{kbCur=el.dataset.s;renderKB();});
  let h = "";
  const sec = (t,b)=>`<div class="kb-sec"><h4>${t}</h4>${b}</div>`;
  if (kbCur==="九维定义"){
    h = DATA.dimensions.map(d=>sec(`${d.key} ${d.name} <span class="tag-pill">${d.layer}</span>${d.couple?`<span class="tag-pill">${d.couple}</span>`:""}`,
      `<table class="kb-table"><tr><th>0 阴/潜</th><th>1 和/中</th><th>2 阳/显</th></tr>
       <tr><td>${d.states[0]}</td><td>${d.states[1]}</td><td>${d.states[2]}</td></tr>
       <tr><td style="color:var(--mut)">${d.tcm[0]}</td><td style="color:var(--mut)">${d.tcm[1]}</td><td style="color:var(--mut)">${d.tcm[2]}</td></tr></table>`)).join("")
      + sec("状态空间","维度数 9 × 每维 3 态 = <b>3⁹ = 19683</b> 种状态；唯一中和点 (1,1,1,1,1,1,1,1,1)；四组耦合对：时位(d2·d3)/能信(d4·d5)/群序(d6·d7)/知行(d8·d9)。");
  } else if (kbCur==="吸引子"){
    h = DATA.attractors.map(a=>sec(`${a.name}吸引子 <span class="tag-pill">示例：${a.formula}</span>`,
      `<p>场景：${a.scene}</p><div class="kv">判别条件：${a.cond}</div><div class="kv">切换前提：${a.switchPre}</div><div class="kv" style="color:var(--red)">风险：${a.risk}</div>`)).join("")
      + sec("切换顺序（不能跳步）","失衡 → 中和 → 显化/潜藏/关系 → 再回中和检验。<br>口诀：系统乱，先回中和；方向清、结构稳，才去显化；能量亏、空间小，先进潜藏；问题在连接、本体又稳，再入关系。");
  } else if (kbCur==="演化规则"){
    h = DATA.evoRules.map(r=>sec(r.t,`<p>${r.d}</p><div class="kv">形式化：${r.f}</div><div class="kv">示例：${r.s}</div>`)).join("");
  } else if (kbCur==="诊断指标"){
    h = DATA.metrics.map(m=>sec(m.n,`<p>${m.m}</p><div class="kv">公式：${m.f}</div><div class="kv">阈值：${m.t}</div><div class="kv" style="color:var(--pri)">干预：${m.a}</div>`)).join("");
  } else if (kbCur==="八纲映射"){
    h = `<div class="kb-sec"><table class="kb-table"><tr><th>八纲</th><th>典型向量</th><th>吸引子</th><th>治则</th><th>示例方</th></tr>` +
      DATA.bagang.map(b=>`<tr><td><b>${b.n}</b></td><td class="fv">(${b.vec.join(",")})</td><td>${b.attr}</td><td>${b.rule}</td><td>${b.f}</td></tr>`).join("") +
      `</table></div>` + sec("八纲合参","表里先辨（定病位d3）→ 寒热次辨（定药性d4）→ 虚实再辨（定补泻d1/d4/d9）→ 阴阳总括。");
  } else if (kbCur==="六经映射"){
    h = `<div class="kb-sec"><table class="kb-table"><tr><th>六经</th><th>典型向量</th><th>治则</th><th>代表方</th></tr>` +
      DATA.liujing.map(l=>`<tr><td><b>${l.n}</b></td><td class="fv">(${l.vec.join(",")})</td><td>${l.rule}</td><td>${l.f}</td></tr>`).join("") +
      `</table></div>` + sec("六经传变","循经传：太阳→阳明→少阳→太阴→少阴→厥阴（由表入里）；越经传：跳跃式恶化；直中：d1极虚邪直入深层；合病/并病：多吸引子冲突与过渡态。");
  } else if (kbCur==="体质辨识"){
    h = `<div class="kb-sec"><table class="kb-table"><tr><th>体质</th><th>典型向量</th><th>调治</th><th>代表方</th></tr>` +
      DATA.tizhi.map(t=>`<tr><td><b>${t.n}</b></td><td class="fv">(${t.vec.join(",")})</td><td>${t.rule}</td><td>${t.f}</td></tr>`).join("") + `</table></div>`;
  } else if (kbCur==="药性映射"){
    h = `<div class="kb-sec"><table class="kb-table"><tr><th>药性</th><th>九维操作</th><th>示例药</th><th>注意</th></tr>` +
      DATA.yaoxing.map(y=>`<tr><td><b>${y.c}</b></td><td>${y.op}</td><td>${y.ex}</td><td style="color:var(--mut)">${y.note}</td></tr>`).join("") + `</table></div>`
      + sec("毒性分级","大毒（附子生/川乌/草乌/巴豆）：十去其六，中病即止；有毒（生半夏/天南星/商陆/甘遂）：十去其七，炮制减毒；小毒（防己/苦杏仁/吴茱萸/细辛）：十去其八，用量宜轻。");
  } else if (kbCur==="治则治法"){
    h = `<div class="kb-sec"><table class="kb-table"><tr><th>治法</th><th>九维操作</th><th>适用</th><th>示例方</th><th>禁忌</th></tr>` +
      DATA.zefa.map(z=>`<tr><td><b>${z.n}</b></td><td>${z.op}</td><td>${z.st}</td><td>${z.f}</td><td style="color:var(--red)">${z.contra}</td></tr>`).join("") + `</table></div>`
      + sec("治法组合","表里双解（汗+清/下）；攻补兼施（补+消/下）；寒热并用（温+清）；升降相因（升提+降逆）；阴阳双补。");
  } else if (kbCur==="配伍禁忌"){
    h = sec("十八反（硬拦截）", DATA.contra.shibaFan.map(r=>`<p>• <b>${r.a}</b> 反 ${r.b.join("、")}<br><span class="kv">${r.why}（风险：${r.risk}）</span></p>`).join(""))
      + sec("十九畏", `<p>${DATA.contra.shijiuWei.map(([a,b])=>a+"畏"+b).join("；")}</p>`)
      + sec("相恶", `<p>${DATA.contra.xiangE.map(([a,b])=>a+"恶"+b+"（补气被消导所破）").join("；")}</p>`)
      + sec("妊娠禁忌", `<p style="color:var(--red)">禁用：${DATA.contra.pregForbid.join("、")}（强攻逐水破血，可致堕胎）</p><p style="color:var(--gold)">慎用：${DATA.contra.pregCaution.join("、")}（活血攻下温里之品，中病即止）</p>`)
      + sec("七情配伍","单行（独参汤）；相须（石膏+知母）；相使（黄芪+茯苓）；相畏/相杀（生姜杀半夏毒）；相恶（人参恶莱菔子）；相反（十八反，一般忌用）。");
  } else if (kbCur==="药材库"){
    h = `<div class="kb-sec"><table class="kb-table"><tr><th>药</th><th>气</th><th>味</th><th>归经</th><th>功效</th><th>九维</th></tr>` +
      Object.entries(DATA.herbs).map(([n,x])=>`<tr><td><b>${n}</b>${x.tox?`<br><span style="color:var(--red);font-size:10.5px">${x.tox}</span>`:""}</td><td>${x.qi}</td><td>${x.wei}</td><td>${x.jing}</td><td>${x.act}</td><td>${x.dims||"—"}</td></tr>`).join("") +
      `</table></div>`;
  }
  $("#kbContent").innerHTML = h;
}

/* ---------- 初始化 ---------- */
window.addEventListener("DOMContentLoaded", ()=>{
  initDisclaimer(); initTabs();
  renderSymGroups(); renderTagChips(); gotoStep(1);
  $("#btnToStep2").onclick = ()=>gotoStep(2);
  $("#btnBackStep1").onclick = ()=>gotoStep(1);
  $("#btnClearSyms").onclick = ()=>{ UI.selectedSymptoms=[]; renderSymGroups(); };
  $("#btnRun").onclick = runInference;
  $("#btnRestart").onclick = ()=>gotoStep(1);
  $("#btnSaveRecord").onclick = saveRecord;
  $("#btnClearRecords").onclick = ()=>{ if(confirm("确认清空全部本地记录？")){localStorage.removeItem("tcm9d_records");renderRecords();} };
});
