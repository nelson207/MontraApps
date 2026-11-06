import { Link, useParams } from "react-router-dom";
import { useStockUnit } from "../api/stockApi";
import { UnitCashFlow } from "../components/CashFlowView";
import { Loading, LoadProblem, StateBadge } from "../components/StockStates";
import { useStockFormat } from "../model/format";
import { useStockText } from "../stockText";

// One stock unit and its cash flow.
function StockUnitDetailPage() {
  const tx = useStockText();
  const { money, date } = useStockFormat();
  const { id = "" } = useParams();
  const read = useStockUnit(id);
  const unit = read.currentData;

  const rows: [string, string | number | null | undefined][] = unit
    ? [
        [tx("recap.vehicle", "Vehicle"), [unit.brand, unit.model].filter(Boolean).join(" ")],
        [tx("recap.vin", "VIN"), unit.vin],
        [tx("recap.plate", "License plate"), unit.licencePlate],
        [tx("recap.amount", "Amount"), money(unit.amount, unit.currencyId) ?? tx("common.unavailable", "unavailable")],
        [tx("add.supplier", "Supplier"), unit.supplierName],
        [tx("recap.invoice", "Invoice"), unit.invoiceNumber],
        [tx("units.begin", "Begin"), date(unit.beginDate)],
        [tx("units.due", "Due"), date(unit.dueDate)],
        [tx("units.end", "End"), date(unit.endDate)],
      ]
    : [];

  return (
    <div className="card shadow-sm border-0">
      <div className="card-body p-3 p-lg-4">
        <Link to="/stock/units" className="small">
          <i className="bi bi-arrow-left me-1" aria-hidden="true" />
          {tx("units.title", "Stock units")}
        </Link>
        {read.isError ? (
          <div className="mt-3">
            <LoadProblem error={read.error} fallback={tx("units.loadOneError", "The stock unit couldn't be loaded. Try again in a moment.")} onRetry={read.refetch} />
          </div>
        ) : !unit ? (
          <Loading />
        ) : (
          <>
            <div className="d-flex flex-wrap align-items-center gap-2 mt-2 mb-3">
              <h2 className="h5 mb-0">{tx("units.heading", "Unit #{{item}}", { item: unit.item ?? "—" })}</h2>
              <StateBadge state={unit.state} />
              {unit.contractId && (
                <Link to={`/stock/agreements/${encodeURIComponent(unit.contractId)}`} className="small ms-auto">
                  {tx("units.onAgreement", "Agreement {{number}}", { number: unit.contractNumber ?? "" })}
                </Link>
              )}
            </div>
            <dl className="row small mb-4">
              {rows
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div className="col-6 col-md-4 col-xl-3 mb-2" key={label}>
                    <dt className="fw-normal text-body-secondary">{label}</dt>
                    <dd className="fw-semibold mb-0 text-break">{value}</dd>
                  </div>
                ))}
            </dl>
            <UnitCashFlow id={id} />
          </>
        )}
      </div>
    </div>
  );
}

export default StockUnitDetailPage;
