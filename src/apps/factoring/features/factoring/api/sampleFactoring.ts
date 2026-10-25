import { delay, sampleSeed } from "@platform/api/devFallback";
import { addDays, todayLocal, type Entity, type FactoringAgreement, type FactoringDraft } from "../model/factoring";
import type { DocumentStatus, FactoringDocumentRow, FactoringRequest, EntityPage } from "./factoringApi";

// Development-only stand-ins for the factoring endpoints: four agreements per credit intermediary
// (factoring and confirming), a few hundred companies to search, and a few dozen documents,
// plus the ones submitted in this session (kept in memory).

const COMPANIES = ["Banco Atlântico", "Lusa Financeira", "Crédito Norte"];

const NAMES = [
  "Construtora Norte", "Hotel Mar Azul", "Transportes Lusos", "Têxteis do Ave", "Metalúrgica Central", "Farmácia Avenida",
  "Vinhos do Douro", "Cerâmica de Aveiro", "Moagem Ribeiro", "Papelaria Moderna", "Clínica São João", "Gráfica Lisboeta",
  "Mármores de Estremoz", "Pastelaria Bela Vista", "Óptica Central", "Agro Alentejo", "Madeiras do Pinhal", "Plásticos Oeste",
  "Eletro Sul", "Café Atlântico", "Conservas Ramirez", "Calçado Felgueiras", "Seguros Tejo", "Logística Atlântica",
];
const SUFFIXES = ["Lda.", "S.A.", "Unipessoal, Lda."];
const CITIES = ["Lisboa", "Porto", "Braga", "Coimbra", "Faro", "Aveiro", "Setúbal", "Évora", "Leiria", "Viseu"];

const ENTITIES: Entity[] = Array.from({ length: 24 * 10 }, (_, i) => ({
  id: 1000 + i,
  name: `${NAMES[i % NAMES.length]}${i >= NAMES.length ? ` ${CITIES[Math.floor(i / NAMES.length) % CITIES.length]}` : ""}, ${SUFFIXES[i % SUFFIXES.length]}`,
  taxNumber: String(500_000_000 + ((i * 7_919_773) % 99_999_999)),
  city: CITIES[(i * 3) % CITIES.length],
}));

const normalize = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export async function sampleSearchEntities(search: string, pageSize: number): Promise<EntityPage> {
  await delay(250);
  const words = normalize(search).split(/\s+/).filter(Boolean);
  const matches = ENTITIES.filter((e) => {
    const text = normalize(`${e.name} ${e.taxNumber} ${e.city ?? ""}`);
    return words.every((w) => text.includes(w));
  });
  return { items: matches.slice(0, pageSize), total: matches.length };
}

export function sampleAgreements(intermediaryId: string): FactoringAgreement[] {
  const seed = sampleSeed(intermediaryId);
  return [
    { nature: 0, company: 0, limit: 400_000 },
    { nature: 0, company: 1, limit: 250_000 },
    { nature: 1, company: 0, limit: 300_000 },
    { nature: 1, company: 2, limit: 150_000 },
  ].map(({ nature, company, limit }, i) => ({
    id: seed * 10 + i + 1,
    number: `${nature === 0 ? "FCT" : "CNF"}-${String(seed).padStart(3, "0")}-${i + 1}`,
    financialCompany: COMPANIES[company],
    nature: nature as 0 | 1,
    creditLimit: limit,
    used: Math.round(limit * (0.3 + ((seed * 7 + i * 11) % 45) / 100)),
    advancePercent: [80, 85, 100, 100][i],
    maxTermDays: [120, 90, 180, 150][i],
    rate: [3.9, 4.4, 3.2, 3.6][i],
  }));
}

const STATUSES: DocumentStatus[] = ["financed", "financed", "approved", "submitted", "paid", "paid", "overdue", "financed"];

/** Created in this session, per intermediary */
const created = new Map<string, FactoringDocumentRow[]>();

function seeded(intermediaryId: string): FactoringDocumentRow[] {
  const seed = sampleSeed(intermediaryId);
  const agreements = sampleAgreements(intermediaryId);
  const today = todayLocal();
  return Array.from({ length: 42 }, (_, i) => {
    const agreement = agreements[i % agreements.length];
    const issued = 10 + ((i * 13) % 80);
    const status = STATUSES[(i * 5 + seed) % STATUSES.length];
    return {
      id: seed * 1000 + i + 1,
      reference: `FR-${String(seed).padStart(3, "0")}-${String(Math.floor(i / 3) + 1).padStart(4, "0")}`,
      invoiceNumber: `FT ${2026}/${String(500 + i * 7)}`,
      issueDate: addDays(today, -issued),
      dueDate: addDays(today, status === "overdue" ? -((i % 9) + 2) : 30 + ((i * 17) % 90) - issued),
      amount: Math.round((1_200 + ((i * 7_351) % 24_000)) * 100) / 100,
      // Under confirming every document of a request is the same supplier's
      entity: ENTITIES[agreement.nature === 1 ? (agreement.id * 3) % 40 : (i * 11) % ENTITIES.length],
      nature: agreement.nature,
      agreementNumber: agreement.number,
      financialCompany: agreement.financialCompany,
      status,
    };
  });
}

export async function sampleDocuments(intermediaryId: string): Promise<FactoringDocumentRow[]> {
  await delay(250);
  return [...(created.get(intermediaryId) ?? []), ...seeded(intermediaryId)];
}

let requests = 0;

export async function sampleCreateRequest(
  intermediaryId: string,
  draft: FactoringDraft,
  agreement: FactoringAgreement,
): Promise<FactoringRequest> {
  await delay(400);
  const seed = sampleSeed(intermediaryId);
  requests += 1;
  const reference = `FR-${String(seed).padStart(3, "0")}-N${String(requests).padStart(3, "0")}`;
  const rows = draft.documents.map((doc, i) => ({
    id: seed * 1_000_000 + requests * 1000 + i,
    reference,
    invoiceNumber: doc.invoiceNumber.trim(),
    issueDate: doc.issueDate,
    dueDate: doc.dueDate,
    amount: doc.amount ?? 0,
    entity: (agreement.nature === 1 ? draft.supplier : doc.debtor)!,
    nature: agreement.nature,
    agreementNumber: agreement.number,
    financialCompany: agreement.financialCompany,
    status: "submitted" as const,
  }));
  created.set(intermediaryId, [...rows, ...(created.get(intermediaryId) ?? [])]);
  return { reference, documents: rows.length };
}
