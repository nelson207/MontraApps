import { useEffect, useRef, useState } from "react";
import { selectCredoperAwaitingTemplate, useAppDispatch, useAppSelector } from "@credit/store";
import { newCredOper, newIntervention } from "../api/credOperApi";
import { applyTemplate, presetCustomer } from "../credoperSlice";
import { assetTypeOf, BUILDING_ASSET, EQUIPMENT_ASSET, type AssetTypeId } from "../model/business";

/**
 * Which new equipment or building an operation needs: its asset type's, of its business in its
 * company; null for no asset (or while any of them isn't decided)
 */
export function newAssetKey(assetType: AssetTypeId | undefined, businessId: number | null | undefined, companyId: number | null | undefined) {
  return (assetType === EQUIPMENT_ASSET || assetType === BUILDING_ASSET) && businessId && companyId
    ? `${assetType}|${businessId}|${companyId}`
    : null;
}
import { API_STEP_OF_STAGE, type CredOperDraft, type Stage } from "../model/credOperDraft";

/** What new-credoper is asked for: the business in the company, for the asset type; null until all three are decided */
export function templateRequest(op: CredOperDraft): { businessId: number; companyId: number; assetType: AssetTypeId } | null {
  const assetType = assetTypeOf(op);
  if (!op.aplBusinessId || !op.aplCompanyId || assetType === undefined) return null;
  return { businessId: op.aplBusinessId, companyId: op.aplCompanyId, assetType };
}

/**
 * A new operation starts blank. The server's blank operation of its business in its company and
 * its asset type (GET /api/credit-operations/new-credoper; no asset type sent for no asset) is
 * asked for once, as soon as the asset type is decided: chosen in its step, or set for the user
 * when the business offers only one in the company (the business and the company are decided
 * before it). It's merged under what was chosen and typed until then. The backend sets its values
 * (currency included): the app sets none the user doesn't see. A proposal's customer
 * (GET /api/credit-operations/new-intervention) is asked for at once: its Customer step may come
 * first.
 */
export function useCredOperTemplate(stage: Stage, operation: CredOperDraft) {
  const dispatch = useAppDispatch();
  const awaiting = useAppSelector(selectCredoperAwaitingTemplate);
  const needsCustomer = awaiting && stage === "proposal" && !operation.interventions?.length;
  const [failure, setFailure] = useState<{ error: unknown; attempt: number } | null>(null);
  const [attempt, setAttempt] = useState(0);
  // The attempt the template was asked for: once (a later change of business, company or asset
  // type doesn't ask again)
  const askedFor = useRef<number | null>(null);

  useEffect(() => {
    if (!needsCustomer) return;
    let cancelled = false;
    newIntervention(dispatch, "Customer")
      .then((customer) => {
        if (!cancelled) dispatch(presetCustomer(customer));
      })
      .catch((error: unknown) => {
        if (!cancelled) setFailure({ error, attempt });
      });
    return () => {
      cancelled = true;
    };
  }, [needsCustomer, attempt, dispatch]);

  // An answer after leaving (another operation may be waiting for its own) is dropped
  const left = useRef(false);
  useEffect(() => {
    left.current = false;
    return () => {
      left.current = true;
    };
  }, []);

  const request = templateRequest(operation);
  const businessId = request?.businessId;
  const companyId = request?.companyId;
  const assetType = request?.assetType;
  // What it was asked for: its asset is the first one (useNewAsset asks for no other for it)
  const [askedKey, setAskedKey] = useState<string | null>(null);
  useEffect(() => {
    if (!awaiting || !businessId || !companyId || assetType === undefined || askedFor.current === attempt) return;
    askedFor.current = attempt;
    setAskedKey(newAssetKey(assetType, businessId, companyId));
    newCredOper(dispatch, API_STEP_OF_STAGE[stage], { businessId, companyId, assetType })
      .then((template) => {
        if (!left.current) dispatch(applyTemplate(template));
      })
      .catch((error: unknown) => {
        if (!left.current) setFailure({ error, attempt });
      });
  }, [awaiting, businessId, companyId, assetType, attempt, stage, dispatch]);

  const error = awaiting && failure?.attempt === attempt ? failure.error : null;
  return {
    /** Waiting for the server's blank operation (until the asset type is decided, and while it's loading) */
    awaiting,
    /** A proposal's customer is loading: the steps after Business can't be shown yet */
    isPending: needsCustomer,
    /** The asset the template brings (newAssetKey), once asked for */
    assetKey: askedKey,
    error,
    retry: () => setAttempt((n) => n + 1),
  };
}
