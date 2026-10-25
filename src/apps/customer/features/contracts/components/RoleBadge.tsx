import { ROLE_LABELS, type ContractRole } from "../model/contracts";

const ICONS: Record<ContractRole, string> = {
  customer: "bi-person",
  secondHolder: "bi-people",
  guarantor: "bi-shield-check",
};

/** My part in a contract: customer, second holder or guarantor */
function RoleBadge({ role }: { role: ContractRole }) {
  return (
    <span className={`badge rounded-pill app-role-badge is-${role}`}>
      <i className={`bi ${ICONS[role]} me-1`} aria-hidden="true" />
      {ROLE_LABELS[role]}
    </span>
  );
}

export default RoleBadge;
