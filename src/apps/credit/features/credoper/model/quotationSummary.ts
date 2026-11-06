import type { QuotationSummaryDto } from "@platform/api/generated/MontraPOSApi";
import { businessById, productsOf, type AvailableBusiness } from "./business";

const amountFormat = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * The fields of the quotation a proposal came from, as names, from the reference data the wizard
 * already has (the businesses answer: companies, businesses, their products). The operation type
 * and the state have no list loaded: their ids. null = no value.
 */
export function quotationSummaryFields(q: QuotationSummaryDto, businesses: AvailableBusiness[] | undefined) {
  const business = businesses?.find((b) => b.id === q.aplBusinessId);
  const company = businesses?.flatMap((b) => b.offers).find((o) => o.companyId === q.aplCompanyId);
  const product = productsOf(business, q.aplCompanyId).find((p) => p.id === q.financialProductId);
  const named = (id: number | null | undefined, name: string | null | undefined, what: string) =>
    id == null ? null : name?.trim() || `${what} ${id}`;
  return [
    { label: "Company", value: named(q.aplCompanyId, company?.companyLabel, "Company") },
    { label: "Business", value: named(q.aplBusinessId, businessById(q.aplBusinessId)?.label, "Business") },
    { label: "Operation type", value: named(q.credOperTypeId, null, "Type") },
    { label: "Financial product", value: named(q.financialProductId, product?.description ?? product?.code, "Product") },
    {
      label: "Amount",
      value: q.amount == null ? null : `${amountFormat.format(q.amount)}${q.currencyId ? ` ${q.currencyId}` : ""}`,
    },
    { label: "Begin date", value: q.beginDate?.slice(0, 10) ?? null },
    { label: "State", value: named(q.stateId, null, "State") },
    { label: "Customer", value: q.customerName?.trim() || null },
  ];
}
