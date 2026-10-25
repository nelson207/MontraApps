import type { Upcoming } from "../insightsModel";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Dated items coming up (e.g. hearings): a list, not a chart.
function UpcomingList({ upcoming }: { upcoming: Upcoming }) {
  return (
    <section className="app-viz-card p-3 h-100" aria-label={upcoming.title}>
      <h3 className="app-viz-title mb-3">{upcoming.title}</h3>
      {upcoming.rows.length === 0 ? (
        <p className="small text-body-secondary mb-0">Nothing coming up.</p>
      ) : (
        <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
          {upcoming.rows.map((row) => {
            const [, m, d] = row.date.slice(0, 10).split("-").map(Number);
            return (
              <li key={row.id} className="d-flex align-items-center gap-3">
                <span className="app-date-chip" aria-hidden="true">
                  <span className="d-block fw-bold">{d}</span>
                  <span className="d-block small">{MONTHS[m - 1]}</span>
                </span>
                <span className="min-w-0">
                  <span className="d-block fw-semibold text-truncate">{row.title}</span>
                  <span className="d-block small text-body-secondary text-truncate">
                    {row.detail} · {d} {MONTHS[m - 1]}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default UpcomingList;
