import { useState } from "react";
import { Link } from "react-router-dom";
import Pagination from "@platform/components/ui/Pagination";
import { useStockContracts } from "../api/stockApi";
import AgreementTerms from "../components/AgreementTerms";
import { Loading, LoadProblem } from "../components/StockStates";
import { useStockText } from "../stockText";

const PAGE_SIZE = 12;

// The dealer's active financing agreements, newest first. The login user's entity decides which.
function AgreementsPage() {
  const tx = useStockText();
  const [page, setPage] = useState(1);
  const contracts = useStockContracts(page, PAGE_SIZE);
  const items = contracts.currentData?.items ?? [];
  const total = contracts.currentData?.totalCount ?? 0;

  return (
    <div className="card shadow-sm border-0">
      <div className="card-body p-3 p-lg-4">
        <h2 className="h5 mb-3">{tx("agreements.title", "Agreements")}</h2>

        {contracts.isError ? (
          <LoadProblem error={contracts.error} fallback={tx("agreements.loadError", "The agreements couldn't be loaded. Try again in a moment.")} onRetry={contracts.refetch} />
        ) : !contracts.currentData ? (
          <Loading />
        ) : items.length === 0 ? (
          <div className="text-center text-body-secondary py-5">{tx("agreements.empty", "You have no active agreements. Contact the financial company to set one up.")}</div>
        ) : (
          <>
            <div className="row g-3">
              {items.map((contract) => (
                <div className="col-12 col-lg-6 col-xxl-4" key={contract.id}>
                  <article className="border rounded-3 p-3 h-100 d-flex flex-column">
                    <h3 className="h6 mb-0 fw-semibold">{contract.description || contract.companyAbbreviation}</h3>
                    <span className="small text-body-secondary">
                      {contract.number} · {contract.companyAbbreviation}
                    </span>
                    <span className="d-block">
                      <AgreementTerms contract={contract} />
                    </span>
                    {!!contract.suppliers?.length && (
                      <p className="small text-body-secondary mt-3 mb-0">
                        {tx("add.supplier", "Supplier")}: {contract.suppliers.map((supplier) => supplier.name).join(", ")}
                      </p>
                    )}
                    <div className="d-flex flex-wrap gap-2 mt-auto pt-3">
                      {contract.canAddStock && (
                        <Link to="/stock/new" state={{ contract }} className="btn btn-primary btn-sm">
                          <i className="bi bi-plus-lg me-1" aria-hidden="true" />
                          {tx("agreements.addStock", "Add stock")}
                        </Link>
                      )}
                      <Link to={`/stock/agreements/${encodeURIComponent(contract.id ?? "")}`} state={{ contract }} className="btn btn-outline-secondary btn-sm">
                        {tx("agreements.open", "Details and cash flow")}
                      </Link>
                    </div>
                  </article>
                </div>
              ))}
            </div>
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3">
              <span className="small text-body-secondary">{tx("agreements.count", "Total: {{count}}", { count: total })}</span>
              <Pagination page={page} pageCount={Math.ceil(total / PAGE_SIZE)} onPageChange={setPage} ariaLabel={tx("agreements.pages", "Agreement pages")} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AgreementsPage;
