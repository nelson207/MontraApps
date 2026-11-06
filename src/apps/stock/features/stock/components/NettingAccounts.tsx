import type { StockNettingAccountDto } from "@platform/api/generated/MontraPOSApi";
import { useStockFormat } from "../model/format";
import { useStockText } from "../stockText";

// The dealer's current accounts on a contract. Its balance is totalCapital. A missing amount says
// "unavailable", never 0, and a balance that couldn't be read gets a warning.
function NettingAccounts({ accounts }: { accounts: StockNettingAccountDto[] }) {
  const tx = useStockText();
  const { money } = useStockFormat();
  const unavailable = tx("common.unavailable", "unavailable");

  return (
    <div className="row g-3">
      {accounts.map((account) => (
        <div className="col-12 col-lg-6" key={account.id}>
          <article className="border rounded-3 p-3 h-100">
            <h4 className="h6 mb-0">{tx("netting.account", "Account {{number}}", { number: account.number ?? "—" })}</h4>
            {account.relation && <span className="small text-body-secondary">{account.relation}</span>}
            <dl className="row small mb-0 mt-2">
              {(
                [
                  [tx("netting.balance", "Balance"), account.totalCapital],
                  [tx("cashFlow.plafond", "Plafond"), account.plafondAmount],
                  [tx("cashFlow.totalInterest", "Total interest"), account.totalInterest],
                  [tx("cashFlow.totalWithTaxes", "Total with taxes"), account.totalWithTaxes],
                ] as [string, number | null | undefined][]
              ).map(([label, value]) => (
                <div className="col-6 mb-2" key={label}>
                  <dt className="fw-normal text-body-secondary">{label}</dt>
                  <dd className="fw-semibold mb-0">{money(value, account.currencyId) ?? unavailable}</dd>
                </div>
              ))}
            </dl>
            {(account.totalCapital === null || account.totalCapital === undefined) && (
              <div className="alert alert-warning py-2 small mb-0" role="alert">
                {tx("netting.unreadable", "This account's balance couldn't be read.")}
              </div>
            )}
          </article>
        </div>
      ))}
    </div>
  );
}

export default NettingAccounts;
