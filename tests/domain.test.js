import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeIndianMobile,isValidIndianMobile,calculateQuotation,buildCsv,followUpBucket} from '../src/lib/domain.js';

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
