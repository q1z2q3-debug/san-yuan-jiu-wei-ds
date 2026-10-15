/* v1.1 UI 冒烟测试（jsdom runScripts dangerously，浏览器词法环境共享）
 * 将 data.js + engine.js + app.js 内联到 index.html，测试代码独立 script 执行 */
const fs = require('fs');
const { JSDOM } = require('/tmp/tcm9d_uitest/node_modules/jsdom');

const ROOT = '/home/work/dumate/1ef9734c2dde4623adcebd04f6c4302e/workspace/ses_gffe5ec14610a4ffejIUryAKh6ZqSse/project/app/assets/';
let html = fs.readFileSync(ROOT+'index.html', 'utf8');
const dataSrc = fs.readFileSync(ROOT+'js/data.js', 'utf8');
const engineSrc = fs.readFileSync(ROOT+'js/engine.js', 'utf8');
const appSrc = fs.readFileSync(ROOT+'js/app.js', 'utf8');

// 替换外链 script 为内联（保留顺序）
html = html
  .replace(/<script src="js\/data\.js"><\/script>/, ()=>'<script>'+dataSrc+'</'+'script>')
  .replace(/<script src="js\/engine\.js"><\/script>/, ()=>'<script>'+engineSrc+'</'+'script>')
  .replace(/<script src="js\/app\.js"><\/script>/, ()=>'<script>'+appSrc+'</'+'script>');

const testScript = `
window.__results = {pass:0, fail:0, lines:[]};
function check(name, cond, extra){
  if(cond){ window.__results.pass++; window.__results.lines.push('PASS | '+name+(extra?' | '+extra:'')); }
  else { window.__results.fail++; window.__results.lines.push('FAIL | '+name+(extra?' | '+extra:'')); }
}
window.addEventListener('error', e=>{ window.__results.lines.push('WINDOW_ERR: '+e.message); window.__results.fail++; });
const syms = DATA.symptomGroups.flatMap(g=>g.items);
const find = ns => ns.map(n=>syms.find(s=>s.n===n)).filter(Boolean);
const out = ()=>$('#resultArea').innerHTML;

let initOk=false, initCount=0;
setTimeout(()=>{
  initCount = document.querySelectorAll('#symGroupTabs .gtab, #symChips .chip').length;
  initOk = initCount>0;
  window.__initCheck && window.__initCheck();
}, 60);
window.__initCheck = ()=>{ check('初始化: 症状组渲染完成(8组标签+组内症状条目)', initOk, 'elements='+initCount); };

// 少阴寒化（含标签+体质）
UI.selectedSymptoms = find(['恶寒明显添衣不解','四肢厥冷','大便溏泄','小便清长','舌淡苔白','脉沉']);
UI.tags = { bagang:['寒证','阴证'], liujing:['少阴病'], tizhi:'阳虚质' };
runInference();
check('少阴寒化: 潜藏吸引子显示', out().includes('潜藏吸引子'));
check('少阴寒化: 四逆汤卡片渲染', out().includes('四逆汤'));
check('P3: 全方复查区块存在', out().includes('全方复查（原方＋建议加味）'));
check('P3: 原方审查区块存在', out().includes('配伍禁忌审查 · 原方'));
check('P6: 非中和态不显示专卡', !out().includes('无需药物干预'));
check('P8: 迁移总览含判别条件与六吸引子', out().includes('判别条件') && out().includes('六吸引子适配度'));

// 中和态（平和质）→ P6 专卡
UI.selectedSymptoms = [];
UI.tags = { bagang:[], liujing:[], tizhi:'平和质' };
runInference();
check('P6: 中和态显示专卡', out().includes('无需药物干预') && !out().includes('方剂推演 Top'));
check('P6: 中和态不渲染处方卡', !out().includes('f-card'));

// 表虚自汗 + 太阳病 → 麻黄汤硬拦截
UI.selectedSymptoms = find(['自汗恶风','脉浮','恶寒明显添衣不解']);
UI.tags = { bagang:[], liujing:['太阳病'], tizhi:null };
runInference();
check('P2: 拦截列表含麻黄汤/表虚自汗忌用', out().includes('麻黄汤') && out().includes('表虚自汗忌用'));

// 瘀血四症 → 补阳还五汤无指征警告
UI.selectedSymptoms = find(['刺痛固定拒按','面色晦暗','舌紫暗有瘀斑','脉涩结代']);
UI.tags = { bagang:[], liujing:[], tizhi:null };
runInference();
const out5 = out();
  const byBlocked5 = out5.includes('补阳还五汤') && out5.includes('danger');
  check('P5: 补阳还五汤未被硬拦截', !out5.includes('补阳还五汤') || !byBlocked5);
  check('P5: 无血瘀指征不足警告', !out5.includes('血瘀指征不足'));

// 少阳+阳虚 → 全方复查含附子（P3 内容验证）
UI.selectedSymptoms = find(['寒热往来','胸胁胀满','恶心呕吐','腹痛喜温喜按','口淡不渴']);
UI.tags = { bagang:[], liujing:['少阳病'], tizhi:'阳虚质' };
runInference();
check('P3: 首推小柴胡汤', out().indexOf('小柴胡汤') < out().indexOf('f-card NO.') || out().includes('NO.1') && out().includes('小柴胡汤'));
check('P3: 全方复查含附子危险提示', out().includes('附子') && out().includes('反 半夏'));

// 记录保存
UI.selectedSymptoms = find(['恶寒明显添衣不解','四肢厥冷']);
UI.tags = { bagang:['寒证'], liujing:[], tizhi:null };
runInference();
saveRecord();
const recs = JSON.parse(localStorage.getItem('tcm9d_records')||'[]');
check('记录: localStorage 保存成功', recs.length===1 && !!recs[0].attractor, 'attractor='+recs[0].attractor);

setTimeout(window.__initCheck, 60);
setTimeout(()=>{ window.__done = true; }, 80);
`;
html += '<script>'+testScript+'</'+'script>';

const dom = new JSDOM(html, {
  url: 'http://localhost/', runScripts: 'dangerously', pretendToBeVisual: true,
  beforeParse(window){
    window.confirm = ()=>true;
    window.alert = ()=>{};
    window.HTMLCanvasElement.prototype.getContext = function(){
      return { fillRect(){}, clearRect(){}, beginPath(){}, arc(){}, fill(){}, stroke(){}, moveTo(){}, lineTo(){}, closePath(){},
        fillText(){}, measureText(){ return {width:0}; }, createLinearGradient(){ return {addColorStop(){}}; },
        save(){}, restore(){}, translate(){}, scale(){}, rotate(){} };
    };
  }
});
const { window } = dom;

// 等待同步脚本执行完（jsdom 同步执行 script）
setTimeout(()=>{
  const r = window.__results || {fail:1, lines:['未执行到测试脚本']};
  r.lines.forEach(l=>console.log(l));
  console.log('\n===== UI 冒烟结果: '+r.pass+' pass / '+r.fail+' fail =====');
  process.exit(r.fail>0?1:0);
}, 300);