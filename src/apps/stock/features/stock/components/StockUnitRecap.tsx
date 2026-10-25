import { skipToken } from "@reduxjs/toolkit/query";
import {
  useGetEquipmentCategoriesQuery,
  useGetEquipmentStatesQuery,
  useGetEquipmentTypesQuery,
} from "@platform/features/equipment/api/equipmentApi";
import { labelOfCode } from "@platform/features/equipment/api/equipmentLists";
import { formatEuro, type Agreement, type StockUnitDraft } from "../model/stockUnit";

type Props = {
  draft: StockUnitDraft;
  agreement: Agreement | undefined;
  /** Show the supplier and invoice too (after submitting) */
  withInvoice?: boolean;
};

// Read-only summary of a stock unit: what was entered in step 1 (and step 2 once submitted).
// Empty optional fields are left out.
function StockUnitRecap({ draft, agreement, withInvoice = false }: Props) {
  const { equipment } = draft;
  // The same cached lists as the equipment detail
  const types = useGetEquipmentTypesQuery({});
  const states = useGetEquipmentStatesQuery();
  const categories = useGetEquipmentCategoriesQuery(
    equipment.equipmentTypeId ? { equipmentTypeId: equipment.equipmentTypeId } : skipToken,
  );

  const rows: [string, string | null | undefined][] = [
    ["Agreement", agreement ? `${agreement.financialCompany} · ${agreement.number}` : null],
    ["Vehicle", [equipment.brand, equipment.model].filter(Boolean).join(" ") || null],
    ["Version", equipment.version],
    ["Type", labelOfCode(types.data, equipment.equipmentTypeId)],
    ["Category", labelOfCode(categories.data, equipment.equipmentCategoryId)],
    ["State", labelOfCode(states.data, equipment.equipmentStateId)],
    ["VIN", equipment.vin],
    ["License plate", equipment.licencePlate],
    ["Registration", equipment.registrationDate?.slice(0, 10)],
    ["Description", equipment.description],
    ["Km", equipment.odometer != null ? `${equipment.odometer.toLocaleString("pt-PT")} km` : null],
    ["Engine size", equipment.enginesize != null ? `${equipment.enginesize} cc` : null],
    ["Doors", equipment.doors != null ? String(equipment.doors) : null],
    ["Amount", draft.amount ? formatEuro(draft.amount) : null],
    ...(withInvoice
      ? ([
          ["Supplier", draft.supplier?.name],
          ["Invoice", draft.invoiceNumber.trim()],
        ] as [string, string | undefined][])
      : []),
  ];

  return (
    <dl className="row small mb-0 app-stock-recap">
      {rows
        .filter(([, value]) => value)
        .map(([label, value]) => (
          <div className="col-6 col-lg-4 mb-2" key={label}>
            <dt className="fw-normal text-body-secondary">{label}</dt>
            <dd className="fw-semibold mb-0 text-break">{value}</dd>
          </div>
        ))}
    </dl>
  );
}

export default StockUnitRecap;
