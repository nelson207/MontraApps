import { useId, useState, type ReactNode } from "react";

export type TableView = { headers: string[]; rows: (string | number)[][] };

type Props = {
  title: string;
  subtitle?: string;
  /** The accessible twin of the chart (every chart has one) */
  table: TableView;
  children: ReactNode;
};

// Frame of every insights chart: title, subtitle and a Chart / Table toggle.
function ChartCard({ title, subtitle, table, children }: Props) {
  const [showTable, setShowTable] = useState(false);
  const titleId = useId();

  return (
    <figure className="app-viz-card p-3 mb-0 d-flex flex-column gap-3" aria-labelledby={titleId}>
      <div className="d-flex align-items-start gap-2">
        <div className="flex-grow-1 min-w-0">
          <h3 id={titleId} className="app-viz-title">
            {title}
          </h3>
          {subtitle && <p className="app-viz-subtitle">{subtitle}</p>}
        </div>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary flex-shrink-0"
          aria-pressed={showTable}
          onClick={() => setShowTable((v) => !v)}
        >
          <i className={`bi ${showTable ? "bi-bar-chart" : "bi-table"} me-1`} aria-hidden="true" />
          {showTable ? "Chart" : "Table"}
        </button>
      </div>

      {showTable ? (
        <div className="table-responsive">
          <table className="table table-sm mb-0">
            <thead>
              <tr>
                {table.headers.map((h, i) => (
                  <th key={h} scope="col" className={i > 0 ? "text-end" : undefined}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row) => (
                <tr key={String(row[0])}>
                  {row.map((cell, i) =>
                    i === 0 ? (
                      <th key={i} scope="row" className="fw-normal">
                        {cell}
                      </th>
                    ) : (
                      <td key={i} className="text-end app-tabular">
                        {cell}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        children
      )}
    </figure>
  );
}

export default ChartCard;
