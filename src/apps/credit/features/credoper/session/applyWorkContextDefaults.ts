import type { CredOperDto } from "@platform/api/legacy/legacyApi";
import type { ContextSelection } from "@platform/features/workContext/hierarchy";
import { rememberNodes } from "@platform/features/workContext/nodeLabels";

// Field mapping on the operation:
//   Credit intermediary → creditIntermediaryStructNode
//   Supplier            → showRoomStructNode
//   Vendor              → salePersonStructNode
//
// Called once, when a new quotation/proposal is created. Only empty fields are filled
// (the context may be partial: levels with several options are left for the user), and
// the result is a copy: later edits on the operation never touch
// the app-wide working context.
export function applyWorkContextDefaults(
  credoper: CredOperDto,
  context: ContextSelection | null,
): CredOperDto {
  if (!context) return credoper;

  // The operation stores ids only; keep the names so its lists can show them
  rememberNodes("organization", [context.organization]);
  rememberNodes("unit", [context.unit]);
  rememberNodes("member", [context.member]);

  return {
    ...credoper,
    creditIntermediaryStructNode:
      credoper.creditIntermediaryStructNode ?? context.organization?.id ?? null,
    showRoomStructNode: credoper.showRoomStructNode ?? context.unit?.id ?? null,
    salePersonStructNode: credoper.salePersonStructNode ?? context.member?.id ?? null,
  };
}
