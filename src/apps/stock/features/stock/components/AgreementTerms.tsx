import { skipToken } from "@reduxjs/toolkit/query";
import type { StockContractDto } from "@platform/api/generated/MontraPOSApi";
import { useGetEquipmentStatesQuery, useGetEquipmentTypesQuery } from "@platform/features/equipment/api/equipmentApi";
import { labelOfCode } from "@platform/features/equipment/api/equipmentLists";
import { useStockFormat } from "../model/format";
import { useStockText } from "../stockText";

const BADGE = "badge rounded-pill bg-body-tertiary text-body border";

// What a contract offers, as the API sends it: its plafond (available of total), the limit per
// vehicle, the term, the rate phases and what it finances. The contract only has the ids of the
// equipment types and states; their names come from the shared equipment lists.
function AgreementTerms({ contract }: { contract: StockContractDto }) {
  const tx = useStockText();
  const { money, rate, date } = useStockFormat();
  const types = useGetEquipmentTypesQuery(contract.companyId && contract.equipmentTypeIds?.length ? { companyId: contract.companyId } : skipToken);
  const states = useGetEquipmentStatesQuery();

  const available = contract.availableAmount ?? 0;
  const total = contract.totalAmount ?? 0;
  const usedShare = total > 0 ? Math.max(0, Math.min(100, Math.round(((total - available) / total) * 100))) : 0;
  const currency = contract.currencyId;

  return (
    <>
      <span className="d-flex flex-wrap justify-content-between small mt-3 mb-1">
        <span>
          <span className="fw-semibold">{money(contract.availableAmount, currency) ?? tx("common.unavailable", "unavailable")}</span>{" "}
          {tx("agreements.available", "available")}
        </span>
        <span className="text-body-secondary">
          {tx("agreements.ofTotal", "of {{total}}", { total: money(contract.totalAmount, currency) ?? tx("common.unavailable", "unavailable") })}
        </span>
      </span>
      <span
        className="progress app-agreement-usage"
        role="progressbar"
        aria-label={tx("agreements.used", "{{share}}% of the plafond used", { share: usedShare })}
        aria-valuenow={usedShare}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span className={`progress-bar ${usedShare >= 90 ? "bg-danger" : usedShare >= 75 ? "bg-warning" : ""}`} style={{ width: `${usedShare}%` }} />
      </span>

      <span className="d-flex flex-wrap gap-1 mt-3">
        <span className={BADGE}>
          {tx("agreements.perVehicle", "Up to {{amount}} / vehicle", { amount: money(contract.maxPerVehicle, currency) ?? tx("common.unavailable", "unavailable") })}
        </span>
        {contract.termDays != null && <span className={BADGE}>{tx("agreements.term", "{{days}} days", { days: contract.termDays })}</span>}
        {(contract.ratePhases ?? []).map((phase, i) => (
          <span className={BADGE} key={i}>
            {phase.fromDate
              ? tx("agreements.rateFrom", "{{rate}} from {{date}}", { rate: rate(phase.rate) ?? "—", date: date(phase.fromDate) })
              : (rate(phase.rate) ?? "—")}
          </span>
        ))}
        {(contract.equipmentTypeIds ?? []).map((id) => (
          <span className={BADGE} key={`type-${id}`}>
            {labelOfCode(types.data, id) ?? tx("agreements.typeId", "Type {{id}}", { id })}
          </span>
        ))}
        {(contract.equipmentStateIds ?? []).map((id) => (
          <span className={BADGE} key={`state-${id}`}>
            {labelOfCode(states.data, id) ?? tx("agreements.stateId", "State {{id}}", { id })}
          </span>
        ))}
      </span>
    </>
  );
}

export default AgreementTerms;
