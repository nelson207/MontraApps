import { useAppDispatch, useAppSelector } from "@platform/app/store";
import { useGetWorkProfileQuery } from "../api/hierarchyApi";
import { isActingAsOther, isComplete, ownMemberIn, sanitizeSelection, type ContextSelection } from "../hierarchy";
import { selectStoredWorkContext, setWorkContext } from "../workContextSlice";

/**
 * The app-wide working context, checked against the user's role.
 * It may be incomplete (levels with several options are left for the user to choose).
 */
export function useWorkContext() {
  const dispatch = useAppDispatch();
  const stored = useAppSelector(selectStoredWorkContext);
  const { data: profile, isLoading, isError } = useGetWorkProfileQuery();

  const origin = profile?.isSample ? "sample" : "live";
  const selection = profile ? sanitizeSelection(stored?.origin === origin ? stored.selection : undefined, profile) : null;
  const isImpersonating = !!profile && !!selection && isActingAsOther(selection, profile);

  const setSelection = (next: ContextSelection) => {
    if (profile && isComplete(next)) dispatch(setWorkContext({ origin, selection: next }));
  };

  // "You" on the current supplier: acting as yourself keeps the supplier, with your own node there
  const ownHere = profile && selection ? ownMemberIn(profile, selection.unit?.id) : null;
  const actAsMyself = () => {
    if (selection && ownHere) setSelection({ ...selection, member: ownHere });
  };

  return {
    profile,
    selection,
    isSupervisor: profile?.role === "supervisor",
    isImpersonating,
    isSample: !!profile?.isSample,
    isReady: !isLoading && !!profile,
    isError,
    setSelection,
    /** The user has their own node on the current unit (so "Act as myself" can switch to it) */
    canActAsMyself: !!ownHere,
    actAsMyself,
  };
}
