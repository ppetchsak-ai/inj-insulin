const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=fs.existsSync(path.join(__dirname,'dist/label-core.js'))?'dist/':'';
const core=require('./'+base+'label-core.js');
// Approximate text metrics test layout invariants; real font layout is checked in browser.
const measure=(s,size)=>Array.from(s).filter(c=>!/[ัิ-ฺ็-๎]/.test(c)).length*size*.55;
const count=(svg,re)=>[...svg.matchAll(re)].length;

// ขนาดยา สเกล และลูกสูบ
for(const n of [-2,0,1,3,21,99,101,102,1.5,NaN,Infinity])assert.equal(core.doseValid(n),false);
for(let n=2;n<=100;n+=2){assert.equal(core.doseValid(n),true);const a=core.syringe(n,350);assert.equal(count(a.svg,/data-unit=/g),51);assert.equal(count(a.svg,/y2="45"/g),11);const x=Number(a.svg.match(/data-plunger="\d+" x="([^"]+)"/)[1]);assert.ok(Math.abs(x-(20+n*3.05))<1e-9);}
assert.ok(!core.syringe(21,350).svg.includes('data-plunger'));

// ชนิดยาและวิธีใช้เลือกครั้งเดียว ทุกมื้ออยู่ในสติกเกอร์เดียว
const s={patient:'',hn:'',date:'2026-11-13',clinic:'',width:100,height:150,margin:3,font:14,sample:false,drug:'MIXTARD',timing:'ก่อนอาหาร 30 นาที',advice:['หมุนเวียนจุดฉีด เลี่ยงบริเวณแข็ง เป็นก้อน ช้ำ หรืออักเสบ'],extra:'',meals:[{id:0,name:'เช้า',dose:24},{id:2,name:'เย็น',dose:8}]};
assert.deepEqual(core.validate(s),[],'Blank name and HN must be accepted');
for(const dims of [[100,150],[150,100]]){
 const pages=core.createPages({...s,width:dims[0],height:dims[1]},measure);assert.equal(pages.length,1,'All meals on one sticker');const p=pages[0];
 assert.equal(p.width,dims[0]);assert.equal(p.height,dims[1]);assert.equal(p.overflow,false,`Morning+evening must fit ${dims} (${p.naturalHeight})`);
 assert.equal(count(p.svg,/>MIXTARD · U-100</g),1,'Drug printed once');assert.equal(count(p.svg,/>ก่อนอาหาร 30 นาที</g),1,'Timing printed once');
 assert.equal(count(p.svg,/data-plunger=/g),2,'One syringe per meal');assert.ok(p.svg.includes('data-plunger="24"')&&p.svg.includes('data-plunger="8"'));
 assert.ok(p.svg.includes('>24 ยูนิต<')&&p.svg.includes('>8 ยูนิต<'),'Dose next to each syringe');
 assert.ok(p.svg.indexOf('>เช้า<')<p.svg.indexOf('>เย็น<'),'Meals in order');assert.ok(!p.svg.includes('ขยายขีด'),'No zoom graphic');
 assert.ok(!p.svg.includes('HN:'));assert.ok(!p.svg.includes('ชื่อ:'));
 const full=core.createPages({...s,width:dims[0],height:dims[1],patient:'นางสมศรี ใจดี',hn:'1234567',clinic:'ห้องยา โทร 012'},measure)[0];assert.equal(full.overflow,false,`Name, HN and clinic must fit ${dims} (${full.naturalHeight})`);
}
const three=core.createPages({...s,meals:[...s.meals,{id:3,name:'ก่อนนอน',dose:10}],advice:[]},measure)[0];assert.equal(count(three.svg,/data-plunger=/g),3);
const small=core.createPages({...s,width:58,height:60},measure);assert.ok(small.every(p=>p.overflow));
const long=core.createPages({...s,extra:'คำแนะนำยาว '.repeat(100)},measure);assert.ok(long.every(p=>p.overflow));
const escaped=core.createPages({...s,patient:'<script>alert(1)</script>',hn:'123'},measure)[0].svg;assert.ok(!escaped.includes('<script>'));assert.ok(escaped.includes('&lt;script&gt;'));assert.ok(core.createPages({...s,hn:'123'},measure)[0].svg.includes('HN: 123'));
for(const patch of [{date:''},{width:0},{height:0},{margin:0},{font:5},{meals:[]},{drug:'other'},{drug:''},{timing:''},{meals:[{name:'เช้า',dose:21}]}])assert.ok(core.validate({...s,...patch}).length>0,JSON.stringify(patch));
const html=fs.readFileSync(path.join(__dirname,base+'index.html'),'utf8');for(const name of ['style.css','label-core.js','app.js'])assert.ok(html.includes(name));
console.log('PASS: 50 valid doses, ticks and plunger, drug/timing once, all meals on one sticker (portrait/landscape), no zoom, optional identity, overflow and text escaping.');
