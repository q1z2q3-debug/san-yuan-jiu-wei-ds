const fs = require('fs');
const ROOT = '/home/work/dumate/1ef9734c2dde4623adcebd04f6c4302e/workspace/ses_gffe5ec14610a4ffejIUryAKh6ZqSse/project/app/assets/js/';
const dataSrc = fs.readFileSync(ROOT+'data.js','utf8');
const engineSrc = fs.readFileSync(ROOT+'engine.js','utf8');
const concat = dataSrc + '\n' + engineSrc + '\n' + `

const syms = DATA.symptomGroups.flatMap(g=>g.items);
const find = ns => ns.map(n=>{ const s=syms.find(x=>x.n===n); if(!s) console.log('WARN 症状缺失: '+n); return s; }).filter(Boolean);
const mkCtx = (o={})=>({pregnant:false, bleeding:false, tags:[], liujing:[], tizhi:[], symTags:[], ...o});
const tagObj = (src,n,w=2)=>{ const t=src.find(x=>x.n===n); return t?{n:t.n,vec:t.vec,w}:null; };

let pass=0, fail=0;
function check(name, cond, extra){
  if (cond){ pass++; console.log('PASS | '+name+(extra?' | '+extra:'')); }
  else { fail++; console.log('FAIL | '+name+(extra?' | '+extra:'')); }
}
function runCase(label, symNames, tagMap, tizhi, extra) {
  // tagMap: {bagang:[], liujing:[], tizhi:[]}
  const sel = find(symNames);
  const tagObjs = [];
  (tagMap.bagang||[]).forEach(n=>{const t=tagObj(DATA.bagang,n,1); if(t) tagObjs.push(t);});
  (tagMap.liujing||[]).forEach(n=>{const t=tagObj(DATA.liujing,n,2); if(t) tagObjs.push(t);});
  if (tizhi){ const t=tagObj(DATA.tizhi,tizhi,2); if(t) tagObjs.push(t); }
  const ctx = mkCtx({
    pregnant:!!(extra&&extra.pregnant), bleeding:!!(extra&&extra.bleeding),
    tags:(tagMap.bagang||[]).concat(tagMap.liujing||[]),
    tizhi: tizhi?[tizhi]:[],
    symTags: extra&&extra.symTags?extra.symTags:[]
  });
  return Engine.run(sel, tagObjs, ctx);
}
function brief(R){
  return {S:R.agg.S.join(','), E:R.dx.E, attr:R.attractor.name+'('+R.attractor.score+')',
    top:R.top.map(r=>r.f.name+'('+r.score+')').join(','),
    blocked:R.blocked.map(r=>r.f.name).join(',')};
}

console.log('===== v1.1 全量回归测试（对齐原始冒烟场景） =====\\n');

// ---------- 典型证型（与 v1.0 审查冒烟完全一致） ----------
{
  const R = runCase('阳明热盛', ['发热身热','头胀头痛面红目赤','口淡不渴','便秘燥结','舌红苔黄','脉洪大','烦躁不安'],
    {bagang:['热证','阳证','实证'], liujing:['阳明病']}, null);
  const b = brief(R);
  check('阳明热盛: 吸引子=显化', R.attractor.name==='显化', b.attr);
  check('阳明热盛: 首推大承气汤', R.top[0]&&R.top[0].f.name==='大承气汤', b.top);
  check('阳明热盛: 硬拦截四逆/理中', ['四逆汤','理中丸'].every(n=>R.blocked.some(r=>r.f.name===n)), b.blocked);
}
{
  // 原始冒烟场景：症状 + 八纲(寒证/阴证/少阴病) + 阳虚质
  const R = runCase('少阴寒化(原始冒烟)', ['恶寒明显添衣不解','四肢厥冷','大便溏泄','小便清长','舌淡苔白','脉沉'],
    {bagang:['寒证','阴证'], liujing:['少阴病']}, '阳虚质');
  const b = brief(R);
  console.log('  [少阴寒化] S='+b.S+' attr='+b.attr+' top='+b.top);
  check('少阴寒化: S=0,1,0,0,1,0,0,0,0', R.agg.S.join(',')==='0,1,0,0,1,0,0,0,0', b.S);
  check('少阴寒化: 吸引子=潜藏', R.attractor.name==='潜藏', b.attr);
  check('少阴寒化: Top 含四逆汤', R.top.some(r=>r.f.name==='四逆汤'), b.top);
  check('少阴寒化: Top 含理中丸', R.top.some(r=>r.f.name==='理中丸'), b.top);
}
{
  const R = runCase('肝郁气滞', ['胸胁胀满','善太息情绪抑郁','脉弦','失眠多梦'],
    {bagang:['里证']}, '气郁质');
  const b = brief(R);
  check('肝郁气滞: 吸引子=枢转', R.attractor.name==='枢转', b.attr);
  check('肝郁气滞: Top 含逍遥散', R.top.some(r=>r.f.name==='逍遥散'), b.top);
}
{
  const R = runCase('阴虚火旺', ['五心烦热','潮热盗汗','失眠多梦','舌红绛少苔','脉细'], {}, '阴虚质');
  const b = brief(R);
  check('阴虚火旺: 吸引子=潜藏', R.attractor.name==='潜藏', b.attr);
  check('阴虚火旺: Top 含六味地黄丸', R.top.some(r=>r.f.name==='六味地黄丸'), b.top);
  check('阴虚火旺: 四逆被硬拦截', R.blocked.some(r=>r.f.name==='四逆汤'), b.blocked);
}
{
  const R = runCase('妊娠状态', ['妊娠状态','发热身热','便秘燥结','舌红苔黄'], {bagang:['热证']}, null, {pregnant:true});
  const b = brief(R);
  check('妊娠状态: 四逆/理中/血府逐瘀/大承气全拦截',
    ['四逆汤','理中丸','血府逐瘀汤','大承气汤'].every(n=>R.blocked.some(r=>r.f.name===n)), b.blocked);
}
{
  const R = runCase('中和态(空输入)', [], {}, '平和质');
  const b = brief(R);
  check('中和态: E=0', R.dx.E===0, 'E='+b.E);
  check('中和态: 吸引子=中和', R.attractor.name==='中和', b.attr);
}

// ---------- P2-P5/P7 定向验证 ----------
{
  const sel = find(['自汗恶风','脉浮','恶寒明显添衣不解']);
  const ctx = mkCtx({liujing:['太阳病'], symTags:['表虚']});
  const tagObjs = [tagObj(DATA.liujing,'太阳病')];
  const R = Engine.run(sel, tagObjs, ctx);
  const blk = R.blocked.find(r=>r.f.name==='麻黄汤');
  check('P2 表虚自汗: 麻黄汤硬拦截(表虚自汗忌用)', !!blk && blk.hard.some(h=>h.includes('表虚')), blk?blk.hard.join(';'):'未拦截');
  check('P2 表虚自汗: 麻黄汤不在通过候选', !R.passed.some(r=>r.f.name==='麻黄汤'));
}
{
  const sel = find(['寒热往来','胸胁胀满','恶心呕吐','腹痛喜温喜按','口淡不渴']);
  const ctx = mkCtx({liujing:['少阳病'], tizhi:['阳虚质'], symTags:['阳虚']});
  const tagObjs = [tagObj(DATA.liujing,'少阳病'), tagObj(DATA.tizhi,'阳虚质')].filter(Boolean);
  const R = Engine.run(sel, tagObjs, ctx);
  const top = R.top[0];
  check('P3 首推仍为小柴胡汤', top && top.f.name==='小柴胡汤', top?'score='+top.score:'');
  check('P3 compatFull 数组存在', !!top && Array.isArray(top.compatFull));
  const hasFuZi = top && top.compatFull.some(c=>c.t.includes('附子'));
  check('P3 全方复查含附子提示', !!hasFuZi, top?JSON.stringify(top.compatFull.map(c=>c.t)):'');
  check('P3 原方审查不含附子提示', !!top && !top.compat.some(c=>c.t.includes('附子')));
}
{
  const iss = Engine.checkCompat(['半夏','附子'], {pregnant:false});
  const fan = iss.filter(c=>c.lv==='反');
  check('P4 附子+半夏识别为反', fan.length>0, JSON.stringify(fan.map(c=>c.t)));
}
{
  const sel = find(['刺痛固定拒按','面色晦暗','舌紫暗有瘀斑','脉涩结代']);
  const ctx = mkCtx({symTags:['瘀']});
  const R = Engine.run(sel, [], ctx);
  const by = R.passed.find(r=>r.f.name==='补阳还五汤');
  const noWarn = by && !by.warns.some(w=>w.t.includes('血瘀指征不足'));
  check('P5 瘀血四症: 补阳还五汤无指征不足警告', !!noWarn, by?('score='+by.score):'未上榜');
}
{
  const R = Engine.run([], [], mkCtx());
  const steps = R.top[0]?R.top[0].steps:[];
  const hasOldText = steps.some(st=>st.why && st.why.includes('经中介通道1过渡'));
  check('P7 路径不再用旧固定文案', !hasOldText);
  if(R.top[0]) console.log('  [P7] 路径文案示例: '+JSON.stringify(R.top[0].steps.slice(0,2)));
}
{
  // P2/P5 根因：symTags 从症状 tag 聚合后传入引擎（app.js 层已实现，此处验证 engine 读取）
  const sel = find(['自汗恶风']).map(s=>s);
  const t = DATA.symptomGroups.flatMap(g=>g.items).find(s=>s.n==='自汗恶风');
  check('P2根因: 自汗恶风 tag=表虚', !!t && t.tag==='表虚', t?('tag='+t.tag):'');
  const tags = DATA.symptomGroups.flatMap(g=>g.items).filter(s=>['刺痛固定拒按','面色晦暗','舌紫暗有瘀斑','脉涩结代'].includes(s.n)).map(s=>s.tag);
  check('P5根因: 瘀血四症 tag 均为瘀', tags.every(x=>x==='瘀'), tags.join(','));
}

console.log('\\n===== 结果: '+pass+' pass / '+fail+' fail =====');
if(fail>0) process.exit(1);
`;
fs.writeFileSync('/tmp/tcm9d_v11_run.js', concat);
console.log('generated /tmp/tcm9d_v11_run.js');