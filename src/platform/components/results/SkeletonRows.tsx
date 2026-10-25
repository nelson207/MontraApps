// Loading placeholder shaped like result rows
function SkeletonRows({ count = 5 }: { count?: number }) {
  return (
    <ul className="list-unstyled app-results-list placeholder-glow mb-0" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="app-results-row is-static">
          <span className="app-results-accent" />
          <span className="placeholder col-5" />
          <span className="placeholder col-2 ms-auto" />
        </li>
      ))}
    </ul>
  );
}

export default SkeletonRows;
