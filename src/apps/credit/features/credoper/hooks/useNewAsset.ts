import { useEffect, useRef, useState } from "react";
import { useAppDispatch } from "@credit/store";
import { newAsset } from "../api/credOperApi";
import { applyNewAsset } from "../credoperSlice";
import { assetTypeOf, BUILDING_ASSET, EQUIPMENT_ASSET } from "../model/business";
import type { CredOperDraft } from "../model/credOperDraft";
import { newAssetKey } from "./useCredOperTemplate";

type Template = {
  /** The new operation's template (new-credoper) is still to come */
  awaiting: boolean;
  /** The asset it was asked with (newAssetKey) */
  assetKey: string | null;
};

/**
 * A new asset from the backend (GET /api/equipments/new or /api/buildings/new, of the business
 * in the company: the asset with its equipment or building), under what's already typed, when the asset type, business or
 * company changes. The first one of a new operation is new-credoper's (asked with the asset type):
 * none is asked for it, nor while it's coming. Never for no asset, nor for the asset an operation
 * was opened with.
 */
export function useNewAsset(operation: CredOperDraft, template: Template) {
  const dispatch = useAppDispatch();
  const assetType = assetTypeOf(operation);
  const businessId = operation.aplBusinessId;
  const companyId = operation.aplCompanyId;
  const key = newAssetKey(assetType, businessId, companyId);
  const [failure, setFailure] = useState<{ error: unknown; key: string; attempt: number } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const request = key ? `${key}#${attempt}` : null;
  // The request asked for last (an opened operation has its asset already): asked once each,
  // and an answer for an older one is dropped
  const askedFor = useRef(operation.id != null ? request : null);
  // The template's asset was taken as the first one
  const templateTaken = useRef(false);
  const current = useRef(request);
  useEffect(() => {
    current.current = request;
  });

  useEffect(() => {
    if (template.awaiting || !request || !businessId || !companyId) return;
    if (!templateTaken.current) {
      templateTaken.current = true;
      if (key === template.assetKey) askedFor.current = request;
    }
    if (askedFor.current === request) return;
    askedFor.current = request;
    const kind = assetType === BUILDING_ASSET ? BUILDING_ASSET : EQUIPMENT_ASSET;
    newAsset(dispatch, kind === BUILDING_ASSET ? "building" : "equipment", { businessId, companyId })
      .then((asset) => {
        if (current.current === request) dispatch(applyNewAsset({ assetType: kind, asset }));
      })
      .catch((error: unknown) => {
        if (current.current === request) setFailure({ error, key: key!, attempt });
      });
  }, [template.awaiting, template.assetKey, request, key, attempt, assetType, businessId, companyId, dispatch]);

  const error = failure && failure.key === key && failure.attempt === attempt ? failure.error : null;
  return { error, retry: () => setAttempt((n) => n + 1) };
}
