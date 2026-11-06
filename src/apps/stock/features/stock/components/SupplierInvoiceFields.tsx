import InputField from "@platform/components/ui/InputField";
import SelectField from "@platform/components/ui/SelectField";
import { supplierIdOf, type StockUnitDraft } from "../model/stockUnit";
import type { StockErrors } from "../model/validation";
import { useStockText } from "../stockText";

type Props = {
  draft: StockUnitDraft;
  onChange: (changes: { supplierInterventionId?: string; invoiceNumber?: string }) => void;
  errors: StockErrors;
  disabled?: boolean;
};

// Step 2: the importer on the contract (preselected when there is only one) and its invoice number.
function SupplierInvoiceFields({ draft, onChange, errors, disabled = false }: Props) {
  const tx = useStockText();
  const suppliers = draft.contract?.suppliers ?? [];

  return (
    <div className="row gx-3">
      <div className="col-md-7">
        <SelectField
          id="stock-supplier"
          label={tx("add.supplier", "Supplier")}
          required={suppliers.length > 1}
          value={supplierIdOf(draft) ?? undefined}
          placeholder={tx("add.selectSupplier", "Select the supplier")}
          options={suppliers.map((supplier) => ({ value: supplier.interventionId, label: supplier.name }))}
          disabled={disabled || suppliers.length <= 1}
          invalidMessage={errors.supplier}
          onChange={(e) => onChange({ supplierInterventionId: String(e.target.value) })}
        />
      </div>
      <div className="col-md-5">
        <InputField
          id="stock-invoice"
          label={tx("add.invoice", "Invoice number")}
          required
          placeholder={tx("add.invoiceExample", "e.g. FT 2026/123")}
          value={draft.invoiceNumber}
          disabled={disabled}
          onChange={(e) => onChange({ invoiceNumber: e.target.value })}
          invalidMessage={errors.invoiceNumber}
        />
      </div>
    </div>
  );
}

export default SupplierInvoiceFields;
