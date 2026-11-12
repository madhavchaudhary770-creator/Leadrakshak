export function localDateISO(date=new Date()){const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),day=String(date.getDate()).padStart(2,'0');return y+'-'+m+'-'+day}

export function normalizeIndianMobile(value){return String(value??'').replace(/\D/g,'').slice(-10)}
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
export function followUpBucket(date,status,today=new Date().toISOString().slice(0,10)){
 if(!date||['Won','Lost'].includes(status))return'closed';
 if(date<today)return'overdue';
 if(date===today)return'today';
 return'upcoming';
}

export function parseLeadVoiceCommand(input, baseDate = new Date()) {
 const raw=String(input??'').trim();
 if(!raw)return {name:'',phone:'',service:'',follow:'',notes:''};
 const digits=raw.replace(/[०-९]/g,d=>String('०१२३४५६७८९'.indexOf(d)));
 const phoneMatch=digits.match(/(?:\+?91[\s-]*)?([6-9]\d{9})/);
 const phone=phoneMatch?phoneMatch[1]:'';
 let before=phoneMatch?digits.slice(0,phoneMatch.index):digits;
 let after=phoneMatch?digits.slice(phoneMatch.index+phoneMatch[0].length):'';
 before=before.replace(/(ग्राहक का नाम|नाम|customer name|name)[:：]?/gi,'').replace(/(मोबाइल नंबर|मोबाइल|फोन नंबर|फोन|mobile number|mobile|phone)[:：]?/gi,'').trim();
 const name=before.replace(/[,:;।]+$/,'').trim();
 let follow='';
 const lower=after.toLowerCase();
 const tomorrow=/\b(tomorrow)\b|कल/.test(lower);
 const today=/\b(today)\b|आज/.test(lower);
 if(tomorrow||today){const d=new Date(baseDate);d.setDate(d.getDate()+(tomorrow?1:0));follow=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
 let service=after.replace(/(कल|आज|tomorrow|today).*/i,'').replace(/(फॉलो.?अप|follow.?up|करना है|रखना है|है)$/gi,'').replace(/^[\s,;:।-]+|[\s,;:।-]+$/g,'').trim();
 return {name,phone,service,follow,notes:raw};
}
