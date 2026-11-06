import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { StockUnitListItemDto } from "@platform/api/generated/MontraPOSApi";
import InputField from "@platform/components/ui/InputField";
import Pagination from "@platform/components/ui/Pagination";
import SelectField from "@platform/components/ui/SelectField";
import { useNettingAccounts, usePaymentEndReasons, useStockUnits } from "../api/stockApi";
import PaymentProgress from "../components/PaymentProgress";
import { ApiMessages, Loading, LoadProblem, StateBadge } from "../components/StockStates";
import { useStockPayment } from "../hooks/useStockPayment";
import { useStockFormat } from "../model/format";
import { sumOfAmounts, validatePaymentForm, type PaymentErrors } from "../model/payment";
import { stockProblemMessage } from "../model/problems";
import { isPayable } from "../model/stockState";
import { useStockText } from "../stockText";

const PAGE_SIZE = 20;

/** Brand, model and VIN can all be missing on a real unit: only what there is */
const unitLabel = (unit: StockUnitListItemDto) =>
  [`#${unit.item ?? "—"}`, [unit.brand, unit.model].filter(Boolean).join(" "), unit.vin].filter(Boolean).join(" · ");

// Pay stocks of one contract from a netting account. A payment under way takes over the page, also
// after a reload, so it can't be started a second time by accident.
function PayStocksPage() {
  const { id = "" } = useParams();
  const payment = useStockPayment(id);
  // Finishing starts a clean form; going back from the confirmation keeps what was filled in
  const [formKey, setFormKey] = useState(0);
  const idle = payment.phase === "idle";
  return (
    <>
      {!idle && <PaymentProgress payment={payment} contractId={id} onFinished={() => setFormKey((key) => key + 1)} />}
      <div hidden={!idle}>
        <PaymentForm key={formKey} contractId={id} payment={payment} />
      </div>
    </>
  );
}

function PaymentForm({ contractId, payment }: { contractId: string; payment: ReturnType<typeof useStockPayment> }) {
  const tx = useStockText();
  const { money, date } = useStockFormat();
  const [page, setPage] = useState(1);
  const units = useStockUnits({ contractId, page, pageSize: PAGE_SIZE });
  const accounts = useNettingAccounts(contractId);
  const reasons = usePaymentEndReasons(contractId);

  /** By id, kept while paging */
  const [selected, setSelected] = useState<Record<string, StockUnitListItemDto>>({});
  const [accountId, setAccountId] = useState<string | null>(null);
  const [valueDate, setValueDate] = useState("");
  /** undefined: not edited, so the sum of the selected units */
  const [editedAmount, setEditedAmount] = useState<number | null | undefined>(undefined);
  const [endReasonId, setEndReasonId] = useState<number | null>(null);
  const [allowPartial, setAllowPartial] = useState(false);
  const [errors, setErrors] = useState<PaymentErrors>({});

  const { failure } = payment;
  const refetchUnits = units.refetch;
  const refetchAccounts = accounts.refetch;
  // After a failure the data may have moved (e.g. a stock no longer active)
  useEffect(() => {
    if (!failure) return;
    refetchUnits();
    refetchAccounts();
  }, [failure, refetchUnits, refetchAccounts]);

  const rows = units.currentData?.items ?? [];
  const accountList = accounts.currentData ?? [];
  const reasonList = reasons.currentData ?? [];
  const total = units.currentData?.totalCount ?? 0;

  // A unit seen in a fresh read as no longer active is no longer selected
  const chosen = Object.values(selected).filter((unit) => {
    const fresh = rows.find((row) => row.id === unit.id);
    return !fresh || isPayable(fresh.state);
  });
  const account = accountList.length === 1 ? accountList[0] : accountList.find((a) => a.id === accountId);
  const sum = sumOfAmounts(chosen);
  const amount = editedAmount === undefined ? sum : editedAmount;
  const reason = reasonList.find((r) => r.id === endReasonId);
  const currency = account?.currencyId ?? chosen[0]?.currencyId ?? null;

  const toggle = (unit: StockUnitListItemDto) => {
    if (!unit.id || !isPayable(unit.state)) return;
    const { id } = unit;
    setSelected(({ [id]: was, ...rest }) => (was ? rest : { ...rest, [id]: unit }));
    // Back to the new sum: an old amount must not silently apply to another selection
    setEditedAmount(undefined);
  };

  const review = () => {
    const found = validatePaymentForm({ accountId: account?.id ?? null, valueDate, amount: amount ?? null, endReasonId, stockCount: chosen.length });
    setErrors(found);
    if (Object.keys(found).length > 0 || !account?.id || amount === null || amount === undefined || endReasonId === null) return;
    void payment.open(
      {
        nettingAccountId: account.id,
        stockIds: chosen.map((unit) => unit.id as string),
        amount,
        endReasonId,
        valueDate,
        allowPartialPayment: allowPartial,
      },
      {
        stocks: chosen.map((unit) => ({
          id: unit.id as string,
          label: unitLabel(unit),
          state: unit.state ?? null,
          amount: unit.amount ?? null,
          currencyId: unit.currencyId ?? null,
        })),
        account: { id: account.id, number: account.number ?? null, relation: account.relation ?? null },
        amount,
        currencyId: currency,
        valueDate,
        endReasonName: reason?.name ?? "",
        allowPartialPayment: allowPartial,
      },
    );
  };

  const back = (
    <Link to={`/stock/agreements/${encodeURIComponent(contractId)}`} className="small">
      <i className="bi bi-arrow-left me-1" aria-hidden="true" />
      {tx("agreements.agreement", "Agreement")}
    </Link>
  );

  if (accounts.isError)
    return (
      <div className="card shadow-sm border-0">
        <div className="card-body p-3 p-lg-4">
          <LoadProblem error={accounts.error} fallback={tx("netting.loadError", "The netting accounts couldn't be loaded. Try again in a moment.")} onRetry={accounts.refetch} />
        </div>
      </div>
    );

  if (!accounts.currentData)
    return (
      <div className="card shadow-sm border-0">
        <div className="card-body">
          <Loading />
        </div>
      </div>
    );

  if (accountList.length === 0)
    return (
      <div className="card shadow-sm border-0">
        <div className="card-body p-3 p-lg-4">
          {back}
          <p className="text-body-secondary mt-3 mb-0">{tx("netting.empty", "This agreement has no netting account, so stocks can't be paid from here.")}</p>
        </div>
      </div>
    );

  return (
    <div className="card shadow-sm border-0">
      <div className="card-body p-3 p-lg-4">
        {back}
        <h2 className="h5 mt-2 mb-3">{tx("pay.action", "Pay stocks")}</h2>

        {failure && (
          <div className="mb-3">
            <div className="alert alert-danger" role="alert">
              {failure.kind === "rejected" ? stockProblemMessage(failure.error, tx("pay.rejected", "The payment wasn't accepted.")) : tx("pay.nothingPaid", "Nothing was paid.")}
            </div>
            <ApiMessages messages={failure.messages} />
          </div>
        )}

        <section className="mb-4">
          <h3 className="h6 mb-3">{tx("pay.stocks", "Stocks to pay")}</h3>
          {units.isError ? (
            <LoadProblem error={units.error} fallback={tx("units.loadError", "The stock units couldn't be loaded. Try again in a moment.")} onRetry={units.refetch} />
          ) : !units.currentData ? (
            <Loading />
          ) : rows.length === 0 ? (
            <p className="text-body-secondary mb-0">{tx("units.empty", "There are no stock units yet.")}</p>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-sm align-middle mb-0">
                  <thead>
                    <tr className="small text-body-secondary">
                      <th scope="col" />
                      <th scope="col">{tx("units.unit", "Unit")}</th>
                      <th scope="col" className="text-end">{tx("recap.amount", "Amount")}</th>
                      <th scope="col">{tx("units.due", "Due")}</th>
                      <th scope="col">{tx("recap.state", "State")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((unit) => (
                      <tr key={unit.id}>
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            aria-label={tx("pay.selectUnit", "Select unit {{item}}", { item: unit.item ?? "—" })}
                            checked={chosen.some((c) => c.id === unit.id)}
                            disabled={!isPayable(unit.state)}
                            onChange={() => toggle(unit)}
                          />
                        </td>
                        <td>{unitLabel(unit)}</td>
                        <td className="text-end text-nowrap">{money(unit.amount, unit.currencyId) ?? "—"}</td>
                        <td className="text-nowrap">{date(unit.dueDate) || "—"}</td>
                        <td>
                          <StateBadge state={unit.state} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="d-flex justify-content-end mt-2">
                <Pagination page={page} pageCount={Math.ceil(total / PAGE_SIZE)} onPageChange={setPage} ariaLabel={tx("units.pages", "Stock unit pages")} />
              </div>
            </>
          )}
          {errors.stocks && <div className="invalid-feedback d-block">{errors.stocks}</div>}
        </section>

        <section className="row gx-3">
          <div className="col-md-6">
            <SelectField
              id="pay-account"
              label={tx("pay.account", "Netting account")}
              required
              value={account?.id ?? undefined}
              disabled={accountList.length === 1}
              placeholder={tx("pay.selectAccount", "Select the account")}
              options={accountList.map((a) => ({
                value: a.id,
                label: `${a.number ?? "—"}${a.relation ? ` · ${a.relation}` : ""} · ${money(a.totalCapital, a.currencyId) ?? tx("common.unavailable", "unavailable")}`,
              }))}
              invalidMessage={errors.account}
              onChange={(e) => setAccountId(String(e.target.value))}
            />
            {account && (account.totalCapital === null || account.totalCapital === undefined) && (
              <div className="alert alert-warning py-2 small" role="alert">
                {tx("netting.unreadable", "This account's balance couldn't be read.")}
              </div>
            )}
          </div>
          <div className="col-md-6">
            {reasons.isError ? (
              <LoadProblem error={reasons.error} fallback={tx("pay.reasonsError", "The end reasons couldn't be loaded.")} onRetry={reasons.refetch} />
            ) : (
              <SelectField
                id="pay-reason"
                label={tx("pay.endReason", "End reason")}
                required
                value={endReasonId ?? undefined}
                isLoading={reasons.isLoading}
                placeholder={tx("pay.selectReason", "Select the end reason")}
                options={reasonList.map((r) => ({ value: r.id, label: r.name }))}
                invalidMessage={errors.endReason}
                onChange={(e) => setEndReasonId(Number(e.target.value))}
              />
            )}
          </div>
          <div className="col-md-6">
            {/* Not restricted here: Accipiens decides which dates it accepts */}
            <InputField
              id="pay-date"
              label={tx("cashFlow.valueDate", "Value date")}
              type="date"
              required
              value={valueDate}
              invalidMessage={errors.valueDate}
              onChange={(e) => setValueDate(e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <InputField
              id="pay-amount"
              label={tx("recap.amount", "Amount")}
              type="number"
              required
              min={0}
              step={0.01}
              inputGroupSpan={currency ?? undefined}
              value={amount ?? ""}
              invalidMessage={errors.amount}
              onChange={(e) => setEditedAmount(e.target.value === "" ? null : Number(e.target.value))}
            />
            <p className="form-text mt-n2">{tx("pay.amountHint", "The sum of the stocks' amounts. A stock that was partly paid owes less: check before you continue.")}</p>
          </div>
          <div className="col-12">
            <div className="form-check mb-3">
              <input id="pay-partial" type="checkbox" className="form-check-input" checked={allowPartial} onChange={(e) => setAllowPartial(e.target.checked)} />
              <label htmlFor="pay-partial" className="form-check-label">
                {tx("pay.partial", "Allow partial payment")}
              </label>
            </div>
          </div>
        </section>

        <div className="d-flex justify-content-end">
          <button type="button" className="btn btn-primary" onClick={review}>
            {tx("pay.review", "Review payment")}
            <i className="bi bi-arrow-right ms-2" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default PayStocksPage;
