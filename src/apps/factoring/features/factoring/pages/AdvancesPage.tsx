import { useState } from "react";
import { Link } from "react-router-dom";
import Pagination from "@platform/components/ui/Pagination";
import { useAdvances, useAgreements } from "../api/factoringApi";
import { LoadProblem, Loading } from "../components/FactoringStates";
import { useFactoringText } from "../factoringText";
import { useFactoringFormat } from "../model/format";
import { kindLabel } from "../model/factoring";

const PAGE_SIZE = 10;

// The dealer's advances. Each one's state is Accipiens' own name; its `status` is an abbreviation
// (e.g. INI), only shown should there be no name.
function AdvancesPage() {
  const tx = useFactoringText();
  const { money, date } = useFactoringFormat();
  const agreements = useAgreements();
  const [contractId, setContractId] = useState("");
  const [paging, setPaging] = useState({ contractId: "", page: 1 });
  const page = paging.contractId === contractId ? paging.page : 1;
  const { currentData, isFetching, isError, error, refetch } = useAdvances({ contractId: contractId || undefined, page, pageSize: PAGE_SIZE });

  const rows = currentData?.items ?? [];
  const pageCount = Math.ceil((currentData?.totalCount ?? 0) / PAGE_SIZE);
  const agreementOf = (id: string | undefined) => agreements.currentData?.find((agreement) => agreement.id === id);
  const label = (agreement: { kind?: "Factoring" | "Confirming"; financialInstitution?: string | null; number?: number | null }) =>
    [kindLabel(agreement.kind, tx), agreement.financialInstitution, agreement.number].filter((part) => part !== null && part !== undefined).join(" · ");

  return (
    <div className="card shadow-sm border-0">
      <div className="card-body p-3 p-lg-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <h2 className="h5 mb-0">{tx("advances.title", "Advances")}</h2>
          <Link to="/factoring/advance" className="btn btn-primary">
            <i className="bi bi-plus-lg me-2" aria-hidden="true" />
            {tx("advance.new", "New advance")}
          </Link>
        </div>

        <div className="row g-2 mb-3">
          <div className="col-12 col-lg-6">
            <label htmlFor="advances-agreement" className="visually-hidden">
              {tx("agreement.title", "Agreement")}
            </label>
            <select id="advances-agreement" className="form-select" value={contractId} onChange={(e) => setContractId(e.target.value)}>
              <option value="">{tx("advances.allAgreements", "All agreements")}</option>
              {(agreements.currentData ?? []).map((agreement) => (
                <option key={agreement.id} value={agreement.id}>
                  {label(agreement)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isError ? (
          <LoadProblem error={error} fallback={tx("advances.loadError", "The advances couldn't be loaded. Try again in a moment.")} onRetry={refetch} />
        ) : !currentData ? (
          <Loading />
        ) : (
          <>
            <div className="table-responsive" aria-busy={isFetching}>
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr className="small text-body-secondary">
                    <th scope="col">{tx("advances.number", "Advance")}</th>
                    <th scope="col" className="d-none d-md-table-cell">{tx("agreement.title", "Agreement")}</th>
                    <th scope="col">{tx("advance.valueDate", "Value date")}</th>
                    <th scope="col" className="text-end">{tx("invoices.amount", "Amount")}</th>
                    <th scope="col">{tx("advances.state", "State")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((advance) => {
                    const agreement = agreementOf(advance.contractId);
                    return (
                      <tr key={advance.id}>
                        <td className="fw-semibold text-nowrap">{advance.number ?? "—"}</td>
                        <td className="d-none d-md-table-cell small">{agreement ? label(agreement) : "—"}</td>
                        <td className="text-nowrap">{date(advance.valueDate) || "—"}</td>
                        <td className="text-end text-nowrap">{money(advance.amount, agreement?.currencyId) ?? "—"}</td>
                        <td>{advance.stateName ?? advance.status ?? "—"}</td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-body-secondary py-5">
                        {tx("advances.empty", "No advances yet. Request one from an agreement with money available.")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="d-flex justify-content-end mt-3">
              <Pagination page={page} pageCount={pageCount} onPageChange={(next) => setPaging({ contractId, page: next })} ariaLabel={tx("advances.pages", "Advances pages")} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdvancesPage;
