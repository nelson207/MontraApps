type Props = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  ariaLabel?: string;
};

/** Pages to show: first, last, and a window around the current one, with gaps as null. */
function pageWindow(page: number, pageCount: number): (number | null)[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? [null, p] : [p]));
}

// Bootstrap .pagination with Previous / numbered pages / Next.
function Pagination({ page, pageCount, onPageChange, ariaLabel = "Pagination" }: Props) {
  if (pageCount <= 1) return null;

  return (
    <nav aria-label={ariaLabel}>
      <ul className="pagination pagination-sm mb-0">
        <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
          <button
            type="button"
            className="page-link"
            aria-label="Previous page"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <i className="bi bi-chevron-left" />
          </button>
        </li>

        {pageWindow(page, pageCount).map((p, i) =>
          p === null ? (
            <li key={`gap-${i}`} className="page-item disabled" aria-hidden="true">
              <span className="page-link">…</span>
            </li>
          ) : (
            <li key={p} className={`page-item ${p === page ? "active" : ""}`}>
              <button
                type="button"
                className="page-link"
                aria-current={p === page ? "page" : undefined}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            </li>
          ),
        )}

        <li className={`page-item ${page >= pageCount ? "disabled" : ""}`}>
          <button
            type="button"
            className="page-link"
            aria-label="Next page"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pageCount}
          >
            <i className="bi bi-chevron-right" />
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default Pagination;
