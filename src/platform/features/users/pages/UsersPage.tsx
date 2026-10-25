import { Link, useLocation, useNavigate } from "react-router-dom";
import FilterChips from "@platform/components/results/FilterChips";
import { ResultList, ResultRow } from "@platform/components/results/ResultList";
import ResultsFooter from "@platform/components/results/ResultsFooter";
import ResultsPanel from "@platform/components/results/ResultsPanel";
import ResultsToolbar from "@platform/components/results/ResultsToolbar";
import { useUrlFilters } from "@platform/hooks/useUrlFilters";
import { USERS_ACCESS } from "@app/users";
import { useGetUsersQuery } from "../api/usersApi";
import { useCanManageUsers } from "../useCanManageUsers";
import { useModuleLabel } from "@platform/features/layout/hooks/useModuleLabel";

const PAGE_SIZE = 10;

const { columns, filter: accessFilter } = USERS_ACCESS;

const initialsOf = (first: string, last: string) => `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();

// Administration → Users (every Montra app), in the shared results view: search, the app's access
// filter as chips (one at a time), server-paged rows; a row opens the user for editing.
function UsersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const flash = (location.state as { flash?: string } | null)?.flash;

  // In the URL (?q=&access=&page=) so the list comes back as it was left (Back, the form's links)
  const { get, set } = useUrlFilters();
  const search = get("q");
  const filter = get("access");
  const page = Math.max(1, Number(get("page")) || 1);


  const { currentData, isFetching, isError, error, refetch } = useGetUsersQuery({
    search,
    filter,
    page,
    pageSize: PAGE_SIZE,
  });

  const canManageUsers = useCanManageUsers();
  const moduleLabel = useModuleLabel();
  const total = currentData?.total ?? 0;
  const items = currentData?.items ?? [];
  const clear = () => set({ q: null, access: null });

  const toolbar = (
    <ResultsToolbar
      title={moduleLabel({ label: "Users" })}
      count={currentData ? total : undefined}
      search={{
        value: search,
        onChange: (value) => set({ q: value || null }),
        placeholder: "Search by name or e-mail",
        label: "Search users",
      }}
      actions={
        <Link to="/admin/users/new" className="btn btn-primary btn-sm text-nowrap">
          <i className="bi bi-person-plus" aria-hidden="true" />
          <span className="d-none d-sm-inline ms-1">New user</span>
        </Link>
      }
    >
      <FilterChips
        groups={[
          {
            label: accessFilter.allLabel,
            single: true,
            options: accessFilter.options,
            selected: filter ? [filter] : [],
            onChange: (next) => set({ access: next[0] ?? null }),
          },
        ]}
      />
    </ResultsToolbar>
  );

  if (canManageUsers === false) {
    return (
      <div className="alert alert-warning mb-0" role="alert">
        You can't manage users.
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-3">
      {flash && (
        <div className="alert alert-success alert-dismissible d-flex gap-2 mb-0" role="status">
          <i className="bi bi-check-circle-fill" />
          <span>{flash}</span>
          <button
            type="button"
            className="btn-close"
            aria-label="Dismiss"
            onClick={() => navigate(location.pathname + location.search, { replace: true, state: null })}
          />
        </div>
      )}

      <ResultsPanel
        toolbar={toolbar}
        status={{
          isLoading: !currentData && isFetching,
          isError,
          error,
          errorText: "Couldn't load users.",
          onRetry: () => refetch(),
          isEmpty: items.length === 0,
          empty: { icon: "bi-people", text: "No users match your filters.", onClear: search || filter ? clear : undefined },
        }}
        footer={
          <ResultsFooter page={page} pageSize={PAGE_SIZE} total={total} onPageChange={(next) => set({ page: next > 1 ? String(next) : null })} label="Users pages" />
        }
      >
        <ResultList label={moduleLabel({ label: "Users" })}>
          {items.map((user) => (
            <ResultRow
              key={user.id}
              to={`/admin/users/${user.id}`}
              accent={user.active ? undefined : "secondary"}
              leading={
                <span className={`app-avatar ${user.active ? "" : "opacity-50"}`} aria-hidden="true">
                  {initialsOf(user.firstName, user.lastName)}
                </span>
              }
              title={`${user.firstName} ${user.lastName}`}
              secondary={user.email}
              meta={columns.map((column) => (
                <span title={column.header}>{column.cell(user)}</span>
              ))}
              trailing={
                user.active ? (
                  <span className="badge rounded-pill bg-success-subtle text-success-emphasis">Active</span>
                ) : (
                  <span className="badge rounded-pill bg-secondary-subtle text-secondary-emphasis">Inactive</span>
                )
              }
            />
          ))}
        </ResultList>
      </ResultsPanel>
    </div>
  );
}

export default UsersPage;
