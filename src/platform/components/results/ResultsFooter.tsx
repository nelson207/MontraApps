import Pagination from "@platform/components/ui/Pagination";
import { pageRange } from "./resultsModel";

// "1–25 of 142" + page buttons; nothing when there are no results.
function ResultsFooter({
  page,
  pageSize,
  total,
  onPageChange,
  label,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  /** Accessible name of the page buttons, e.g. "Task pages" */
  label: string;
}) {
  if (total === 0) return null;
  const range = pageRange(page, pageSize, total);

  return (
    <div className="app-results-footer">
      <small className="text-body-secondary">
        {range.first}–{range.last} of {total}
      </small>
      <Pagination page={range.page} pageCount={range.pageCount} onPageChange={onPageChange} ariaLabel={label} />
    </div>
  );
}

export default ResultsFooter;
