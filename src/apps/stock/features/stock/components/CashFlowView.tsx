import type { StockCashFlowDto } from "@platform/api/generated/MontraPOSApi";
import { useContractCashFlow, useUnitCashFlow } from "../api/stockApi";
import { useStockFormat } from "../model/format";
import { useStockText } from "../stockText";
import { Loading, LoadProblem } from "./StockStates";

// A cash flow exactly as the API returns it: nothing is added up, recalculated or adjusted, and a
// missing amount stays missing ("—"), never 0.

function CashFlowTables({ flow }: { flow: StockCashFlowDto }) {
  const tx = useStockText();
  const { money, date, rate } = useStockFormat();
  const currency = flow.currencyId;
  const amount = (value: number | null | undefined) => money(value, currency) ?? "—";
  const flows = flow.flows ?? [];
  const others = flow.otherFlows ?? [];

  const summary: [string, string][] = [
    [tx("cashFlow.initialDate", "Initial date"), date(flow.initialDate) || "—"],
    [tx("cashFlow.finalDate", "Final date"), date(flow.finalDate) || "—"],
    [tx("cashFlow.rate", "Rate"), rate(flow.rate) ?? "—"],
    [tx("cashFlow.capital", "Capital"), amount(flow.capital)],
    [tx("cashFlow.plafond", "Plafond"), amount(flow.plafondAmount)],
    [tx("cashFlow.totalCapital", "Total capital"), amount(flow.totalCapital)],
    [tx("cashFlow.totalInterest", "Total interest"), amount(flow.totalInterest)],
    [tx("cashFlow.totalExpenses", "Total expenses"), amount(flow.totalExpenses)],
    [tx("cashFlow.totalTaxes", "Total taxes"), amount(flow.totalTaxes)],
    [tx("cashFlow.totalWithoutTaxes", "Total without taxes"), amount(flow.totalWithoutTaxes)],
    [tx("cashFlow.totalWithTaxes", "Total with taxes"), amount(flow.totalWithTaxes)],
  ];

  return (
    <>
      <dl className="row small mb-3">
        {summary.map(([label, value]) => (
          <div className="col-6 col-md-4 col-xl-3 mb-2" key={label}>
            <dt className="fw-normal text-body-secondary">{label}</dt>
            <dd className="fw-semibold mb-0">{value}</dd>
          </div>
        ))}
      </dl>

      {flows.length === 0 && others.length === 0 && <p className="text-body-secondary mb-0">{tx("cashFlow.empty", "There are no cash flows yet.")}</p>}

      {flows.length > 0 && (
        <div className="table-responsive mb-3">
          <table className="table table-sm align-middle mb-0">
            <thead>
              <tr className="small text-body-secondary">
                <th scope="col">#</th>
                <th scope="col">{tx("cashFlow.valueDate", "Value date")}</th>
                <th scope="col">{tx("cashFlow.invoiceDate", "Invoice date")}</th>
                <th scope="col" className="text-end">{tx("cashFlow.capital", "Capital")}</th>
                <th scope="col" className="text-end">{tx("cashFlow.interest", "Interest")}</th>
                <th scope="col" className="text-end">{tx("cashFlow.tax", "Tax")}</th>
                <th scope="col" className="text-end">{tx("recap.amount", "Amount")}</th>
                <th scope="col" className="text-end">{tx("cashFlow.outstanding", "Outstanding capital")}</th>
              </tr>
            </thead>
            <tbody>
              {flows.map((line, i) => (
                <tr key={i}>
                  <td>{line.number ?? "—"}</td>
                  <td className="text-nowrap">{date(line.valueDate) || "—"}</td>
                  <td className="text-nowrap">{date(line.invoiceDate) || "—"}</td>
                  <td className="text-end text-nowrap">{amount(line.capital)}</td>
                  <td className="text-end text-nowrap">{amount(line.interest)}</td>
                  <td className="text-end text-nowrap">{amount(line.taxAmount)}</td>
                  <td className="text-end text-nowrap">{amount(line.amount)}</td>
                  <td className="text-end text-nowrap">{amount(line.outstandingCapital)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {others.length > 0 && (
        <>
          <h4 className="h6">{tx("cashFlow.other", "Other flows")}</h4>
          <div className="table-responsive">
            <table className="table table-sm align-middle mb-0">
              <thead>
                <tr className="small text-body-secondary">
                  <th scope="col">{tx("cashFlow.valueDate", "Value date")}</th>
                  <th scope="col" className="text-end">{tx("cashFlow.expense", "Expense")}</th>
                  <th scope="col" className="text-end">{tx("cashFlow.tax", "Tax")}</th>
                  <th scope="col" className="text-end">{tx("cashFlow.withTaxes", "With taxes")}</th>
                </tr>
              </thead>
              <tbody>
                {others.map((line, i) => (
                  <tr key={i}>
                    <td className="text-nowrap">{date(line.valueDate) || "—"}</td>
                    <td className="text-end text-nowrap">{amount(line.expenseAmount)}</td>
                    <td className="text-end text-nowrap">{amount(line.taxAmount)}</td>
                    <td className="text-end text-nowrap">{amount(line.amountWithTaxes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

type Read = { currentData?: StockCashFlowDto; isError: boolean; error?: unknown; refetch: () => unknown };

function CashFlowSection({ read }: { read: Read }) {
  const tx = useStockText();
  return (
    <section>
      <h3 className="h6 mb-3">{tx("cashFlow.title", "Cash flow")}</h3>
      {read.isError ? (
        <LoadProblem error={read.error} fallback={tx("cashFlow.loadError", "The cash flow couldn't be loaded. Try again in a moment.")} onRetry={() => read.refetch()} />
      ) : !read.currentData ? (
        <Loading />
      ) : (
        <CashFlowTables flow={read.currentData} />
      )}
    </section>
  );
}

export const UnitCashFlow = ({ id }: { id: string }) => <CashFlowSection read={useUnitCashFlow(id)} />;

export const ContractCashFlow = ({ id }: { id: string }) => <CashFlowSection read={useContractCashFlow(id)} />;
