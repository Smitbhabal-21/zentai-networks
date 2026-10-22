export type ProcurementKind = "vendors" | "requisitions" | "orders" | "invoices" | "payments";
export type EvidenceStatus = "yes" | "no" | "unknown";
export type Vendor = { vendor_id: string; name: string; country: string; active: boolean; diversity_status: EvidenceStatus; diversity_ref: string; diversity_from: string; diversity_until: string; indigenous_status: EvidenceStatus; indigenous_ref: string; indigenous_from: string; indigenous_until: string };
export type Requisition = { req_id: string; date: string; vendor_id: string; department: string; category: string; project_code?: string; cost_code?: string; amount: number; currency: string; status: string };
export type Order = { po_id: string; req_id: string; date: string; vendor_id: string; department: string; category: string; project_code?: string; cost_code?: string; amount: number; currency: string; status: string };
export type Invoice = { invoice_id: string; invoice_number: string; po_id: string; vendor_id: string; issue_date: string; due_date: string; department: string; category: string; project_code?: string; cost_code?: string; amount: number; currency: string };
export type Payment = { payment_id: string; invoice_id: string; date: string; amount: number; currency: string };
export type ProcurementData = { version: 1; source: "demo" | "imported"; vendors: Vendor[]; requisitions: Requisition[]; orders: Order[]; invoices: Invoice[]; payments: Payment[]; imports: Partial<Record<ProcurementKind, { file: string; at: string; rows: number }>>; edits?: { at: string; vendor_id: string; detail: string }[] };
export type ProcurementException = { severity: "high" | "review"; type: string; record: string; detail: string; amount?: number; currency?: string };
export const procurementKinds: ProcurementKind[] = ["vendors", "requisitions", "orders", "invoices", "payments"];

const columns: Record<ProcurementKind, string[]> = {
  vendors: ["vendor_id", "name", "country", "active", "diversity_status", "diversity_ref", "diversity_from", "diversity_until", "indigenous_status", "indigenous_ref", "indigenous_from", "indigenous_until"],
  requisitions: ["req_id", "date", "vendor_id", "department", "category", "project_code", "cost_code", "amount", "currency", "status"],
  orders: ["po_id", "req_id", "date", "vendor_id", "department", "category", "project_code", "cost_code", "amount", "currency", "status"],
  invoices: ["invoice_id", "invoice_number", "po_id", "vendor_id", "issue_date", "due_date", "department", "category", "project_code", "cost_code", "amount", "currency"],
  payments: ["payment_id", "invoice_id", "date", "amount", "currency"],
};
export const procurementTemplate = (kind: ProcurementKind) => columns[kind].join(",") + "\n";
const optionalColumns = new Set(["project_code", "cost_code"]);

function csvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) { row.push(field); field = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some(value => value.trim())) rows.push(row);
      row = [];
    } else field += char;
  }
  if (quoted) throw new Error("CSV has an unclosed quoted field.");
  row.push(field);
  if (row.some(value => value.trim())) rows.push(row);
  return rows;
}
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const validDate = (value: string) => datePattern.test(value) && !Number.isNaN(Date.parse(value + "T12:00:00Z")) && new Date(value + "T12:00:00Z").toISOString().slice(0, 10) === value;
const amount = (value: string, row: number) => {
  if (!/^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/.test(value) || Number(value) > 1e12) throw new Error(`Row ${row}: amount must be nonnegative with up to two decimals.`);
  return Number(value);
};
const code = (value: string, row: number, name: string, optional = false) => {
  if ((!value && !optional) || value.length > 120) throw new Error(`Row ${row}: ${name} is required and must be at most 120 characters.`);
  return value;
};
const currency = (value: string, row: number) => {
  if (!/^[A-Z]{3}$/.test(value)) throw new Error(`Row ${row}: currency must be a three-letter ISO code.`);
  return value;
};
const date = (value: string, row: number, name: string, optional = false) => {
  if ((!value && !optional) || (value && !validDate(value))) throw new Error(`Row ${row}: ${name} must be YYYY-MM-DD.`);
  return value;
};
const status = (value: string, row: number) => {
  if (!["yes", "no", "unknown"].includes(value.toLowerCase())) throw new Error(`Row ${row}: classification must be yes, no, or unknown.`);
  return value.toLowerCase() as EvidenceStatus;
};
export function parseProcurementCsv<K extends ProcurementKind>(kind: K, text: string): ProcurementData[K] {
  if (text.length > 5_000_000) throw new Error("CSV must be under 5 MB.");
  const rows = csvRows(text.replace(/^\uFEFF/, ""));
  if (rows.length < 1 || rows.length > 50_001) throw new Error("CSV needs a header and at most 50,000 data rows.");
  const header = rows[0].map(value => value.trim().toLowerCase());
  if (new Set(header).size !== header.length || columns[kind].some(key => !optionalColumns.has(key) && !header.includes(key))) throw new Error(`Required columns: ${columns[kind].filter(key => !optionalColumns.has(key)).join(", ")}. Optional: project_code, cost_code.`);
  const records = rows.slice(1).map((cells, index) => {
    const line = index + 2;
    if (cells.length !== header.length) throw new Error(`Row ${line}: column count does not match the header.`);
    const get = (key: string) => header.includes(key) ? cells[header.indexOf(key)].trim() : "";
    if (kind === "vendors") return {
      vendor_id: code(get("vendor_id"), line, "vendor_id"), name: code(get("name"), line, "name"), country: code(get("country"), line, "country", true),
      active: get("active").toLowerCase() === "true" ? true : get("active").toLowerCase() === "false" ? false : (() => { throw new Error(`Row ${line}: active must be true or false.`); })(),
      diversity_status: status(get("diversity_status"), line), diversity_ref: code(get("diversity_ref"), line, "diversity_ref", true), diversity_from: date(get("diversity_from"), line, "diversity_from", true), diversity_until: date(get("diversity_until"), line, "diversity_until", true),
      indigenous_status: status(get("indigenous_status"), line), indigenous_ref: code(get("indigenous_ref"), line, "indigenous_ref", true), indigenous_from: date(get("indigenous_from"), line, "indigenous_from", true), indigenous_until: date(get("indigenous_until"), line, "indigenous_until", true),
    } satisfies Vendor;
    if (kind === "requisitions") return { req_id: code(get("req_id"), line, "req_id"), date: date(get("date"), line, "date"), vendor_id: code(get("vendor_id"), line, "vendor_id", true), department: code(get("department"), line, "department"), category: code(get("category"), line, "category"), project_code: code(get("project_code"), line, "project_code", true), cost_code: code(get("cost_code"), line, "cost_code", true), amount: amount(get("amount"), line), currency: currency(get("currency"), line), status: code(get("status"), line, "status") } satisfies Requisition;
    if (kind === "orders") return { po_id: code(get("po_id"), line, "po_id"), req_id: code(get("req_id"), line, "req_id", true), date: date(get("date"), line, "date"), vendor_id: code(get("vendor_id"), line, "vendor_id"), department: code(get("department"), line, "department"), category: code(get("category"), line, "category"), project_code: code(get("project_code"), line, "project_code", true), cost_code: code(get("cost_code"), line, "cost_code", true), amount: amount(get("amount"), line), currency: currency(get("currency"), line), status: code(get("status"), line, "status") } satisfies Order;
    if (kind === "invoices") return { invoice_id: code(get("invoice_id"), line, "invoice_id"), invoice_number: code(get("invoice_number"), line, "invoice_number"), po_id: code(get("po_id"), line, "po_id", true), vendor_id: code(get("vendor_id"), line, "vendor_id"), issue_date: date(get("issue_date"), line, "issue_date"), due_date: date(get("due_date"), line, "due_date"), department: code(get("department"), line, "department"), category: code(get("category"), line, "category"), project_code: code(get("project_code"), line, "project_code", true), cost_code: code(get("cost_code"), line, "cost_code", true), amount: amount(get("amount"), line), currency: currency(get("currency"), line) } satisfies Invoice;
    return { payment_id: code(get("payment_id"), line, "payment_id"), invoice_id: code(get("invoice_id"), line, "invoice_id"), date: date(get("date"), line, "date"), amount: amount(get("amount"), line), currency: currency(get("currency"), line) } satisfies Payment;
  });
  return records as ProcurementData[K];
}

export function validProcurement(value: unknown): value is ProcurementData {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<ProcurementData>;
  return data.version === 1 && (data.source === "demo" || data.source === "imported") &&
    procurementKinds.every(kind => Array.isArray(data[kind]) && data[kind]!.length <= 50_000) &&
    !!data.imports && typeof data.imports === "object" && (data.edits === undefined || Array.isArray(data.edits) && data.edits.every(e => typeof e.at === "string" && typeof e.vendor_id === "string" && typeof e.detail === "string")) &&
    data.vendors!.every(v => typeof v.vendor_id === "string" && typeof v.name === "string" && typeof v.active === "boolean" && ["yes", "no", "unknown"].includes(v.diversity_status) && ["yes", "no", "unknown"].includes(v.indigenous_status)) &&
    data.requisitions!.every(r => typeof r.req_id === "string" && validDate(r.date) && Number.isFinite(r.amount)) &&
    data.orders!.every(o => typeof o.po_id === "string" && validDate(o.date) && Number.isFinite(o.amount)) &&
    data.invoices!.every(i => typeof i.invoice_id === "string" && validDate(i.issue_date) && validDate(i.due_date) && Number.isFinite(i.amount)) &&
    data.payments!.every(p => typeof p.payment_id === "string" && validDate(p.date) && Number.isFinite(p.amount));
}

export function demoProcurement(): ProcurementData {
  return { version: 1, source: "demo", imports: {}, edits: [],
    vendors: [
      { vendor_id: "V-101", name: "Northstar Site Supply", country: "CA", active: true, diversity_status: "yes", diversity_ref: "DEMO-DIV-101", diversity_from: "2026-01-01", diversity_until: "2026-12-31", indigenous_status: "no", indigenous_ref: "", indigenous_from: "", indigenous_until: "" },
      { vendor_id: "V-102", name: "Cedar Civil Works", country: "CA", active: true, diversity_status: "yes", diversity_ref: "DEMO-DIV-102", diversity_from: "2026-01-01", diversity_until: "2026-12-31", indigenous_status: "yes", indigenous_ref: "DEMO-IND-102", indigenous_from: "2026-01-01", indigenous_until: "2026-12-31" },
      { vendor_id: "V-103", name: "Metro Concrete Supply", country: "CA", active: true, diversity_status: "unknown", diversity_ref: "", diversity_from: "", diversity_until: "", indigenous_status: "unknown", indigenous_ref: "", indigenous_from: "", indigenous_until: "" },
      { vendor_id: "V-104", name: "Apex Site Services", country: "US", active: false, diversity_status: "no", diversity_ref: "", diversity_from: "", diversity_until: "", indigenous_status: "no", indigenous_ref: "", indigenous_from: "", indigenous_until: "" },
    ],
    requisitions: [
      { req_id: "PR-401", date: "2026-09-02", vendor_id: "V-101", department: "Infrastructure", category: "Site supplies", project_code: "P-1001", cost_code: "01-SITE", amount: 12000, currency: "CAD", status: "approved" },
      { req_id: "PR-402", date: "2026-09-04", vendor_id: "V-102", department: "Civil works", category: "Subcontractors", project_code: "P-1002", cost_code: "03-CIVIL", amount: 25000, currency: "CAD", status: "approved" },
      { req_id: "PR-403", date: "2026-10-01", vendor_id: "V-103", department: "Infrastructure", category: "Concrete", project_code: "P-1001", cost_code: "02-CONC", amount: 15000, currency: "CAD", status: "approved" },
    ],
    orders: [
      { po_id: "PO-501", req_id: "PR-401", date: "2026-09-05", vendor_id: "V-101", department: "Infrastructure", category: "Site supplies", project_code: "P-1001", cost_code: "01-SITE", amount: 12000, currency: "CAD", status: "open" },
      { po_id: "PO-502", req_id: "PR-402", date: "2026-09-06", vendor_id: "V-102", department: "Civil works", category: "Subcontractors", project_code: "P-1002", cost_code: "03-CIVIL", amount: 25000, currency: "CAD", status: "open" },
      { po_id: "PO-503", req_id: "PR-403", date: "2026-10-02", vendor_id: "V-103", department: "Infrastructure", category: "Concrete", project_code: "P-1001", cost_code: "02-CONC", amount: 15000, currency: "CAD", status: "open" },
    ],
    invoices: [
      { invoice_id: "INV-601", invoice_number: "NS-110", po_id: "PO-501", vendor_id: "V-101", issue_date: "2026-09-10", due_date: "2026-10-10", department: "Infrastructure", category: "Site supplies", project_code: "P-1001", cost_code: "01-SITE", amount: 10000, currency: "CAD" },
      { invoice_id: "INV-602", invoice_number: "CW-220", po_id: "PO-502", vendor_id: "V-102", issue_date: "2026-09-12", due_date: "2026-10-12", department: "Civil works", category: "Subcontractors", project_code: "P-1002", cost_code: "03-CIVIL", amount: 27000, currency: "CAD" },
      { invoice_id: "INV-603", invoice_number: "MS-330", po_id: "PO-503", vendor_id: "V-103", issue_date: "2026-10-05", due_date: "2026-11-05", department: "Infrastructure", category: "Concrete", project_code: "P-1001", cost_code: "02-CONC", amount: 6000, currency: "CAD" },
      { invoice_id: "INV-604", invoice_number: "AX-440", po_id: "", vendor_id: "V-104", issue_date: "2026-10-07", due_date: "2026-11-07", department: "Civil works", category: "Site services", project_code: "P-1002", cost_code: "04-SERV", amount: 3500, currency: "CAD" },
    ],
    payments: [
      { payment_id: "PAY-701", invoice_id: "INV-601", date: "2026-09-30", amount: 10000, currency: "CAD" },
      { payment_id: "PAY-702", invoice_id: "INV-602", date: "2026-10-15", amount: 12000, currency: "CAD" },
    ],
  };
}

export function evidence(vendor: Vendor | undefined, kind: "diversity" | "indigenous", on: string): "verified" | "no" | "unverified" | "unknown" {
  if (!vendor) return "unknown";
  const state = vendor[`${kind}_status`];
  if (state === "no") return "no";
  if (state === "unknown") return "unknown";
  return vendor[`${kind}_ref`] && vendor[`${kind}_from`] && vendor[`${kind}_until`] && vendor[`${kind}_from`] <= on && on <= vendor[`${kind}_until`] ? "verified" : "unverified";
}

export function analyzeProcurement(data: ProcurementData, today: string) {
  const exceptions: ProcurementException[] = [];
  const add = (severity: ProcurementException["severity"], type: string, record: string, detail: string, amount?: number, currency?: string) => exceptions.push({ severity, type, record, detail, amount, currency });
  const seen = (values: string[], type: string) => { const found = new Set<string>(); for (const value of values) { if (found.has(value)) add("high", `Duplicate ${type}`, value, `More than one ${type} record uses this ID.`); found.add(value); } };
  seen(data.vendors.map(v => v.vendor_id), "vendor ID");
  seen(data.requisitions.map(r => r.req_id), "requisition ID");
  seen(data.orders.map(o => o.po_id), "PO ID");
  seen(data.invoices.map(i => i.invoice_id), "invoice ID");
  seen(data.payments.map(p => p.payment_id), "payment ID");
  const vendors = new Map(data.vendors.map(v => [v.vendor_id, v]));
  const reqs = new Map(data.requisitions.map(r => [r.req_id, r]));
  const orders = new Map(data.orders.map(o => [o.po_id, o]));
  const invoices = new Map(data.invoices.map(i => [i.invoice_id, i]));
  const names = new Map<string, string>();
  for (const vendor of data.vendors) {
    const key = vendor.name.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (names.has(key) && names.get(key) !== vendor.vendor_id) add("review", "Possible duplicate vendor", vendor.vendor_id, `Similar name to ${names.get(key)}; review master records.`);
    else names.set(key, vendor.vendor_id);
    for (const kind of ["diversity", "indigenous"] as const) if (vendor[`${kind}_status`] === "yes" && (!vendor[`${kind}_ref`] || !vendor[`${kind}_from`] || !vendor[`${kind}_until`] || vendor[`${kind}_from`] > vendor[`${kind}_until`])) add("review", "Classification evidence", vendor.vendor_id, `${kind} status is yes but the evidence reference or valid dates are incomplete.`);
  }
  for (const req of data.requisitions) if (req.vendor_id && !vendors.has(req.vendor_id)) add("review", "Unknown vendor", req.req_id, `Requisition vendor ${req.vendor_id} is missing from master.`);
  for (const req of data.requisitions) if (req.status.toLowerCase() === "approved" && !data.orders.some(po => po.req_id === req.req_id)) add("review", "Unconverted requisition", req.req_id, "Approved requisition has no linked PO.", req.amount, req.currency);
  for (const po of data.orders) {
    if (!vendors.has(po.vendor_id)) add("high", "Unknown vendor", po.po_id, `PO vendor ${po.vendor_id} is missing from master.`, po.amount, po.currency);
    if (po.req_id) {
      const req = reqs.get(po.req_id);
      if (!req) add("review", "Missing requisition", po.po_id, `Linked requisition ${po.req_id} is absent.`);
      else {
        if (req.vendor_id && req.vendor_id !== po.vendor_id) add("high", "Vendor mismatch", po.po_id, `PO vendor differs from requisition ${req.req_id}.`);
        if (req.currency !== po.currency) add("high", "Currency mismatch", po.po_id, `PO currency differs from requisition ${req.req_id}.`);
        if (req.project_code && po.project_code && req.project_code !== po.project_code) add("high", "Project mismatch", po.po_id, `PO project ${po.project_code} differs from requisition ${req.project_code}.`);
        if (req.cost_code && po.cost_code && req.cost_code !== po.cost_code) add("review", "Cost code mismatch", po.po_id, `PO cost code ${po.cost_code} differs from requisition ${req.cost_code}.`);
        if (po.amount > req.amount + .01 && req.currency === po.currency) add("review", "PO over requisition", po.po_id, `PO exceeds requisition ${req.req_id} by ${(po.amount - req.amount).toFixed(2)}.`, po.amount - req.amount, po.currency);
      }
    } else add("review", "PO without requisition", po.po_id, "No requisition ID was supplied.");
  }
  const invoiceNumbers = new Set<string>();
  for (const invoice of data.invoices) {
    const numberKey = `${invoice.vendor_id.toLowerCase()}|${invoice.invoice_number.toLowerCase()}`;
    if (invoiceNumbers.has(numberKey)) add("high", "Possible duplicate invoice", invoice.invoice_id, `Vendor ${invoice.vendor_id} has another invoice numbered ${invoice.invoice_number}.`, invoice.amount, invoice.currency);
    invoiceNumbers.add(numberKey);
    const vendor = vendors.get(invoice.vendor_id);
    if (!vendor) add("high", "Unknown vendor", invoice.invoice_id, `Invoice vendor ${invoice.vendor_id} is missing from master.`, invoice.amount, invoice.currency);
    else if (!vendor.active) add("high", "Inactive vendor", invoice.invoice_id, `Invoice uses inactive vendor ${invoice.vendor_id}.`, invoice.amount, invoice.currency);
    if (!invoice.po_id) add("review", "Invoice without PO", invoice.invoice_id, "No PO ID was supplied.", invoice.amount, invoice.currency);
    else {
      const po = orders.get(invoice.po_id);
      if (!po) add("high", "Missing PO", invoice.invoice_id, `PO ${invoice.po_id} is absent.`, invoice.amount, invoice.currency);
      else {
        if (po.vendor_id !== invoice.vendor_id) add("high", "Vendor mismatch", invoice.invoice_id, `Invoice vendor differs from PO ${po.po_id}.`, invoice.amount, invoice.currency);
        if (po.currency !== invoice.currency) add("high", "Currency mismatch", invoice.invoice_id, `Invoice currency differs from PO ${po.po_id}.`, invoice.amount, invoice.currency);
        if (po.project_code && invoice.project_code && po.project_code !== invoice.project_code) add("high", "Project mismatch", invoice.invoice_id, `Invoice project ${invoice.project_code} differs from PO ${po.project_code}.`, invoice.amount, invoice.currency);
        if (po.cost_code && invoice.cost_code && po.cost_code !== invoice.cost_code) add("review", "Cost code mismatch", invoice.invoice_id, `Invoice cost code ${invoice.cost_code} differs from PO ${po.cost_code}.`, invoice.amount, invoice.currency);
      }
    }
    for (const kind of ["diversity", "indigenous"] as const) if (vendor?.[`${kind}_status`] === "yes" && evidence(vendor, kind, invoice.issue_date) !== "verified") add("review", "Unverified classification", invoice.invoice_id, `${kind} evidence for ${vendor.vendor_id} does not cover this invoice date.`, invoice.amount, invoice.currency);
  }
  for (const po of data.orders) {
    const linked = data.invoices.filter(i => i.po_id === po.po_id && i.currency === po.currency).reduce((sum, i) => sum + i.amount, 0);
    if (linked > po.amount + .01) add("high", "Invoice over PO", po.po_id, `Linked invoices exceed this PO by ${(linked - po.amount).toFixed(2)}.`, linked - po.amount, po.currency);
  }
  for (const payment of data.payments) {
    const invoice = invoices.get(payment.invoice_id);
    if (!invoice) add("high", "Payment without invoice", payment.payment_id, `Invoice ${payment.invoice_id} is absent.`, payment.amount, payment.currency);
    else if (invoice.currency !== payment.currency) add("high", "Currency mismatch", payment.payment_id, `Payment currency differs from invoice ${invoice.invoice_id}.`, payment.amount, payment.currency);
  }
  for (const invoice of data.invoices) {
    const paid = data.payments.filter(p => p.invoice_id === invoice.invoice_id && p.currency === invoice.currency).reduce((sum, p) => sum + p.amount, 0);
    if (paid > invoice.amount + .01) add("high", "Overpayment", invoice.invoice_id, `Payments exceed invoice by ${(paid - invoice.amount).toFixed(2)}.`, paid - invoice.amount, invoice.currency);
    if (invoice.due_date < today && paid < invoice.amount - .01) add("review", "Overdue invoice", invoice.invoice_id, `Due ${invoice.due_date}; ${(invoice.amount - paid).toFixed(2)} remains unpaid.`, invoice.amount - paid, invoice.currency);
  }
  return { exceptions, vendors, orders, invoices };
}
