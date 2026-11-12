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
