export function normalizeIndianDigits(value){return String(value??'').replace(/[०-९]/g,d=>String('०१२३४५६७८९'.indexOf(d)))}

export function localDateISO(date=new Date()){const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),day=String(date.getDate()).padStart(2,'0');return y+'-'+m+'-'+day}

export function normalizeIndianMobile(value){return normalizeIndianDigits(value).replace(/\D/g,'').slice(-10)}
export function isValidIndianMobile(value){return /^[6-9]\d{9}$/.test(normalizeIndianMobile(value))}
export function calculateQuotation(items=[],discount=0,taxPercent=0){
 const subtotal=items.reduce((sum,item)=>sum+Math.max(0,Number(item.qty)||0)*Math.max(0,Number(item.rate)||0),0);
 const discountAmount=Math.min(subtotal,Math.max(0,Number(discount)||0));
 const taxable=Math.max(0,subtotal-discountAmount);
 const safeTax=Math.min(100,Math.max(0,Number(taxPercent)||0));
 const taxAmount=taxable*safeTax/100;
 return{subtotal,discount:discountAmount,taxPercent:safeTax,tax:taxAmount,total:taxable+taxAmount};
}
export function buildCsv(rows=[],columns=[]){
 const cell=value=>'"'+String(value??'').replace(/"/g,'""')+'"';
 return '\uFEFF'+[columns.map(cell).join(','),...rows.map(row=>columns.map(key=>cell(row[key])).join(','))].join('\r\n');
}
export function followUpBucket(date,status,today=localDateISO()){
 if(!date||['Won','Lost'].includes(status))return'closed';
 if(date<today)return'overdue';
 if(date===today)return'today';
 return'upcoming';
}

export function parseLeadVoiceCommand(input, baseDate = new Date()) {
 const raw=String(input??'').trim();
 if(!raw)return {name:'',phone:'',service:'',follow:'',notes:''};
 const digits=normalizeIndianDigits(raw);
 const phoneMatch=digits.match(/(?:\+?91[\s-]*)?([6-9]\d{9})/);
 const phone=phoneMatch?phoneMatch[1]:'';
 let cleaned=phoneMatch?digits.slice(0,phoneMatch.index)+' '+digits.slice(phoneMatch.index+phoneMatch[0].length):digits;
 cleaned=cleaned.replace(/\s+/g,' ').trim();
 const tomorrow=/\btomorrow\b|कल/i.test(digits),today=/\btoday\b|आज/i.test(digits);
 let follow='';
 if(tomorrow||today){const date=new Date(baseDate);date.setDate(date.getDate()+(tomorrow?1:0));follow=localDateISO(date);}
 cleaned=cleaned.replace(/(?:कल|आज|tomorrow|today).*$/i,'').trim();
 cleaned=cleaned.replace(/(?:फॉलो.?अप|follow.?up|करना है|रखना है|है)$/gi,'').trim();
 const serviceLabel=cleaned.match(/(?:सेवा|काम|service|requirement)\s*[:：]?\s*/i);
 let name='',service='';
 if(serviceLabel){name=cleaned.slice(0,serviceLabel.index);service=cleaned.slice(serviceLabel.index+serviceLabel[0].length);}
 else {
  const parts=cleaned.split(/[,;।]+/).map(x=>x.trim()).filter(Boolean);
  if(parts.length>1){name=parts.shift()||'';service=parts.join(', ');}
  else {
   const mobileLabel=cleaned.match(/(?:मोबाइल नंबर|मोबाइल|फोन नंबर|फोन|mobile number|mobile|phone)[:：]?/i);
   if(mobileLabel&&mobileLabel.index>0&&cleaned.slice(mobileLabel.index+mobileLabel[0].length).trim()){
    name=cleaned.slice(0,mobileLabel.index);service=cleaned.slice(mobileLabel.index+mobileLabel[0].length);
   }else name=cleaned;
  }
 }
 name=name.replace(/(ग्राहक का नाम|नाम|customer name|name)[:：]?/gi,'').replace(/(मोबाइल नंबर|मोबाइल|फोन नंबर|फोन|mobile number|mobile|phone)[:：]?/gi,'').replace(/^[\s,;:।-]+|[\s,;:।-]+$/g,'').trim();
 service=service.replace(/(मोबाइल नंबर|मोबाइल|फोन नंबर|फोन|mobile number|mobile|phone)[:：]?/gi,'').replace(/(ग्राहक का नाम|customer name)[:：]?/gi,'').replace(/^[\s,;:।-]+|[\s,;:।-]+$/g,'').trim();
 return {name,phone,service,follow,notes:raw};
}
