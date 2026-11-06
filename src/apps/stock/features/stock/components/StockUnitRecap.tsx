import { skipToken } from "@reduxjs/toolkit/query";
import {
  useGetEquipmentBrandsQuery,
  useGetEquipmentCategoriesQuery,
  useGetEquipmentModelsQuery,
  useGetEquipmentStatesQuery,
  useGetEquipmentTypesQuery,
} from "@platform/features/equipment/api/equipmentApi";
import { labelOfCode } from "@platform/features/equipment/api/equipmentLists";
import { useStockFormat } from "../model/format";
import { supplierIdOf, type StockUnitDraft } from "../model/stockUnit";
import { useStockText } from "../stockText";

type Props = {
  draft: StockUnitDraft;
  /** Show the supplier and invoice too (after saving) */
  withInvoice?: boolean;
};

// Read-only summary of a stock unit: what was entered in step 1 (and step 2 once saved).
// Empty optional fields are left out.
function StockUnitRecap({ draft, withInvoice = false }: Props) {
  const tx = useStockText();
  const { money, number } = useStockFormat();
  const { equipment, contract } = draft;
  const typeId = equipment.equipmentTypeId;
  const categoryId = equipment.equipmentCategoryId;
  // The same cached lists as the equipment detail
  const companyId = contract?.companyId;
  const types = useGetEquipmentTypesQuery(companyId ? { companyId } : skipToken);
  const states = useGetEquipmentStatesQuery();
  const categories = useGetEquipmentCategoriesQuery(companyId && typeId ? { companyId, equipmentTypeId: typeId } : skipToken);
  const brands = useGetEquipmentBrandsQuery(typeId && categoryId ? { equipmentTypeId: typeId, categoryId } : skipToken);
  const models = useGetEquipmentModelsQuery(
    typeId && categoryId && equipment.brand ? { equipmentTypeId: typeId, categoryId, brand: equipment.brand } : skipToken,
  );
  const supplierId = supplierIdOf(draft);
  const brand = labelOfCode(brands.data, equipment.brand) ?? equipment.brand;
  const model = labelOfCode(models.data, equipment.model) ?? equipment.model;

  const rows: [string, string | null | undefined][] = [
    [tx("agreements.agreement", "Agreement"), contract ? `${contract.companyAbbreviation ?? ""} · ${contract.number ?? ""}` : null],
    [tx("recap.vehicle", "Vehicle"), [brand, model].filter(Boolean).join(" ") || null],
    [tx("recap.type", "Type"), labelOfCode(types.data, equipment.equipmentTypeId)],
    [tx("recap.category", "Category"), labelOfCode(categories.data, equipment.equipmentCategoryId)],
    [tx("recap.state", "State"), labelOfCode(states.data, equipment.equipmentStateId)],
    [tx("recap.vin", "VIN"), equipment.vin],
    [tx("recap.plate", "License plate"), equipment.licencePlate],
    [tx("recap.year", "Year"), equipment.equipYear != null ? String(equipment.equipYear) : null],
    [tx("recap.month", "Month"), equipment.equipMonth != null ? String(equipment.equipMonth) : null],
    [tx("recap.description", "Description"), equipment.description],
    [tx("recap.km", "Km"), equipment.odometer != null ? `${number(equipment.odometer)} km` : null],
    [tx("recap.engine", "Engine size"), equipment.enginesize != null ? `${number(equipment.enginesize)} cc` : null],
    [tx("recap.doors", "Doors"), equipment.doors != null ? String(equipment.doors) : null],
    [tx("recap.amount", "Amount"), money(draft.amount, contract?.currencyId)],
    ...(withInvoice
      ? ([
          [tx("add.supplier", "Supplier"), contract?.suppliers?.find((s) => s.interventionId === supplierId)?.name],
          [tx("recap.invoice", "Invoice"), draft.invoiceNumber.trim()],
        ] as [string, string | null | undefined][])
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
