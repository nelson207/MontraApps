import { skipToken } from "@reduxjs/toolkit/query";
import { useGetApiUsersByIdQuery, useGetApiUsersMeQuery } from "@platform/api/generated/MontraPOSApi";
import { problemStatus } from "@platform/api/problemCode";

/**
 * Whether the signed-in user may manage users: true / false, or null while it isn't known yet.
 * The API has no permission endpoint: reading one's own user through user administration
 * (GET /api/users/{my id}) answers 403 to anyone who can't manage users. Any other answer counts
 * as allowed (each action still gets its own 403 user_management_forbidden).
 */
export function useCanManageUsers(): boolean | null {
  const me = useGetApiUsersMeQuery(undefined, { refetchOnMountOrArgChange: false });
  const myId = me.currentData?.id;
  const probe = useGetApiUsersByIdQuery(myId ? { id: myId } : skipToken, { refetchOnMountOrArgChange: false });
  if (me.isError) return problemStatus(me.error) === 403 ? false : null;
  if (!myId || probe.isUninitialized || probe.isLoading) return null;
  return problemStatus(probe.error) !== 403;
}
