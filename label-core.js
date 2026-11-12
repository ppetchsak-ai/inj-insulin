(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.LabelCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const PX=96/25.4,DRUGS=['NPH','MIXTARD','Regular'];
 const esc=s=>String(s).replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
 const doseValid=n=>Number.isInteger(n)&&n>=2&&n<=100&&n%2===0;
 function validate(s){const e=[];if(!s.date||!Number.isFinite(new Date(s.date+'T12:00:00').getTime()))e.push('ระบุวันที่ให้ถูกต้อง');if(!Number.isFinite(s.width)||!Number.isFinite(s.height)||Math.min(s.width,s.height)<40||Math.max(s.width,s.height)>500||Math.min(s.width,s.height)>210)e.push('ด้านสั้น 40–210 mm และด้านยาวไม่เกิน 500 mm');if(!Number.isFinite(s.margin)||s.margin<1||s.margin>8)e.push('ระยะขอบต้องอยู่ระหว่าง 1–8 mm');if(![12,14,16,18].includes(s.font))e.push('เลือกขนาดตัวอักษร');if(!s.meals.length)e.push('เลือกอย่างน้อย 1 มื้อ');s.meals.forEach(m=>{if(!DRUGS.includes(m.drug))e.push('มื้อ'+m.name+': เลือก NPH, MIXTARD หรือ Regular');if(!doseValid(m.dose))e.push('มื้อ'+m.name+': ต้องเป็นเลขคู่ 2–100 ยูนิต (ไม่ปัดขนาดยา)');if(!m.timing)e.push('มื้อ'+m.name+': ระบุเวลาฉีดตามใบสั่ง');});return e;}
 function wrap(str,width,size,bold,measure){const seg=typeof Intl.Segmenter==='function'?new Intl.Segmenter('th',{granularity:'word'}):null;const result=[];for(const para of String(str).split('\n')){let line='';const words=seg?Array.from(seg.segment(para),s=>s.segment):Array.from(para);for(const word of words){if(measure(line+word,size,bold)<=width){line+=word;continue;}if(line.trim())result.push(line.trimEnd());line='';if(measure(word,size,bold)>width){const graphemes=typeof Intl.Segmenter==='function'?Array.from(new Intl.Segmenter('th',{granularity:'grapheme'}).segment(word),s=>s.segment):Array.from(word);for(const c of graphemes){if(line&&measure(line+c,size,bold)>width){result.push(line);line='';}line+=c;}}else line=word.trimStart();}if(line)result.push(line.trimEnd());}return result.length?result:[''];}
 function syringe(dose,width,detail=false){const start=detail?Math.max(0,Math.min(80,Math.floor((dose-10)/10)*10)):0,end=detail?start+20:100;const valid=doseValid(dose);const x0=20,x1=width-25,scale=(x1-x0)/(end-start),top=26,bottom=55,pos=x0+(dose-start)*scale;let body=[];const numberSize=detail?18:Math.max(10,Math.min(15,(x1-x0)/100*10/2));
  body.push(`<path d="M${x0} ${top}H${x1}V${bottom}H${x0}Z" fill="none" stroke="black" stroke-width="1.8"/>`);
  if(!detail||start===0)body.push(`<path d="M2 43H${x0}" stroke="black" stroke-width="2"/>`);else body.push(`<path d="M${x0-6} 30l-4 7 8 7-4 7" fill="none" stroke="black" stroke-width="1.5"/>`);
  for(let u=start;u<=end;u+=2){const x=x0+(u-start)*scale,major=u%10===0;body.push(`<line data-unit="${u}" x1="${x}" x2="${x}" y1="${top}" y2="${top+(major?19:9)}" stroke="black" stroke-width="${major?1.8:1.3}"/>`);if(major)body.push(`<text x="${x}" y="20" text-anchor="middle" font-size="${numberSize}" font-weight="bold">${u}</text>`);}
  if(valid){body.push(`<rect data-plunger="${dose}" x="${pos}" y="${top+1}" width="3.5" height="${bottom-top-2}" fill="black"/><path d="M${pos+3.5} 49H${x1+12} M${x1+12} 30V61" fill="none" stroke="black" stroke-width="3"/><path d="M${pos} 59l-5 7h10Z" fill="black"/><text x="${Math.max(28,Math.min(width-30,pos))}" y="83" text-anchor="middle" font-size="16" font-weight="bold">${dose}</text>`);}else body.push(`<text x="${width/2}" y="82" text-anchor="middle" font-size="12">รอขนาดยา</text>`);
  return {svg:body.join(''),height:88,start,end};
 }
 function createPage(s,m,measure){const mm=n=>n*PX,w=s.width*PX,h=s.height*PX,p=mm(s.margin),cw=w-2*p,fs=s.font*96/72,wide=s.width>s.height;let y=p,parts=[];
  const text=(str,{size=fs,bold=false,center=false,gap=2,width=cw,x=p}={})=>{for(const line of wrap(str,width,size,bold,measure)){y+=size*1.13;parts.push(`<text x="${center?x+width/2:x}" y="${y}" font-size="${size}" ${bold?'font-weight="bold"':''} ${center?'text-anchor="middle"':''}>${esc(line)}</text>`);y+=size*.2;}y+=gap;};
  const rule=()=>{y+=3;parts.push(`<line x1="${p}" x2="${w-p}" y1="${y}" y2="${y}" stroke="black" stroke-width="1.5"/>`);y+=4;};
  if(s.sample&&!wide)text('ตัวอย่าง • ไม่ใช่ใบสั่งยา',{size:12,bold:true,center:true});
  if(s.patient||s.hn)text([s.patient?'ชื่อ: '+s.patient:'',s.hn?'HN: '+s.hn:''].filter(Boolean).join('   '),{size:fs,gap:1});
  const doseText=doseValid(m.dose)?m.dose+' ยูนิต':'— ยูนิต';const headline=Math.max(28,fs*1.65);
  if(measure(m.name,headline,true)+measure(doseText,headline,true)+14<cw){y+=headline*1.16;parts.push(`<text x="${p}" y="${y}" font-size="${headline}" font-weight="bold">${esc(m.name)}</text><text x="${w-p}" y="${y}" text-anchor="end" font-size="${headline}" font-weight="bold">${doseText}</text>`);y+=headline*.22;}else{text(m.name,{size:headline,bold:true,center:true});text(doseText,{size:headline*1.12,bold:true,center:true});}
  rule();
  if(wide){const left=cw*.43,right=cw-left-10,y0=y;text((m.drug||'เลือกยา')+' · U-100',{bold:true,width:left});const drugBottom=y;y=y0;text(m.timing||'ระบุเวลาตามใบสั่ง',{bold:true,width:right,x:p+left+10});y=Math.max(y,drugBottom);}else{text((m.drug||'เลือกยา')+' · U-100',{bold:true,center:true,gap:0});text(m.timing||'ระบุเวลาตามใบสั่ง',{bold:true,center:true,gap:1});}
  y+=3;
  if(!wide)text('กระบอก 1 ml · 100 ยูนิต',{size:Math.max(13,fs*.78),center:true,gap:0});
  const full=syringe(m.dose,cw);parts.push(`<g transform="translate(${p},${y})">${full.svg}</g>`);y+=full.height;
  if(wide&&s.zoom&&doseValid(m.dose)){
   const left=cw*.43,right=cw-left-12,rightX=p+left+12,startY=y;
   for(const a of s.advice)text('• '+a,{size:fs,gap:1,width:left});if(s.extra)text(s.extra,{size:fs,gap:1,width:left});text('กระบอก 1 ml / 100 ยูนิต',{size:14,gap:0,width:left});text('ขีดใหญ่ 10 · ขีดสั้น 2 ยูนิต',{size:14,bold:true,gap:0,width:left});text('อ่านขอบยางด้านซ้าย (ใกล้เข็ม)',{size:14,gap:0,width:left});const adviceBottom=y;y=startY;
   const detail=syringe(m.dose,right,true);text(`ขยายขีด ${detail.start}–${detail.end} ยูนิต`,{size:Math.max(14,fs*.85),bold:true,center:true,gap:0,width:right,x:rightX});parts.push(`<g transform="translate(${rightX},${y})">${detail.svg}</g>`);y+=detail.height;
   y=Math.max(y,adviceBottom);
  }else{
   if(s.zoom&&doseValid(m.dose)){const detail=syringe(m.dose,cw,true);text(`ขยายขีด ${detail.start}–${detail.end} ยูนิต`,{size:Math.max(14,fs*.85),bold:true,center:true,gap:0});parts.push(`<g transform="translate(${p},${y})">${detail.svg}</g>`);y+=detail.height;}
   text('ขีดใหญ่ 10 · ขีดสั้น 2 ยูนิต',{size:Math.max(14,fs*.85),bold:true,center:true,gap:0});text('อ่านขอบยางด้านใกล้เข็ม (ด้านซ้าย)',{size:Math.max(14,fs*.85),center:true,gap:0});
   if(s.advice.length||s.extra){rule();for(const a of s.advice)text('• '+a,{size:fs,gap:1});if(s.extra)text(s.extra,{size:fs,gap:1});}
  }
  const date=new Date(s.date+'T12:00:00'),dateText=Number.isFinite(date.getTime())?new Intl.DateTimeFormat('th-TH',{day:'numeric',month:'short',year:'numeric'}).format(date):'';
  rule();text((s.sample?'ตัวอย่าง • ไม่ใช่ใบสั่งยา':'ภาพไม่ใช่ขนาดจริง · ใช้ยาตามใบสั่ง')+(wide?' · '+dateText:''),{size:12,center:true,gap:0});
  if(!wide&&dateText)text(dateText,{size:12,center:true,gap:0});if(s.clinic)text(s.clinic,{size:14,center:true,gap:0});
  const naturalHeight=(y+p)/PX,overflow=naturalHeight>s.height+.01;
  const makeSVG=(preview=false)=>{const ph=preview&&overflow?Math.max(h,y+p):h;return `<svg xmlns="http://www.w3.org/2000/svg" width="${s.width}mm" height="${ph/PX}mm" viewBox="0 0 ${w} ${ph}" role="img" aria-label="สติกเกอร์มื้อ${esc(m.name)}" style="font-family:Tahoma,Arial,sans-serif;background:white"><rect width="100%" height="100%" fill="white"/><g fill="black">${parts.join('')}</g>${preview&&overflow?`<line x1="0" x2="${w}" y1="${h}" y2="${h}" stroke="#bc3030" stroke-width="2" stroke-dasharray="6 4"/>`:''}</svg>`;};
  return {name:m.name,id:m.id,width:s.width,height:s.height,naturalHeight,overflow,svg:makeSVG(),preview:makeSVG(true)};
 }
 function createPages(s,measure){return s.meals.map(m=>createPage(s,m,measure));}
 return {PX,DRUGS,doseValid,validate,wrap,syringe,createPages,esc};
});
