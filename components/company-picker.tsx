"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import type { Company } from "@/lib/companies";

export function CompanyPicker({ companies, value, onChange, label = "Search companies" }: {
  companies: Company[];
  value: Company;
  onChange: (company: Company) => void;
  label?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const q = query.trim().toLowerCase();
  const matches = q
    ? companies.filter(company => `${company.ticker} ${company.name}`.toLowerCase().includes(q)).slice(0, 10)
    : companies.slice(0, 10);
  return <div className="company-picker">
    <label className="company-picker-input"><Search size={15} /><span className="sr-only">{label}</span><input type="search" value={query} placeholder={`${value.ticker} · ${value.name} — search 500+`} onChange={event => { setQuery(event.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => window.setTimeout(() => setOpen(false), 120)} onKeyDown={event => { if (event.key === "Escape") setOpen(false); if (event.key === "Enter" && matches[0]) { onChange(matches[0]); setQuery(""); setOpen(false); } }} aria-label={label} aria-expanded={open} autoComplete="off" /></label>
    {open && <div className="company-picker-results" role="listbox" aria-label="Matching companies">{matches.map(company => <button key={company.key} type="button" role="option" aria-selected={company.key === value.key} onMouseDown={event => event.preventDefault()} onClick={() => { onChange(company); setQuery(""); setOpen(false); }}><strong>{company.ticker}</strong><span>{company.name}</span></button>)}{!matches.length && <p>No companies match this search.</p>}</div>}
  </div>;
}
