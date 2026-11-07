import type {
  FactoringContractDto,
  FactoringCounterpartyDto,
  FactoringDocumentDto,
  FactoringDocumentStatus,
  NewFactoringAdvanceDto,
  NewFactoringCessionDto,
} from "@platform/api/generated/MontraPOSApi";
import { DemoProblem, registerDemoHandlers, type DemoRequest } from "@platform/api/demoBackend";

// DEVELOPMENT ONLY, with "Demo access" and no API: a stand-in for /api/factoring, to walk through
// the screens, also the answers the test data can't give. What is typed picks the outcome:
//   invoice number starting DUP (refused) or UNSURE (uncertain);
//   advance amount of 1 (refused), 2 (uncertain), 3 (batch ends unconfirmed), 4 (batch never ends),
//   5 (the summary has costs, which the real API can't give yet), 6 (batch fails).
// The ids hold a "/" on purpose, like real tokens can.

const contract = (n: number, kind: FactoringContractDto["kind"], extra: Partial<FactoringContractDto> = {}): FactoringContractDto => ({
  id: `demo/contract+${n}`,
  number: 100_053_960 + n,
  kind,
  financialInstitution: n % 2 ? "Banco Atlântico" : "Crédito do Norte",
  currencyId: "EUR",
  withoutRecourse: false,
  availableAmount: 180_000,
  totalAmount: 250_000,
  withoutRecourseAvailableAmount: null,
  withoutRecourseTotalAmount: null,
  advancePercentage: null,
  maxTermDays: null,
  rate: null,
  canSubmit: true,
  canAdvance: true,
  hasAdvanceInProgress: false,
  ...extra,
});

const CONTRACTS = [
  contract(3, "Confirming"),
  contract(4, "Factoring", { canAdvance: false, hasAdvanceInProgress: true }),
  contract(5, "Factoring", {
    withoutRecourse: true,
    availableAmount: 64_500,
    totalAmount: 100_000,
    withoutRecourseAvailableAmount: 20_000,
    withoutRecourseTotalAmount: 40_000,
    advancePercentage: 80,
    maxTermDays: 90,
    rate: 4.25,
  }),
  contract(6, "Confirming", { canSubmit: false, canAdvance: false, hasAdvanceInProgress: false, availableAmount: 0 }),
];

const counterparty = (n: number, kind: FactoringCounterpartyDto["kind"], name: string, extra: Partial<FactoringCounterpartyDto> = {}): FactoringCounterpartyDto => ({
  interventionId: `demo/intervention+${n}`,
  entityId: `demo/entity+${n}`,
  name,
  taxNumber: String(500_000_000 + n),
  externalNumber: `E${n}`,
  kind,
  state: "Active",
  availableAmount: null,
  totalAmount: null,
  withoutRecourseAvailableAmount: null,
  withoutRecourseTotalAmount: null,
  ...extra,
});

const COUNTERPARTIES = [
  counterparty(1, "Debtor", "Oficina Central, Lda.", { availableAmount: 8_000, totalAmount: 15_000, withoutRecourseAvailableAmount: 3_000, withoutRecourseTotalAmount: 5_000 }),
  counterparty(2, "Debtor", "Transportes Évora, S.A."),
  counterparty(3, "Debtor", "Frota Sul, Lda."),
  counterparty(4, "Supplier", "Importadora Lusa, S.A."),
  counterparty(5, "Supplier", "Peças Norte, Lda."),
];

/** Only with includePending: no name or entity until the back office activates it */
const PENDING = [counterparty(6, "Supplier", "", { name: null, entityId: null, state: "Pending" })];

const STATUSES: FactoringDocumentStatus[] = ["Submitted", "Approved", "Financed", "Paid", "Overdue", "Attention", "Closed"];

const DOCUMENTS: FactoringDocumentDto[] = Array.from({ length: 24 }, (_, i) => {
  const owner = CONTRACTS[i % 3];
  const confirming = owner.kind === "Confirming";
  const status = i % 3 === 0 ? (["Approved", "Submitted", "Financed"] as const)[i % 9 === 0 ? 0 : i % 2] : STATUSES[i % STATUSES.length];
  const active = status !== "Submitted";
  const amount = 1_250 + i * 437.5;
  return {
    id: `demo/document+${i}`,
    invoiceNumber: `FT 2026/${100 + i}`,
    cessionId: `demo/cession+${Math.floor(i / 3)}`,
    cessionNumber: 7_000 + Math.floor(i / 3),
    counterparty: COUNTERPARTIES[confirming ? 3 + (i % 2) : i % 3].name,
    taxNumber: COUNTERPARTIES[confirming ? 3 + (i % 2) : i % 3].taxNumber,
    contractId: owner.id,
    contractNumber: owner.number,
    kind: owner.kind,
    financialInstitution: owner.financialInstitution,
    currencyId: i === 22 ? "USD" : "EUR",
    issueDate: `2026-${String(1 + (i % 9)).padStart(2, "0")}-14`,
    dueDate: `2026-${String(4 + (i % 9)).padStart(2, "0")}-14`,
    amount: i === 7 ? null : amount,
    amountNotPaid: status === "Paid" ? 0 : amount,
    advancedAmount: null,
    status,
    stateName: active ? "Ativo" : null,
  };
});

const pageOf = <T>(items: T[], { params }: DemoRequest) => {
  const page = Number(params.page ?? 1);
  const pageSize = Number(params.pageSize ?? 20);
  return { items: items.slice((page - 1) * pageSize, page * pageSize), page, pageSize, totalCount: items.length };
};

const message = (text: string, severity = "Error") => ({ severity, text });

const ADVANCES = [{ id: "demo/advance+1", number: 901, contractId: CONTRACTS[1].id, valueDate: "2026-10-30", amount: 12_000, status: "INI", stateName: "Inicial" }];
const finishedBatches = new Map<string, unknown>();
const seenCorrelations = new Map<string, unknown>();

/** The same correlationId gets the same answer, as the API promises */
const once = (correlationId: string | null | undefined, answer: () => unknown) => {
  const key = correlationId ?? "";
  if (!seenCorrelations.has(key)) seenCorrelations.set(key, answer());
  return seenCorrelations.get(key);
};

const needContract = (id: string) => {
  const found = CONTRACTS.find((c) => c.id === id);
  if (!found) throw new DemoProblem(404, "not_found");
  return found;
};

registerDemoHandlers({
  "GET /api/factoring/contracts": (request) => pageOf(CONTRACTS, request),

  "GET /api/factoring/contracts/:id/counterparties": ({ params }) => {
    needContract(params.id);
    return params.includePending === "true" ? [...COUNTERPARTIES, ...PENDING] : COUNTERPARTIES;
  },

  "POST /api/factoring/contracts/:id/counterparties": ({ body }) => {
    const { taxNumber } = body as { taxNumber: string };
    if (taxNumber.startsWith("0")) return { isAdded: false, isUncertain: false, counterparty: null, messages: [message("Não existe nenhuma entidade com este número de contribuinte.")] };
    if (taxNumber.startsWith("9")) return { isAdded: false, isUncertain: true, counterparty: null, messages: [message("O resultado não pôde ser confirmado.", "Warning")] };
    return { isAdded: true, isUncertain: false, counterparty: { taxNumber, name: null, entityId: null }, messages: [] };
  },

  "POST /api/factoring/contracts/:id/cessions": ({ params, body }) => {
    needContract(params.id);
    const { correlationId, documents } = body as NewFactoringCessionDto;
    return once(correlationId, () => {
      if (documents?.some((d) => d.invoiceNumber?.toUpperCase().startsWith("DUP")))
        return { isSubmitted: false, isUncertain: false, cessionId: null, cessionNumber: null, messages: [message("Este número de fatura já foi usado este ano.")] };
      if (documents?.some((d) => d.invoiceNumber?.toUpperCase().startsWith("UNSURE")))
        return { isSubmitted: false, isUncertain: true, cessionId: null, cessionNumber: null, messages: [message("O pedido pode ter sido criado.", "Warning")] };
      return { isSubmitted: true, isUncertain: false, cessionId: "demo/cession+new", cessionNumber: 7_100, messages: [] };
    });
  },

  "GET /api/factoring/documents": (request) => {
    const { contractId, kind, status, search } = request.params;
    const words = (search ?? "").toLowerCase();
    const filtered = DOCUMENTS.filter(
      (d) =>
        (!contractId || d.contractId === contractId) &&
        (!kind || d.kind === kind) &&
        (!status || d.status === status) &&
        [d.invoiceNumber, d.cessionNumber, d.counterparty, d.taxNumber].some((field) => String(field ?? "").toLowerCase().includes(words)),
    );
    const totals = new Map<string, number>();
    for (const d of filtered) totals.set(d.currencyId ?? "", (totals.get(d.currencyId ?? "") ?? 0) + (d.amountNotPaid ?? 0));
    return { ...pageOf(filtered, request), outstandingAmounts: [...totals].map(([currencyId, amount]) => ({ currencyId, amount })) };
  },

  "GET /api/factoring/cessions/:id": ({ params }) => ({ id: params.id, number: 7_100, contractId: CONTRACTS[0].id, valueDate: "2026-11-06", balance: 0, status: "Submitted", stateName: null, documents: [] }),

  "POST /api/factoring/contracts/:id/advances/summary": ({ body }) => {
    const { amount, documentIds } = body as { amount: number; documentIds: string[] };
    const lines = documentIds.map((documentId, i) => ({ documentId, invoiceNumber: DOCUMENTS.find((d) => d.id === documentId)?.invoiceNumber ?? `#${i}`, maxAmount: 90_000 }));
    const limits = { maxAmount: 90_000, availableAmount: 180_000, plafondAvailableAmount: 75_000 };
    const noCosts = { netAmount: null, interestAmount: null, commissionAmount: null, discountAmount: null, taxAmount: null, isucAmount: null, regularizationAmount: null, netCost: null };
    if (amount > limits.maxAmount) return { ...noCosts, ...limits, costsAvailable: false, documents: lines, messages: [message("O montante é superior ao máximo permitido.")] };
    if (amount !== 5) return { ...noCosts, ...limits, costsAvailable: false, documents: lines, messages: [] };
    const interest = Math.round(amount * 1.5) / 100;
    return {
      ...limits,
      costsAvailable: true,
      netAmount: amount - interest,
      interestAmount: interest,
      commissionAmount: 25,
      discountAmount: null,
      taxAmount: Math.round(interest * 4) / 100,
      isucAmount: null,
      regularizationAmount: 0,
      netCost: interest + 25,
      documents: lines.map((line) => ({ ...line, advanceAmount: amount / documentIds.length, netAmount: (amount - interest) / documentIds.length })),
      messages: [],
    };
  },

  "POST /api/factoring/contracts/:id/advances": ({ params, body }) => {
    const owner = needContract(params.id);
    if (!owner.canAdvance) throw new DemoProblem(400, "factoring_advance_in_progress");
    const { correlationId, amount } = body as NewFactoringAdvanceDto;
    return once(correlationId, () => {
      if (amount === 1) return { isStarted: false, isUncertain: false, advanceId: null, batchId: "demo/batch+refused", messages: [message("O plafond disponível não é suficiente.")] };
      if (amount === 2) return { isStarted: false, isUncertain: true, advanceId: null, batchId: null, messages: [message("O adiantamento pode ter começado.", "Warning")] };
      const batchId = `demo/batch+${correlationId}`;
      if (amount === 3) finishedBatches.set(batchId, { id: batchId, status: "Done", isFinished: true, isSuccessful: false, result: "Unknown", advanceId: null, advanceIds: [], advanceStatus: null, messages: [message("Confirme na lista de adiantamentos.", "Warning")] });
      else if (amount === 6) finishedBatches.set(batchId, { id: batchId, status: "ERR", isFinished: true, isSuccessful: false, result: "Failed", advanceId: null, advanceIds: [], advanceStatus: null, messages: [message("O adiantamento não pôde ser processado.")] });
      else if (amount !== 4) finishedBatches.set(batchId, { id: batchId, status: "Done", isFinished: true, isSuccessful: true, result: "Succeeded", advanceId: "demo/advance+new", advanceIds: ["demo/advance+new"], advanceStatus: "Initial", messages: [] });
      return { isStarted: true, isUncertain: false, advanceId: null, batchId, messages: [] };
    });
  },

  "GET /api/factoring/advances/batches/:id": ({ params }) =>
    finishedBatches.get(params.id) ?? { id: params.id, status: "Running", isFinished: false, isSuccessful: false, result: "Running", advanceId: null, advanceIds: [], advanceStatus: null, messages: [] },

  "GET /api/factoring/advances": (request) => pageOf(ADVANCES.filter((a) => !request.params.contractId || a.contractId === request.params.contractId), request),
});
