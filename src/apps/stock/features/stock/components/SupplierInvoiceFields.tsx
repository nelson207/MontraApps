import { useState } from "react";
import InputField from "@platform/components/ui/InputField";
import SelectField from "@platform/components/ui/SelectField";
import type { HierarchyNode } from "@platform/features/workContext/hierarchy";
import { useUnitOptions } from "@platform/features/workContext/hooks/useHierarchyOptions";
import { rememberNodes } from "@platform/features/workContext/nodeLabels";
import type { StockErrors } from "../model/validation";

type Props = {
  /** The credit intermediary whose suppliers are offered (working context) */
  intermediaryId: string;
  supplier: HierarchyNode | null;
  invoiceNumber: string;
  onChange: (changes: { supplier?: HierarchyNode; invoiceNumber?: string }) => void;
  errors: StockErrors;
};

// Step 2: the supplier selling the vehicle (same lazy, searchable list as the working context)
// and the number of its invoice.
function SupplierInvoiceFields({ intermediaryId, supplier, invoiceNumber, onChange, errors }: Props) {
  const [search, setSearch] = useState("");
  const suppliers = useUnitOptions(intermediaryId, search);

  return (
    <div className="row gx-3">
      <div className="col-md-7">
        <SelectField
          id="stock-supplier"
          label="Supplier"
          value={supplier?.id}
          selectedLabel={supplier?.name}
          placeholder="Select the supplier"
          options={suppliers.items.map((n) => ({ value: n.id, label: n.name }))}
          isLoading={suppliers.isLoading}
          onSearchChange={setSearch}
          hasMore={suppliers.hasMore}
          isLoadingMore={suppliers.isLoadingMore}
          onLoadMore={suppliers.loadMore}
          invalidMessage={errors.supplier}
          onChange={(e) => {
            const node = suppliers.items.find((n) => String(n.id) === e.target.value);
            if (!node) return;
            rememberNodes("unit", [node]);
            onChange({ supplier: node });
          }}
        />
      </div>
      <div className="col-md-5">
        <InputField
          id="stock-invoice"
          label="Invoice number"
          required
          placeholder="e.g. FT 2026/123"
          value={invoiceNumber}
          onChange={(e) => onChange({ invoiceNumber: e.target.value })}
          invalidMessage={errors.invoiceNumber}
        />
      </div>
    </div>
  );
}

export default SupplierInvoiceFields;
