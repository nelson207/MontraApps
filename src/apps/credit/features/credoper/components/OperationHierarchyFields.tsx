import { selectCredoper, useAppDispatch, useAppSelector } from "@credit/store";
import { useGetWorkProfileQuery } from "@platform/features/workContext/api/hierarchyApi";
import HierarchySelects from "@platform/features/workContext/components/HierarchySelects";
import type { ContextSelection } from "@platform/features/workContext/hierarchy";
import { nodeFromId } from "@platform/features/workContext/nodeLabels";
import { patchCredoper } from "../credoperSlice";

// Credit intermediary / Supplier / Vendor of the operation being edited.
// Reads and writes the operation only: the app-wide working context just
// provided the initial values (see applyWorkContextDefaults).
type Props = {
  /** Shown validation errors (keys: creditIntermediaryStructNode, showRoomStructNode, salePersonStructNode) */
  errors?: Record<string, string>;
};

function OperationHierarchyFields({ errors = {} }: Props) {
  const dispatch = useAppDispatch();
  const credoper = useAppSelector(selectCredoper);
  const { data: profile } = useGetWorkProfileQuery();

  if (!profile) return null;

  const value: ContextSelection = {
    organization: nodeFromId("organization", credoper?.creditIntermediaryStructNode),
    unit: nodeFromId("unit", credoper?.showRoomStructNode),
    member: nodeFromId("member", credoper?.salePersonStructNode),
  };

  const onChange = (next: ContextSelection) =>
    dispatch(
      patchCredoper({
        creditIntermediaryStructNode: next.organization?.id ?? null,
        showRoomStructNode: next.unit?.id ?? null,
        salePersonStructNode: next.member?.id ?? null,
      }),
    );

  return (
    <div className="my-2">
      <HierarchySelects
        value={value}
        profile={profile}
        onChange={onChange}
        idPrefix="credoper"
        columnClassName="col-md-4"
        errors={{
          organization: errors.creditIntermediaryStructNode,
          unit: errors.showRoomStructNode,
          member: errors.salePersonStructNode,
        }}
      />
    </div>
  );
}

export default OperationHierarchyFields;
