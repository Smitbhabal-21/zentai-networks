import test from "node:test";
import assert from "node:assert/strict";
import { analyzeProcurement, demoProcurement, evidence, parseProcurementCsv, procurementTemplate } from "../lib/procurement";

test("all five canonical CSV exports parse with stable join keys", () => {
  const vendors = parseProcurementCsv("vendors", procurementTemplate("vendors") + "V-1,Acme,CA,true,yes,D-1,2026-01-01,2026-12-31,unknown,,,\n");
  const reqs = parseProcurementCsv("requisitions", procurementTemplate("requisitions") + "PR-1,2026-02-01,V-1,Construction,Concrete,P-1,02-CONC,100.00,CAD,approved\n");
  const orders = parseProcurementCsv("orders", procurementTemplate("orders") + "PO-1,PR-1,2026-02-02,V-1,Construction,Concrete,P-1,02-CONC,100.00,CAD,open\n");
  const invoices = parseProcurementCsv("invoices", procurementTemplate("invoices") + "INV-1,A-1,PO-1,V-1,2026-02-03,2026-03-03,Construction,Concrete,P-1,02-CONC,90.00,CAD\n");
  const payments = parseProcurementCsv("payments", procurementTemplate("payments") + "PAY-1,INV-1,2026-02-20,90.00,CAD\n");
  assert.equal(vendors[0].vendor_id, reqs[0].vendor_id);
  assert.equal(reqs[0].req_id, orders[0].req_id);
  assert.equal(orders[0].po_id, invoices[0].po_id);
  assert.equal(invoices[0].invoice_id, payments[0].invoice_id);
  assert.equal(vendors[0].diversity_status, "yes");
  assert.equal(invoices[0].project_code, "P-1");
});

test("CSV import rejects malformed dates and negative spend before replacing data", () => {
  assert.throws(() => parseProcurementCsv("invoices", procurementTemplate("invoices") + "I-1,N-1,P-1,V-1,2026-02-30,2026-03-03,Finance,Software,P-1,02-CONC,90.00,CAD\n"), /issue_date/);
  assert.throws(() => parseProcurementCsv("payments", procurementTemplate("payments") + "PAY-1,INV-1,2026-02-20,-90,CAD\n"), /amount/);
  assert.deepEqual(parseProcurementCsv("payments", procurementTemplate("payments")), []);
});

test("classification spend requires dated evidence, not a yes flag alone", () => {
  const model = demoProcurement();
  const vendor = model.vendors.find(v => v.vendor_id === "V-102")!;
  assert.equal(evidence(vendor, "indigenous", "2026-09-12"), "verified");
  assert.equal(evidence(vendor, "indigenous", "2027-01-01"), "unverified");
  assert.equal(evidence(model.vendors.find(v => v.vendor_id === "V-103"), "diversity", "2026-10-05"), "unknown");
});

test("matching flags over-billed POs, inactive vendors, missing POs, and unpaid overdue invoices", () => {
  const result = analyzeProcurement(demoProcurement(), "2026-10-22");
  const types = result.exceptions.map(e => `${e.type}:${e.record}`);
  assert.ok(types.includes("Invoice over PO:PO-502"));
  assert.ok(types.includes("Inactive vendor:INV-604"));
  assert.ok(types.includes("Invoice without PO:INV-604"));
  assert.ok(types.includes("Overdue invoice:INV-602"));
  assert.ok(!types.includes("Overdue invoice:INV-601"));
});

test("vendor master and payment exceptions retain record IDs for review", () => {
  const model = demoProcurement();
  model.vendors.push({ ...model.vendors[0], vendor_id: "V-999", name: "Northstar Site Supply" });
  model.payments.push({ payment_id: "PAY-999", invoice_id: "INV-602", date: "2026-10-20", amount: 20000, currency: "CAD" });
  const result = analyzeProcurement(model, "2026-10-22");
  assert.ok(result.exceptions.some(e => e.type === "Possible duplicate vendor" && e.record === "V-999"));
  assert.ok(result.exceptions.some(e => e.type === "Overpayment" && e.record === "INV-602"));
});

test("construction project and cost-code mismatches stay visible; older CSVs still import", () => {
  const oldHeader = "invoice_id,invoice_number,po_id,vendor_id,issue_date,due_date,department,category,amount,currency\n";
  const old = parseProcurementCsv("invoices", oldHeader + "I-1,N-1,PO-1,V-1,2026-02-03,2026-03-03,Construction,Concrete,90.00,CAD\n");
  assert.equal(old[0].project_code, "");
  const model = demoProcurement();
  model.invoices[0].project_code = "P-WRONG";
  model.invoices[0].cost_code = "99-WRONG";
  const flags = analyzeProcurement(model, "2026-10-22").exceptions;
  assert.ok(flags.some(e => e.type === "Project mismatch" && e.record === "INV-601"));
  assert.ok(flags.some(e => e.type === "Cost code mismatch" && e.record === "INV-601"));
});
