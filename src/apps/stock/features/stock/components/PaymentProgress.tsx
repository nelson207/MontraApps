import { Link } from "react-router-dom";
import { problemMessage } from "@platform/api/problemCode";
import type { useStockPayment } from "../hooks/useStockPayment";
import { useStockFormat } from "../model/format";
import { stateLabel } from "../model/stockState";
import { useStockText } from "../stockText";
import { ApiMessages, StateBadge } from "./StockStates";

type Props = { payment: ReturnType<typeof useStockPayment>; contractId: string; onFinished: () => void };

// Everything after the form: the confirmation, then what happened. A payment in an unknown state
// offers no way to pay again. Only a real change in the unit or the balance is ever called "paid".
function PaymentProgress({ payment, contractId, onFinished }: Props) {
  const tx = useStockText();
  const { money, date } = useStockFormat();
  const { phase, summary, verification, messages, lastError, preparing } = payment;
  if (!summary) return null;

  const contractLink = `/stock/agreements/${encodeURIComponent(contractId)}`;
  const amount = money(summary.amount, summary.currencyId);
  const unavailable = tx("common.unavailable", "unavailable");
  const finish = () => {
    payment.finish();
    onFinished();
  };

  const details = (
    <>
      <ul className="list-group mb-3">
        {summary.stocks.map((stock) => (
          <li className="list-group-item d-flex justify-content-between gap-2" key={stock.id}>
            <span>{stock.label}</span>
            <span className="text-nowrap">{money(stock.amount, stock.currencyId) ?? unavailable}</span>
          </li>
        ))}
      </ul>
      <dl className="row mb-3">
        {(
          [
            [tx("pay.account", "Netting account"), [summary.account.number, summary.account.relation].filter(Boolean).join(" · ")],
            [tx("recap.amount", "Amount"), amount],
            [tx("cashFlow.valueDate", "Value date"), date(summary.valueDate)],
            [tx("pay.endReason", "End reason"), summary.endReasonName],
            [tx("pay.partial", "Allow partial payment"), summary.allowPartialPayment ? tx("common.yes", "Yes") : tx("common.no", "No")],
          ] as [string, string | null][]
        ).map(([label, value]) => (
          <div className="col-6 col-lg-4 mb-2" key={label}>
            <dt className="fw-normal small text-body-secondary">{label}</dt>
            <dd className="fw-semibold mb-0">{value}</dd>
          </div>
        ))}
      </dl>
    </>
  );

  const backToAgreement = (
    <Link to={contractLink} className="btn btn-outline-secondary" onClick={() => payment.finish()}>
      {tx("pay.backToAgreement", "Back to the agreement")}
    </Link>
  );

  return (
    <div className="card shadow-sm border-0">
      <div className="card-body p-3 p-lg-4">
        {phase === "confirming" && (
          <>
            <h2 className="h5">{tx("pay.confirmTitle", "Confirm this payment")}</h2>
            <p className="text-body-secondary">{tx("pay.confirmText", "This moves real money. Check the details before you confirm.")}</p>
            {details}
            <div className="d-flex flex-wrap justify-content-between gap-2">
              <button type="button" className="btn btn-ghost" onClick={payment.cancel}>
                <i className="bi bi-arrow-left me-2" aria-hidden="true" />
                {tx("common.back", "Back")}
              </button>
              <button type="button" className="btn btn-primary" onClick={() => void payment.send()} disabled={preparing}>
                {tx("pay.confirm", "Confirm payment of {{amount}}", { amount: amount ?? "" })}
              </button>
            </div>
          </>
        )}

        {phase === "sending" && (
          <>
            <h2 className="h5">{tx("pay.sendingTitle", "Sending the payment…")}</h2>
            {details}
            <button type="button" className="btn btn-primary" disabled>
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              {tx("pay.sending", "Sending…")}
            </button>
          </>
        )}

        {phase === "unanswered" && (
          <>
            <h2 className="h5">{tx("pay.unansweredTitle", "There was no answer")}</h2>
            <div className="alert alert-warning" role="alert">
              {problemMessage(lastError) ?? tx("pay.unanswered", "We don't know if the payment arrived.")}{" "}
              {tx("pay.unansweredRetry", "Try again: the same request is sent, so it won't be paid twice.")}
            </div>
            {details}
            <button type="button" className="btn btn-primary" onClick={() => void payment.send()}>
              {tx("common.tryAgain", "Try again")}
            </button>
          </>
        )}

        {phase === "uncertain" && (
          <>
            <h2 className="h5">{tx("pay.uncertainTitle", "The outcome of this payment is unknown")}</h2>
            <div className="alert alert-warning" role="alert">
              {tx("pay.uncertain", "The payment may have started. Check with the back office before paying again.")}
            </div>
            <ApiMessages messages={messages} />
            {details}
            <button type="button" className="btn btn-outline-secondary" onClick={finish}>
              {tx("pay.checked", "I've checked with the back office")}
            </button>
          </>
        )}

        {phase === "processing" && (
          <>
            <h2 className="h5">
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              {tx("pay.processingTitle", "Processing the payment…")}
            </h2>
            <p className="text-body-secondary">{tx("pay.processing", "This can take up to two minutes.")}</p>
            <ApiMessages messages={messages} />
            {details}
          </>
        )}

        {phase === "stillProcessing" && (
          <>
            <h2 className="h5">{tx("pay.stillProcessingTitle", "Still processing")}</h2>
            <div className="alert alert-info" role="status">
              {tx("pay.stillProcessing", "The payment is still being processed. It hasn't failed, so don't pay again.")}
            </div>
            {details}
            <button type="button" className="btn btn-primary" onClick={payment.followAgain}>
              {tx("pay.checkAgain", "Check again")}
            </button>
          </>
        )}

        {phase === "verifying" && (
          <>
            <h2 className="h5">
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              {tx("pay.verifyingTitle", "Checking the stocks and the account…")}
            </h2>
            {details}
          </>
        )}

        {phase === "verified" && verification && (
          <>
            <h2 className="h5">
              {verification.verdict === "paid"
                ? tx("pay.paidTitle", "Paid")
                : verification.verdict === "no_change"
                  ? tx("pay.noChangeTitle", "Processed, no change yet")
                  : tx("pay.unreadableTitle", "Processed, but the result couldn't be read")}
            </h2>
            {verification.verdict === "paid" ? (
              verification.units.some((unit) => !unit.changed) &&
              !verification.balanceChanged && (
                <div className="alert alert-warning" role="alert">
                  {tx("pay.somePaid", "Some of the stocks show no change yet. Please check them.")}
                </div>
              )
            ) : (
              <div className="alert alert-warning" role="alert">
                {verification.verdict === "no_change"
                  ? tx("pay.noChange", "The batch ended without errors, but neither the stock nor the balance has changed. Please check before paying again.")
                  : tx("pay.unreadable", "The batch ended without errors, but the stock or the balance couldn't be read. Please check before paying again.")}
              </div>
            )}
            <ApiMessages messages={verification.messages} />
            <div className="table-responsive mb-3">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr className="small text-body-secondary">
                    <th scope="col">{tx("units.unit", "Unit")}</th>
                    <th scope="col">{tx("pay.before", "Before")}</th>
                    <th scope="col">{tx("pay.now", "Now")}</th>
                  </tr>
                </thead>
                <tbody>
                  {verification.units.map((unit) => (
                    <tr key={unit.id}>
                      <td>{unit.label}</td>
                      <td>{stateLabel(unit.before, tx)}</td>
                      <td>{unit.after === undefined ? unavailable : <StateBadge state={unit.after} />}</td>
                    </tr>
                  ))}
                  <tr>
                    <td>{tx("netting.balance", "Balance")}</td>
                    <td>{money(verification.balanceBefore, summary.currencyId) ?? unavailable}</td>
                    <td>{money(verification.balanceAfter, summary.currencyId) ?? unavailable}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="d-flex flex-wrap gap-2">
              {verification.verdict !== "paid" && (
                <button type="button" className="btn btn-primary" onClick={payment.verifyAgain}>
                  {tx("pay.checkAgain", "Check again")}
                </button>
              )}
              {backToAgreement}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PaymentProgress;
