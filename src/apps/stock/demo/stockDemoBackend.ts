import type {
  NewStockPaymentDto,
  NewStockUnitDto,
  StockContractDto,
  StockNettingAccountDto,
  StockUnitListItemDto,
} from "@platform/api/generated/MontraPOSApi";
import { DemoProblem, registerDemoHandlers, type DemoRequest } from "@platform/api/demoBackend";

// DEVELOPMENT ONLY, with "Demo access" and no API: a stand-in for /api/stock, to walk through the
// screens. No real payment has completed end to end yet, so every outcome can be chosen by hand:
// the end reason decides what happens to the payment. The ids hold a "/" on purpose, like real tokens can.

const contract = (n: number, extra: Partial<StockContractDto> = {}): StockContractDto => ({
  id: `demo/contract+${n}`,
  number: 50_000 + n,
  description: `Stock financing ${n}`,
  companyId: 1,
  companyAbbreviation: "Montra",
  currencyId: "EUR",
  suppliers: [{ interventionId: `demo/supplier+${n}`, entityId: `demo/entity+${n}`, name: `Importer ${n}` }],
  availableAmount: 200_000,
  totalAmount: 500_000,
  maxPerVehicle: 40_000,
  termDays: 180,
  ratePhases: [{ rate: 4.25, fromDate: "2026-01-01" }],
  equipmentStateIds: [],
  equipmentTypeIds: [],
  canAddStock: true,
  ...extra,
});

const CONTRACTS = [
  contract(1),
  contract(2, {
    suppliers: [
      { interventionId: "demo/supplier+a", entityId: "demo/entity+a", name: "Importer A" },
      { interventionId: "demo/supplier+b", entityId: "demo/entity+b", name: "Importer B" },
    ],
    ratePhases: [
      { rate: 3.5, fromDate: "2026-01-01" },
      { rate: 4.1, fromDate: "2026-07-01" },
    ],
  }),
  contract(3, { canAddStock: false, availableAmount: 0 }),
];

const unit = (n: number, contractIndex: number, state: string | null, amount: number | null): StockUnitListItemDto => ({
  id: `demo/unit+${n}`,
  contractId: CONTRACTS[contractIndex].id,
  contractNumber: CONTRACTS[contractIndex].number,
  item: n,
  autUserStateId: 1,
  state,
  amount,
  currencyId: "EUR",
  beginDate: "2026-06-01",
  dueDate: "2026-12-01",
  endDate: null,
  supplierName: "Importer 1",
  vin: `VF1RJA00X1234${String(n).padStart(4, "0")}`,
  licencePlate: `AA-${String(n).padStart(2, "0")}-BB`,
  brand: "Renault",
  model: "Clio",
  invoiceNumber: `FT 2026/${n}`,
});

const units = [
  unit(1, 0, "Activate", 18_500),
  unit(2, 0, "Activate", 21_250.5),
  unit(3, 0, "Pending", 15_000),
  unit(4, 0, null, null),
  unit(5, 1, "Activate", 30_000),
  unit(6, 1, "Sold", 12_000),
];

const accounts: Record<string, StockNettingAccountDto[]> = {
  "demo/contract+1": [{ id: "demo/account+1", number: 7001, relation: "Current account", currencyId: "EUR", plafondAmount: 100_000, totalCapital: 80_000, totalInterest: 120, totalWithTaxes: 80_150 }],
  "demo/contract+2": [
    { id: "demo/account+2", number: 7002, relation: "Current account", currencyId: "EUR", plafondAmount: 50_000, totalCapital: null, totalInterest: null, totalWithTaxes: null },
    { id: "demo/account+3", number: 7003, relation: "Second account", currencyId: "EUR", plafondAmount: 50_000, totalCapital: 45_000, totalInterest: 10, totalWithTaxes: 45_012 },
  ],
};

const REASONS = ["Demo: paid", "Demo: processed, no change", "Demo: batch failed", "Demo: refused by Accipiens", "Demo: outcome uncertain", "Demo: never finishes"];

const paged = <T,>(all: T[], { page = "1", pageSize = "20" }: Record<string, string>) => {
  const size = Number(pageSize);
  const start = (Number(page) - 1) * size;
  return { items: structuredClone(all.slice(start, start + size)), page: Number(page), pageSize: size, totalCount: all.length };
};

// Answers are copies: the store freezes what it receives, and these records change during the demo
const CASH_FLOW = {
  currencyId: "EUR",
  initialDate: "2026-06-01",
  finalDate: "2026-12-01",
  rate: 4.25,
  capital: 18_500,
  plafondAmount: 500_000,
  totalCapital: 18_500,
  totalInterest: 393.13,
  totalExpenses: null,
  totalTaxes: 16.51,
  totalWithoutTaxes: 18_893.13,
  totalWithTaxes: 18_909.64,
  flows: [{ number: 1, valueDate: "2026-12-01", invoiceDate: "2026-12-01", capital: 18_500, interest: 393.13, taxAmount: 16.51, amount: 18_909.64, outstandingCapital: 0 }],
  otherFlows: [{ valueDate: "2026-06-01", expenseAmount: 25, taxAmount: null, amountWithTaxes: null }],
};

type DemoPayment = { reason: number; request: NewStockPaymentDto; reads: number };

const payments = new Map<string, DemoPayment>();
const byCorrelationId = new Map<string, string>();

const known = (id: string) => {
  const found = units.find((u) => u.id === id);
  if (!found) throw new DemoProblem(404, "not_found");
  return found;
};

registerDemoHandlers({
  "GET /api/stock/contracts": ({ params }: DemoRequest) => paged(CONTRACTS, params),
  "POST /api/stock/contracts/:id/units": ({ params, body }: DemoRequest) => {
    const { amount, invoiceNumber, equipment } = body as NewStockUnitDto;
    if (invoiceNumber?.toUpperCase().includes("REFUSE")) return { isSaved: false, stock: null, messages: [{ severity: "Error", text: "O fornecedor não aceita esta fatura." }] };
    const item = units.length + 1;
    const contractIndex = CONTRACTS.findIndex((c) => c.id === params.id);
    units.unshift({ ...unit(item, Math.max(0, contractIndex), "Initial", amount ?? null), vin: equipment?.serialNumber, brand: equipment?.equipmentBrand, model: equipment?.equipmentModel, invoiceNumber });
    return { isSaved: true, stock: item % 2 ? null : { id: `demo/unit+${item}`, item, amount, beginDate: "2026-11-06" }, messages: [] };
  },
  "GET /api/stock/contracts/:id/cash-flow": () => structuredClone(CASH_FLOW),
  "GET /api/stock/contracts/:id/netting-accounts": ({ params }: DemoRequest) => structuredClone(accounts[params.id] ?? []),
  "GET /api/stock/contracts/:id/payment-end-reasons": () => REASONS.map((name, id) => ({ id, name })),
  "GET /api/stock/units": ({ params }: DemoRequest) => paged(units.filter((u) => !params.contractId || u.contractId === params.contractId), params),
  "GET /api/stock/units/:id": ({ params }: DemoRequest) => structuredClone(known(params.id)),
  "GET /api/stock/units/:id/cash-flow": () => structuredClone(CASH_FLOW),
  "POST /api/stock/payments": ({ body }: DemoRequest) => {
    const request = body as NewStockPaymentDto;
    const reason = request.endReasonId ?? 0;
    if (reason === 3) return { isStarted: false, isUncertain: false, paymentId: null, messages: [{ severity: "Error", text: "Existe variação de Capital após a data..." }] };
    if (reason === 4) return { isStarted: false, isUncertain: true, paymentId: null, messages: [{ severity: "Warning", text: "Não foi possível confirmar o lançamento." }] };
    const repeated = byCorrelationId.get(request.correlationId ?? "");
    const paymentId = repeated ?? `demo/payment+${payments.size + 1}`;
    if (!repeated) {
      payments.set(paymentId, { reason, request, reads: 0 });
      byCorrelationId.set(request.correlationId ?? "", paymentId);
    }
    return { isStarted: true, isUncertain: false, paymentId, messages: [] };
  },
  "GET /api/stock/payments/:id": ({ params }: DemoRequest) => {
    const payment = payments.get(params.id);
    if (!payment) throw new DemoProblem(404, "not_found");
    payment.reads += 1;
    const base = { id: params.id, status: "Running", stocksPaid: null, stocksInError: null, messages: [] };
    if (payment.reason === 5 || payment.reads < 2) return { ...base, isFinished: false, isSuccessful: false };
    if (payment.reason === 2) return { ...base, status: "Failed", isFinished: true, isSuccessful: false, messages: [{ severity: "Error", text: "O lote terminou com erros." }] };
    if (payment.reason === 0 && payment.reads === 2) {
      for (const id of payment.request.stockIds ?? []) known(id).state = "Terminate";
      for (const list of Object.values(accounts))
        for (const account of list)
          if (account.id === payment.request.nettingAccountId && account.totalCapital != null) account.totalCapital -= payment.request.amount ?? 0;
    }
    return { ...base, status: "Finished", isFinished: true, isSuccessful: true };
  },
});
