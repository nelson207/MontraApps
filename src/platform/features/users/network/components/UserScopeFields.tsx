import { useState } from "react";
import SelectField from "@platform/components/ui/SelectField";
import type { HierarchyNode } from "@platform/features/workContext/hierarchy";
import {
  useOrganizationOptions,
  useUnitOptions,
} from "@platform/features/workContext/hooks/useHierarchyOptions";
import { rememberNodes } from "@platform/features/workContext/nodeLabels";
import { scopeOf, type UserLevel, type UserScope } from "../userLevels";

type Props = {
  level: UserLevel;
  value: UserScope;
  onChange: (scope: UserScope) => void;
  errors: { intermediary: string | null; supplier: string | null };
};

// The part of the hierarchy a user is tied to, depending on their level:
// A → nothing to pick, B/C → credit intermediary, D/E → intermediary + supplier.
// Uses the same lazy, searchable lists as the working context.
function UserScopeFields({ level, value, onChange, errors }: Props) {
  const scope = scopeOf(level);
  const [search, setSearch] = useState({ intermediary: "", supplier: "" });

  const intermediaries = useOrganizationOptions(search.intermediary);
  const suppliers = useUnitOptions(
    scope === "supplier" ? (value.intermediary?.id ?? null) : null,
    search.supplier,
  );

  if (scope === "all") {
    return (
      <div className="alert alert-info d-flex gap-2 mb-0" role="status">
        <i className="bi bi-globe2" />
        <span>Level A users have access to <strong>all credit intermediaries</strong>.</span>
      </div>
    );
  }

  const pick = (nodes: HierarchyNode[], id: string) => nodes.find((n) => String(n.id) === id);

  return (
    <div className="row gx-3">
      <div className={scope === "supplier" ? "col-12 col-md-6" : "col-12"}>
        <SelectField
          id="user-intermediary"
          label="Credit intermediary"
          value={value.intermediary?.id}
          selectedLabel={value.intermediary?.name}
          placeholder="Select a credit intermediary"
          options={intermediaries.items.map((n) => ({ value: n.id, label: n.name }))}
          isLoading={intermediaries.isLoading}
          onSearchChange={(text) => setSearch((s) => ({ ...s, intermediary: text }))}
          hasMore={intermediaries.hasMore}
          isLoadingMore={intermediaries.isLoadingMore}
          onLoadMore={intermediaries.loadMore}
          invalidMessage={errors.intermediary}
          onChange={(e) => {
            const node = pick(intermediaries.items, e.target.value);
            if (!node) return;
            rememberNodes("organization", [node]);
            // A different intermediary invalidates the supplier
            onChange({ intermediary: node, supplier: null });
          }}
        />
      </div>

      {scope === "supplier" && (
        <div className="col-12 col-md-6">
          <SelectField
            id="user-supplier"
            label="Supplier"
            value={value.supplier?.id}
            selectedLabel={value.supplier?.name}
            placeholder={value.intermediary ? "Select a supplier" : "Select an intermediary first"}
            disabled={!value.intermediary}
            options={suppliers.items.map((n) => ({ value: n.id, label: n.name }))}
            isLoading={suppliers.isLoading}
            onSearchChange={(text) => setSearch((s) => ({ ...s, supplier: text }))}
            hasMore={suppliers.hasMore}
            isLoadingMore={suppliers.isLoadingMore}
            onLoadMore={suppliers.loadMore}
            invalidMessage={errors.supplier}
            onChange={(e) => {
              const node = pick(suppliers.items, e.target.value);
              if (!node) return;
              rememberNodes("unit", [node]);
              onChange({ ...value, supplier: node });
            }}
          />
        </div>
      )}
    </div>
  );
}

export default UserScopeFields;
