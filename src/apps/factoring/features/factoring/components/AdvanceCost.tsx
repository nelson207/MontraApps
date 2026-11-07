import { useFactoringText } from "../factoringText";
import { useAdvanceSummary } from "../hooks/useAdvanceSummary";
import { useFactoringFormat } from "../model/format";
import { factoringProblemMessage } from "../model/problems";
import { ApiMessages } from "./FactoringStates";

type Props = {
  contractId: string;
  documentIds: string[];
  amount: number | null;
  valueDate: string;
  currencyId: string | null | undefined;
  /** Already on the page: the summary's own figure is only shown when it says something else */
  agreementAvailable: number | null | undefined;
};

const hasValue = (value: number | null | undefined) => value !== null && value !== undefined;

// What the API can say about a confirming advance before it is requested, asked once the typing
// stops. It always gives the limits. Costs need costsAvailable and no messages: the API can't work
// them out without saving an advance, and with messages they aren't real. All of this informs:
// whether the advance goes ahead is only decided when it is requested.
function AdvanceCost({ contractId, documentIds, amount, valueDate, currencyId, agreementAvailable }: Props) {
  const tx = useFactoringText();
  const { money } = useFactoringFormat();
  const complete = documentIds.length > 0 && amount !== null && amount > 0 && !!valueDate;
  const { isLoading, summary, error } = useAdvanceSummary(complete ? { contractId, documentIds, amount, valueDate } : null);
  const unavailable = tx("common.unavailable", "Unavailable");
  const hasMessages = !!summary?.messages?.some((message) => message.text?.trim());
  const showCosts = summary?.costsAvailable === true && !hasMessages;

  const limits = (
    [
      [tx("advance.maxAmount", "Maximum for this advance"), summary?.maxAmount],
      [tx("advance.availableNow", "Available for an advance"), summary?.availableAmount === agreementAvailable ? null : summary?.availableAmount],
      [tx("advance.plafondAvailable", "Plafond available"), summary?.plafondAvailableAmount],
    ] as [string, number | null | undefined][]
  ).filter(([, value]) => hasValue(value));

  const lines = summary?.documents ?? [];
  const showLineMax = lines.some((line) => hasValue(line.maxAmount));

  return (
    <section className="mt-3" aria-labelledby="advance-summary-title" aria-busy={isLoading}>
      <h3 className="h6 mb-3" id="advance-summary-title">
        {tx("advance.summary", "Summary")}
      </h3>
      {!complete ? (
        <p className="small text-body-secondary mb-0">{tx("advance.summaryPrompt", "Select invoices and enter an amount and a value date to check this advance.")}</p>
      ) : isLoading ? (
        <div className="d-flex align-items-center gap-2 small text-body-secondary" role="status">
          <span className="spinner-border spinner-border-sm" aria-hidden="true" />
          {tx("advance.summaryLoading", "Checking the advance…")}
        </div>
      ) : error ? (
        <div className="alert alert-danger mb-0" role="alert">
          {factoringProblemMessage(error, tx("advance.summaryError", "This advance couldn't be checked."))}
        </div>
      ) : (
        summary && (
          <>
            <ApiMessages messages={summary.messages} />
            {limits.length > 0 && (
              <dl className="app-documents-totals">
                {limits.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{money(value, currencyId)}</dd>
                  </div>
                ))}
              </dl>
            )}
            {showCosts && (
              <dl className="app-documents-totals">
                {(
                  [
                    [tx("advance.net", "Net amount"), summary.netAmount],
                    [tx("advance.interest", "Interest"), summary.interestAmount],
                    [tx("advance.commission", "Commission"), summary.commissionAmount],
                    [tx("advance.discount", "Discount"), summary.discountAmount],
                    [tx("advance.tax", "Tax"), summary.taxAmount],
                    [tx("advance.isuc", "ISUC"), summary.isucAmount],
                    [tx("advance.regularization", "Regularization"), summary.regularizationAmount],
                    [tx("advance.netCost", "Net cost"), summary.netCost],
                  ] as [string, number | null | undefined][]
                ).map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd className={hasValue(value) ? "" : "text-body-secondary"}>{money(value, currencyId) ?? unavailable}</dd>
                  </div>
                ))}
              </dl>
            )}
            {lines.length > 0 && (showCosts || showLineMax) && (
              <div className="table-responsive mt-3">
                <table className="table table-sm align-middle mb-0">
                  <thead>
                    <tr className="small text-body-secondary">
                      <th scope="col">{tx("documents.invoice", "Invoice")}</th>
                      {showLineMax && <th scope="col" className="text-end">{tx("advance.lineMax", "Maximum")}</th>}
                      {showCosts && <th scope="col" className="text-end">{tx("advance.title", "Advance")}</th>}
                      {showCosts && <th scope="col" className="text-end">{tx("advance.net", "Net amount")}</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, i) => (
                      <tr key={line.documentId ?? i}>
                        <td>{line.invoiceNumber ?? "—"}</td>
                        {showLineMax && <td className="text-end text-nowrap">{money(line.maxAmount, currencyId) ?? unavailable}</td>}
                        {showCosts && <td className="text-end text-nowrap">{money(line.advanceAmount, currencyId) ?? unavailable}</td>}
                        {showCosts && <td className="text-end text-nowrap">{money(line.netAmount, currencyId) ?? unavailable}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="small text-body-secondary mt-3 mb-0">
              {!showCosts && !hasMessages && <>{tx("advance.costLater", "The cost can't be shown before you request the advance.")} </>}
              {tx("advance.finalCheck", "The final check happens when you request it, so it can still be refused.")}
            </p>
          </>
        )
      )}
    </section>
  );
}

export default AdvanceCost;
