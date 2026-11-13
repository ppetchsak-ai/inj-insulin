(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.LabelCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const PX=96/25.4,DRUGS=['NPH','MIXTARD','Regular'];
 const esc=s=>String(s).replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
 const doseValid=n=>Number.isInteger(n)&&n>=2&&n<=100&&n%2===0;
 // ชนิดยาและวิธีใช้เลือกครั้งเดียว (s.drug, s.timing) แต่ละมื้อมีเฉพาะขนาดยา
 function validate(s){const e=[];if(!s.date||!Number.isFinite(new Date(s.date+'T12:00:00').getTime()))e.push('ระบุวันที่ให้ถูกต้อง');if(!Number.isFinite(s.width)||!Number.isFinite(s.height)||Math.min(s.width,s.height)<40||Math.max(s.width,s.height)>500||Math.min(s.width,s.height)>210)e.push('ด้านสั้น 40–210 mm และด้านยาวไม่เกิน 500 mm');if(!Number.isFinite(s.margin)||s.margin<1||s.margin>8)e.push('ระยะขอบต้องอยู่ระหว่าง 1–8 mm');if(![12,14,16,18].includes(s.font))e.push('เลือกขนาดตัวอักษร');if(!DRUGS.includes(s.drug))e.push('เลือกชนิดยา NPH, MIXTARD หรือ Regular');if(!s.timing)e.push('ระบุวิธีใช้ / เวลาฉีดตามใบสั่ง');if(!s.meals.length)e.push('เลือกอย่างน้อย 1 มื้อ');s.meals.forEach(m=>{if(!doseValid(m.dose))e.push('มื้อ'+m.name+': ขนาดยาต้องเป็นเลขคู่ 2–100 ยูนิต (ไม่ปัดขนาดยา)');});return e;}
 function wrap(str,width,size,bold,measure){const seg=typeof Intl.Segmenter==='function'?new Intl.Segmenter('th',{granularity:'word'}):null;const result=[];for(const para of String(str).split('\n')){let line='';const words=seg?Array.from(seg.segment(para),s=>s.segment):Array.from(para);for(const word of words){if(measure(line+word,size,bold)<=width){line+=word;continue;}if(line.trim())result.push(line.trimEnd());line='';if(measure(word,size,bold)>width){const graphemes=typeof Intl.Segmenter==='function'?Array.from(new Intl.Segmenter('th',{granularity:'grapheme'}).segment(word),s=>s.segment):Array.from(word);for(const c of graphemes){if(line&&measure(line+c,size,bold)>width){result.push(line);line='';}line+=c;}}else line=word.trimStart();}if(line)result.push(line.trimEnd());}return result.length?result:[''];}
 // กระบอก 1 ml / 100 ยูนิต เต็มสเกล 0–100 (ขีดใหญ่ทุก 10 ขีดสั้นทุก 2)
 function syringe(dose,width){const valid=doseValid(dose);const x0=20,x1=width-25,scale=(x1-x0)/100,top=26,bottom=55,pos=x0+dose*scale;const body=[];const numberSize=Math.max(10,Math.min(15,(x1-x0)/100*10/2));
  body.push(`<path d="M${x0} ${top}H${x1}V${bottom}H${x0}Z" fill="none" stroke="black" stroke-width="1.8"/>`);
  body.push(`<path d="M2 43H${x0}" stroke="black" stroke-width="2"/>`);
  for(let u=0;u<=100;u+=2){const x=x0+u*scale,major=u%10===0;body.push(`<line data-unit="${u}" x1="${x}" x2="${x}" y1="${top}" y2="${top+(major?19:9)}" stroke="black" stroke-width="${major?1.8:1.3}"/>`);if(major)body.push(`<text x="${x}" y="20" text-anchor="middle" font-size="${numberSize}" font-weight="bold">${u}</text>`);}
  if(valid){body.push(`<rect data-plunger="${dose}" x="${pos}" y="${top+1}" width="3.5" height="${bottom-top-2}" fill="black"/><path d="M${pos+3.5} 49H${x1+12} M${x1+12} 30V61" fill="none" stroke="black" stroke-width="3"/><path d="M${pos} 59l-5 7h10Z" fill="black"/><text x="${Math.max(28,Math.min(width-30,pos))}" y="83" text-anchor="middle" font-size="16" font-weight="bold">${dose}</text>`);}else body.push(`<text x="${width/2}" y="82" text-anchor="middle" font-size="12">รอขนาดยา</text>`);
  return {svg:body.join(''),height:88};
 }
 // สติกเกอร์ 1 แผ่นต่อผู้ป่วย: ชนิดยา + วิธีใช้ด้านบน แล้วเรียงกระบอกแต่ละมื้อชิดกันพร้อมขนาดยา
 function createLabel(s,measure){const w=s.width*PX,h=s.height*PX,p=s.margin*PX,cw=w-2*p,fs=s.font*96/72,wide=s.width>s.height;let y=p;const parts=[];
  const text=(str,{size=fs,bold=false,center=false,gap=2,width=cw,x=p}={})=>{for(const line of wrap(str,width,size,bold,measure)){y+=size*1.13;parts.push(`<text x="${center?x+width/2:x}" y="${y}" font-size="${size}" ${bold?'font-weight="bold"':''} ${center?'text-anchor="middle"':''}>${esc(line)}</text>`);y+=size*.2;}y+=gap;};
  const rule=(weight=1.5)=>{y+=3;parts.push(`<line x1="${p}" x2="${w-p}" y1="${y}" y2="${y}" stroke="black" stroke-width="${weight}"/>`);y+=4;};
  if(s.sample)text('ตัวอย่าง • ไม่ใช่ใบสั่งยา',{size:12,bold:true,center:true,gap:0});
  if(s.patient||s.hn)text([s.patient?'ชื่อ: '+s.patient:'',s.hn?'HN: '+s.hn:''].filter(Boolean).join('   '),{gap:1});
  const drugText=(s.drug||'เลือกยา')+' · U-100',timingText=s.timing||'ระบุวิธีใช้ตามใบสั่ง',drugSize=Math.max(24,fs*1.45),timingSize=Math.max(17,fs*1.1);
  if(wide&&measure(drugText,drugSize,true)+measure(timingText,timingSize,true)+20<cw){y+=drugSize*1.13;parts.push(`<text x="${p}" y="${y}" font-size="${drugSize}" font-weight="bold">${esc(drugText)}</text><text x="${w-p}" y="${y}" text-anchor="end" font-size="${timingSize}" font-weight="bold">${esc(timingText)}</text>`);y+=drugSize*.22;}
  else{text(drugText,{size:drugSize,bold:true,center:true,gap:0});text(timingText,{size:timingSize,bold:true,center:true,gap:0});}
  rule();
  const mealSize=Math.max(24,fs*1.45);
  s.meals.forEach((m,k)=>{const doseText=doseValid(m.dose)?m.dose+' ยูนิต':'— ยูนิต';
   if(k)rule(.8);
   if(wide){// ชื่อมื้อและขนาดยาอยู่ซ้าย กระบอกอยู่ขวาในแถวเดียวกัน
    const labelW=Math.max(measure(m.name,mealSize,true),measure(doseText,mealSize,true),cw*.2)+6,sw=cw-labelW-6,y0=y,syr=syringe(m.dose,sw),rowH=Math.max(syr.height,mealSize*2.7),ty=y0+(rowH-mealSize*2.5)/2;
    parts.push(`<text x="${p}" y="${ty+mealSize*1.05}" font-size="${mealSize}" font-weight="bold">${esc(m.name)}</text><text x="${p}" y="${ty+mealSize*2.3}" font-size="${mealSize}" font-weight="bold">${doseText}</text>`);
    parts.push(`<g transform="translate(${p+labelW+6},${y0+(rowH-syr.height)/2})">${syr.svg}</g>`);y=y0+rowH;
   }else{
    if(measure(m.name,mealSize,true)+measure(doseText,mealSize,true)+14<cw){y+=mealSize*1.1;parts.push(`<text x="${p}" y="${y}" font-size="${mealSize}" font-weight="bold">${esc(m.name)}</text><text x="${w-p}" y="${y}" text-anchor="end" font-size="${mealSize}" font-weight="bold">${doseText}</text>`);y+=mealSize*.12;}
    else{text(m.name,{size:mealSize,bold:true,center:true,gap:0});text(doseText,{size:mealSize,bold:true,center:true,gap:0});}
    const syr=syringe(m.dose,cw);parts.push(`<g transform="translate(${p},${y})">${syr.svg}</g>`);y+=syr.height;
   }
  });
  rule();
  text('กระบอก 1 ml · ขีดใหญ่ 10 · ขีดสั้น 2 ยูนิต · อ่านที่ขอบยางด้านใกล้เข็ม',{size:Math.max(13,fs*.8),center:true,gap:0});
  if(s.advice.length||s.extra){rule();for(const a of s.advice)text('• '+a,{gap:1});if(s.extra)text(s.extra,{gap:1});}
  const date=new Date(s.date+'T12:00:00'),dateText=Number.isFinite(date.getTime())?new Intl.DateTimeFormat('th-TH',{day:'numeric',month:'short',year:'numeric'}).format(date):'';
  rule();text([s.sample?'ตัวอย่าง • ไม่ใช่ใบสั่งยา':'ภาพไม่ใช่ขนาดจริง · ใช้ยาตามใบสั่ง',dateText].filter(Boolean).join(' · '),{size:12,center:true,gap:0});
  if(s.clinic)text(s.clinic,{size:14,center:true,gap:0});
  const naturalHeight=(y+p)/PX,overflow=naturalHeight>s.height+.01;
  const makeSVG=(preview=false)=>{const ph=preview&&overflow?Math.max(h,y+p):h;return `<svg xmlns="http://www.w3.org/2000/svg" width="${s.width}mm" height="${ph/PX}mm" viewBox="0 0 ${w} ${ph}" role="img" aria-label="สติกเกอร์อินซูลิน ${esc(s.meals.map(m=>m.name).join(' '))}" style="font-family:Tahoma,Arial,sans-serif;background:white"><rect width="100%" height="100%" fill="white"/><g fill="black">${parts.join('')}</g>${preview&&overflow?`<line x1="0" x2="${w}" y1="${h}" y2="${h}" stroke="#bc3030" stroke-width="2" stroke-dasharray="6 4"/>`:''}</svg>`;};
  return {name:s.meals.map(m=>m.name).join('–'),id:0,width:s.width,height:s.height,naturalHeight,overflow,svg:makeSVG(),preview:makeSVG(true)};
 }
 function createPages(s,measure){return [createLabel(s,measure)];}
 return {PX,DRUGS,doseValid,validate,wrap,syringe,createPages,esc};
});
