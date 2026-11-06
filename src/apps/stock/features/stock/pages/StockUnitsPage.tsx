import { useState } from "react";
import { Link } from "react-router-dom";
import StockUnitsTable from "../components/StockUnitsTable";
import { useStockText } from "../stockText";

// All the dealer's stock units, on every contract (ended ones too).
function StockUnitsPage() {
  const tx = useStockText();
  const [page, setPage] = useState(1);

  return (
    <div className="card shadow-sm border-0">
      <div className="card-body p-3 p-lg-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <h2 className="h5 mb-0">{tx("units.title", "Stock units")}</h2>
          <Link to="/stock/new" className="btn btn-primary">
            <i className="bi bi-plus-lg me-2" aria-hidden="true" />
            {tx("add.newUnit", "New stock unit")}
          </Link>
        </div>
        <StockUnitsTable page={page} onPageChange={setPage} />
      </div>
    </div>
  );
}

export default StockUnitsPage;
