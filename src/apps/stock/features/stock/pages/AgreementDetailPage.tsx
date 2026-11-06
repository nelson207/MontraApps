import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import type { StockContractDto } from "@platform/api/generated/MontraPOSApi";
import { useNettingAccounts } from "../api/stockApi";
import AgreementTerms from "../components/AgreementTerms";
import { ContractCashFlow } from "../components/CashFlowView";
import NettingAccounts from "../components/NettingAccounts";
import { Loading, LoadProblem } from "../components/StockStates";
import StockUnitsTable from "../components/StockUnitsTable";
import { useStockText } from "../stockText";

// One contract: its terms (when coming from its card: the API has no GET for one contract), netting
// accounts, cash flow and units. Paying is offered only when it has a netting account.
function AgreementDetailPage() {
  const tx = useStockText();
  const { id = "" } = useParams();
  const contract = (useLocation().state as { contract?: StockContractDto } | null)?.contract;
  const accounts = useNettingAccounts(id);
  const [unitsPage, setUnitsPage] = useState(1);
  const list = accounts.currentData ?? [];

  return (
    <div className="card shadow-sm border-0">
      <div className="card-body p-3 p-lg-4 d-flex flex-column gap-4">
        <div>
          <Link to="/stock/agreements" className="small">
            <i className="bi bi-arrow-left me-1" aria-hidden="true" />
            {tx("agreements.title", "Agreements")}
          </Link>
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-2">
            <h2 className="h5 mb-0">
              {contract ? tx("units.onAgreement", "Agreement {{number}}", { number: contract.number ?? "" }) : tx("agreements.agreement", "Agreement")}
            </h2>
            <div className="d-flex flex-wrap gap-2">
              {contract?.canAddStock && (
                <Link to="/stock/new" state={{ contract }} className="btn btn-outline-secondary">
                  <i className="bi bi-plus-lg me-2" aria-hidden="true" />
                  {tx("agreements.addStock", "Add stock")}
                </Link>
              )}
              {list.length > 0 && (
                <Link to={`/stock/agreements/${encodeURIComponent(id)}/pay`} className="btn btn-primary">
                  <i className="bi bi-cash-coin me-2" aria-hidden="true" />
                  {tx("pay.action", "Pay stocks")}
                </Link>
              )}
            </div>
          </div>
          {contract && (
            <div className="mt-2">
              <AgreementTerms contract={contract} />
            </div>
          )}
        </div>

        <section>
          <h3 className="h6 mb-3">{tx("netting.title", "Netting accounts")}</h3>
          {accounts.isError ? (
            <LoadProblem error={accounts.error} fallback={tx("netting.loadError", "The netting accounts couldn't be loaded. Try again in a moment.")} onRetry={accounts.refetch} />
          ) : !accounts.currentData ? (
            <Loading />
          ) : list.length === 0 ? (
            <p className="text-body-secondary mb-0">{tx("netting.empty", "This agreement has no netting account, so stocks can't be paid from here.")}</p>
          ) : (
            <NettingAccounts accounts={list} />
          )}
        </section>

        <ContractCashFlow id={id} />

        <section>
          <h3 className="h6 mb-3">{tx("units.title", "Stock units")}</h3>
          <StockUnitsTable contractId={id} page={unitsPage} onPageChange={setUnitsPage} />
        </section>
      </div>
    </div>
  );
}

export default AgreementDetailPage;
