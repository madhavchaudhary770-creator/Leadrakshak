import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeIndianMobile,normalizeIndianDigits,isValidIndianMobile,calculateQuotation,buildCsv,followUpBucket,parseLeadVoiceCommand,localDateISO} from '../src/lib/domain.js';

test('normalizes and validates Indian mobile numbers',()=>{
 assert.equal(normalizeIndianMobile('+91 98765 43210'),'9876543210');
 assert.equal(isValidIndianMobile('9876543210'),true);
 assert.equal(isValidIndianMobile('5876543210'),false);
 assert.equal(isValidIndianMobile('12345'),false);
});
test('calculates quotation totals with capped discount and tax',()=>{
 const result=calculateQuotation([{qty:2,rate:1000},{qty:1,rate:500}],300,18);
 assert.equal(result.subtotal,2500);
 assert.equal(result.discount,300);
 assert.equal(result.tax,396);
 assert.equal(result.total,2596);
 const capped=calculateQuotation([{qty:1,rate:100}],500,150);
 assert.equal(capped.total,0);
});
test('escapes CSV quotes and line breaks safely',()=>{
 const csv=buildCsv([{name:'A "quoted" customer',notes:'line one\nline two'}],['name','notes']);
 assert.match(csv,/A ""quoted"" customer/);
 assert.match(csv,/\r\n/);
});
test('classifies follow-up dates and closed leads',()=>{
 assert.equal(followUpBucket('2026-11-10','New','2026-11-12'),'overdue');
 assert.equal(followUpBucket('2026-11-12','New','2026-11-12'),'today');
 assert.equal(followUpBucket('2026-11-13','New','2026-11-12'),'upcoming');
 assert.equal(followUpBucket('2026-11-12','Won','2026-11-12'),'closed');
});

test('parses a spoken lead command and tomorrow follow-up',()=>{
 const parsed=parseLeadVoiceCommand('Rahul Kumar, mobile 9876543210, CCTV installation, tomorrow follow-up karna hai',new Date('2026-11-12T10:00:00'));
 assert.equal(parsed.name,'Rahul Kumar');
 assert.equal(parsed.phone,'9876543210');
 assert.match(parsed.service,/CCTV installation/i);
 assert.equal(parsed.follow,'2026-11-13');
 assert.ok(parsed.notes.includes('Rahul Kumar'));
});
test('parses Hindi numerals in a spoken mobile number',()=>{
 const parsed=parseLeadVoiceCommand('राहुल कुमार मोबाइल ९८७६५४३२१० CCTV कल follow-up',new Date('2026-11-12T10:00:00'));
 assert.equal(parsed.phone,'9876543210');
 assert.equal(parsed.name,'राहुल कुमार');
 assert.equal(parsed.follow,'2026-11-13');
});

test('formats calendar dates in local time without UTC day shifts',()=>{
 const date=new Date(2026,10,12,0,15,0);
 assert.equal(localDateISO(date),'2026-11-12');
});

test('normalizes Devanagari numerals from voice dictation',()=>{
 assert.equal(normalizeIndianDigits('९८७६५४३२१०'),'9876543210');
 assert.equal(normalizeIndianMobile('९८७६५४३२१०'),'9876543210');
});

test('parses a spoken lead when service is said before the mobile number',()=>{
 const parsed=parseLeadVoiceCommand('Rahul Kumar, CCTV installation, mobile 9876543210, tomorrow follow-up',new Date(2026,10,12,10));
 assert.equal(parsed.name,'Rahul Kumar');
 assert.equal(parsed.phone,'9876543210');
 assert.equal(parsed.service,'CCTV installation');
 assert.equal(parsed.follow,'2026-11-13');
});
test('parses a Hindi labelled voice enquiry',()=>{
 const parsed=parseLeadVoiceCommand('नाम: राहुल कुमार, मोबाइल: ९८७६५४३२१०, सेवा: CCTV, कल follow-up',new Date(2026,10,12,10));
 assert.equal(parsed.name,'राहुल कुमार');
 assert.equal(parsed.phone,'9876543210');
 assert.equal(parsed.service,'CCTV');
 assert.equal(parsed.follow,'2026-11-13');
});
