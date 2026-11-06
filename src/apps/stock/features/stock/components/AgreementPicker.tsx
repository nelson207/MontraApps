import Pagination from "@platform/components/ui/Pagination";
import type { StockContractDto } from "@platform/api/generated/MontraPOSApi";
import { useSingleOptionDefault } from "@platform/hooks/useSingleOptionDefault";
import { useStockContracts } from "../api/stockApi";
import { useStockText } from "../stockText";
import AgreementTerms from "./AgreementTerms";
import { LoadProblem } from "./StockStates";

type Props = {
  value: StockContractDto | null;
  onChange: (contract: StockContractDto) => void;
  page: number;
  onPageChange: (page: number) => void;
  invalidMessage?: string;
};

const PAGE_SIZE = 6;

// The dealer's contracts as radio cards, a page at a time: the supplier-side company, the plafond and
// the terms. One that can't take stock can't be chosen. The choice is kept while paging.
function AgreementPicker({ value, onChange, page, onPageChange, invalidMessage }: Props) {
  const tx = useStockText();
  const contracts = useStockContracts(page, PAGE_SIZE);
  const items = contracts.currentData?.items ?? [];

  // Only one agreement can take stock (on the whole list, not just this page): it is chosen by default
  const choosable = items.filter((contract) => contract.canAddStock);
  const isWholeList = !!contracts.currentData && (contracts.currentData.totalCount ?? 0) === items.length;
  useSingleOptionDefault(!value && isWholeList && choosable.length === 1 ? (choosable[0].id ?? null) : null, () => onChange(choosable[0]));

  if (contracts.isError)
    return <LoadProblem error={contracts.error} fallback={tx("agreements.loadError", "The agreements couldn't be loaded. Try again in a moment.")} onRetry={contracts.refetch} />;

  if (!contracts.currentData)
    return (
      <div className="row g-3" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div className="col-12 col-lg-4" key={i}>
            <div className="app-agreement-card placeholder-glow">
              <span className="placeholder col-7 mb-2" />
              <span className="placeholder col-4 mb-3" />
              <span className="placeholder col-12" />
            </div>
          </div>
        ))}
      </div>
    );

  if (items.length === 0)
    return (
      <div className="alert alert-warning mb-0" role="status">
        {tx("agreements.empty", "You have no active agreements. Contact the financial company to set one up.")}
      </div>
    );

  const total = contracts.currentData.totalCount ?? 0;

  return (
    <fieldset>
      <legend className="visually-hidden">{tx("agreements.agreement", "Agreement")}</legend>
      <div className="row g-3">
        {items.map((contract) => {
          const id = `agreement-${contract.id}`;
          const blocked = !contract.canAddStock;
          return (
            <div className="col-12 col-lg-4" key={contract.id}>
              <input
                type="radio"
                className="btn-check"
                name="agreement"
                id={id}
                checked={value?.id === contract.id}
                disabled={blocked}
                onChange={() => onChange(contract)}
                aria-describedby={invalidMessage ? "agreement-feedback" : undefined}
              />
              <label className={`app-agreement-card ${invalidMessage ? "is-invalid" : ""}`} htmlFor={id}>
                <span className="d-flex align-items-start justify-content-between gap-2">
                  <span className="min-w-0">
                    <span className="d-block fw-semibold text-truncate">{contract.description || contract.companyAbbreviation}</span>
                    <span className="d-block small text-body-secondary">
                      {contract.number} · {contract.companyAbbreviation}
                    </span>
                  </span>
                  <i className="bi bi-check-circle-fill app-agreement-check" aria-hidden="true" />
                </span>
                <AgreementTerms contract={contract} />
                {blocked && <span className="d-block small text-danger mt-2">{tx("agreements.cantAdd", "Can't take new stock")}</span>}
              </label>
            </div>
          );
        })}
      </div>
      {invalidMessage && (
        <div id="agreement-feedback" className="invalid-feedback d-block">
          {invalidMessage}
        </div>
      )}
      <div className="d-flex justify-content-end mt-3">
        <Pagination page={page} pageCount={Math.ceil(total / PAGE_SIZE)} onPageChange={onPageChange} ariaLabel={tx("agreements.pages", "Agreement pages")} />
      </div>
    </fieldset>
  );
}

export default AgreementPicker;
