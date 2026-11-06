import { Link } from "react-router-dom";
import Pagination from "@platform/components/ui/Pagination";
import { useStockUnits } from "../api/stockApi";
import { useStockFormat } from "../model/format";
import { useStockText } from "../stockText";
import { Loading, LoadProblem, StateBadge } from "./StockStates";

const PAGE_SIZE = 20;

// A page of stock units from the API; all contracts, or one (ended contracts included).
function StockUnitsTable({ contractId, page, onPageChange }: { contractId?: string; page: number; onPageChange: (page: number) => void }) {
  const tx = useStockText();
  const { money, date } = useStockFormat();
  const units = useStockUnits({ contractId, page, pageSize: PAGE_SIZE });
  const rows = units.currentData?.items ?? [];
  const total = units.currentData?.totalCount ?? 0;

  if (units.isError) return <LoadProblem error={units.error} fallback={tx("units.loadError", "The stock units couldn't be loaded. Try again in a moment.")} onRetry={units.refetch} />;
  if (!units.currentData) return <Loading />;
  if (rows.length === 0) return <div className="text-center text-body-secondary py-5">{tx("units.empty", "There are no stock units yet.")}</div>;

  return (
    <>
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr className="small text-body-secondary">
              <th scope="col">{tx("units.unit", "Unit")}</th>
              <th scope="col">{tx("recap.vehicle", "Vehicle")}</th>
              <th scope="col" className="d-none d-lg-table-cell">{tx("add.supplier", "Supplier")}</th>
              <th scope="col" className="d-none d-md-table-cell">{tx("agreements.agreement", "Agreement")}</th>
              <th scope="col" className="text-end">{tx("recap.amount", "Amount")}</th>
              <th scope="col" className="d-none d-sm-table-cell">{tx("units.due", "Due")}</th>
              <th scope="col">{tx("recap.state", "State")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((unit) => (
              <tr key={unit.id}>
                <td className="fw-semibold text-nowrap">
                  <Link to={`/stock/units/${encodeURIComponent(unit.id ?? "")}`}>#{unit.item ?? "—"}</Link>
                </td>
                <td>
                  <div>{[unit.brand, unit.model].filter(Boolean).join(" ") || "—"}</div>
                  <div className="small text-body-secondary text-nowrap">{[unit.licencePlate, unit.vin].filter(Boolean).join(" · ")}</div>
                </td>
                <td className="d-none d-lg-table-cell small">
                  {unit.supplierName}
                  <div className="text-body-secondary">{unit.invoiceNumber}</div>
                </td>
                <td className="d-none d-md-table-cell small">{unit.contractNumber}</td>
                <td className="text-end text-nowrap">{money(unit.amount, unit.currencyId) ?? "—"}</td>
                <td className="d-none d-sm-table-cell small text-nowrap">{date(unit.dueDate) || "—"}</td>
                <td>
                  <StateBadge state={unit.state} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3">
        <span className="small text-body-secondary">{tx("units.count", "Total: {{count}}", { count: total })}</span>
        <Pagination page={page} pageCount={Math.ceil(total / PAGE_SIZE)} onPageChange={onPageChange} ariaLabel={tx("units.pages", "Stock unit pages")} />
      </div>
    </>
  );
}

export default StockUnitsTable;
