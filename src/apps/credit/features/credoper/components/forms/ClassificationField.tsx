import { useState } from "react";
import SelectField from "@platform/components/ui/SelectField";
import { selectCredoper, useAppDispatch, useAppSelector } from "@credit/store";
import { newIntervention } from "../../api/credOperApi";
import { restartCustomer } from "../../credoperSlice";
import {
  classificationBlock,
  customerOf,
  entityKindOf,
  interventionName,
  losesSecondHolder,
  savedCustomerConflict,
  SECOND_HOLDER_LOST,
  UNNAMED,
  UNUSABLE_CLASSIFICATION,
  type ClassificationOption,
} from "../../model/credOperDraft";
import { setCredOperField } from "../../utils/fieldSetters";
import { fieldRule } from "../../validation/fieldRules";
import OperationField from "../OperationField";
import ConfirmPrompt from "../wizard/ConfirmPrompt";

const KIND_WORD = { Person: "person", Company: "company" } as const;

type Props = {
  options?: ClassificationOption[];
  loading?: boolean;
  /** Validation message to show */
  error?: string | null;
};

// The contract classification, which says what the main customer must be. One with no customer
// kind is listed but can't be chosen. Choosing one that a new customer doesn't match replaces them,
// once the user agrees (the API refuses the save otherwise); a saved customer is never replaced for
// the user, who is told instead.
function ClassificationField({ options, loading, error = null }: Props) {
  const dispatch = useAppDispatch();
  const credoper = useAppSelector(selectCredoper);
  /** The classification a new customer doesn't match, while the user decides */
  const [asked, setAsked] = useState<ClassificationOption | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [replaceError, setReplaceError] = useState<unknown>(null);
  if (!credoper) return null;

  const customer = customerOf(credoper);
  const conflict = savedCustomerConflict(credoper, options);
  const block = classificationBlock(credoper, options);
  // Not the "none chosen" one: that's what the empty field already says
  const unusable = block === UNUSABLE_CLASSIFICATION ? block : null;

  const choose = (value: string) => {
    const next = options?.find((option) => option.code === value);
    if (!next?.entitySuperType) return;
    if (customer && !customer.id && entityKindOf(customer) !== next.entitySuperType) {
      setReplaceError(null);
      setAsked(next);
      return;
    }
    setCredOperField(dispatch, "credOperClassification", Number(value));
  };

  /** The new customer first: if it can't be had, nothing changes */
  const replace = async () => {
    if (!asked || !customer?.correlationID) return;
    const credOperClassificationId = Number(asked.code);
    setReplacing(true);
    setReplaceError(null);
    try {
      const blank = await newIntervention(dispatch, { kind: "Customer", credOperClassificationId });
      dispatch(
        restartCustomer({
          ref: customer.correlationID,
          blank,
          credOperClassification: credOperClassificationId,
          dropSecondHolder: losesSecondHolder(credoper, asked.entitySuperType),
        }),
      );
      setAsked(null);
    } catch (failure) {
      setReplaceError(failure);
    } finally {
      setReplacing(false);
    }
  };

  const name = customer ? interventionName(customer) : UNNAMED;
  return (
    <>
      <OperationField rule={fieldRule(credoper.metadataResponse, "credOperClassification")} error={error ?? unusable}>
        {(field) => (
          <SelectField
            label="Contract classification"
            id="credoper.credoperClassification"
            isLoading={loading}
            // None offered: the app's settings list no classification for this business
            placeholder={!loading && !options?.length ? "Nothing configured for this business" : undefined}
            value={credoper.credOperClassification ?? undefined}
            options={options?.map((option) => ({
              value: option.code,
              label: option.abbreviation,
              title: option.description,
              disabled: !option.entitySuperType,
              hint: option.entitySuperType ? undefined : UNUSABLE_CLASSIFICATION,
            }))}
            onChange={(e) => choose(e.target.value)}
            disabled={field.disabled}
            invalidMessage={field.invalidMessage}
          />
        )}
      </OperationField>

      {conflict && (
        <div className="alert alert-warning small py-2" role="alert">
          {conflict}
        </div>
      )}

      {asked?.entitySuperType && customer && (
        <ConfirmPrompt
          title="Replace the customer?"
          icon="bi-arrow-left-right"
          confirmLabel="Replace customer"
          busyLabel="Replacing…"
          cancelLabel="Keep classification"
          busy={replacing}
          error={replaceError}
          errorLead="Couldn't replace the customer, so nothing changed."
          onCancel={() => setAsked(null)}
          onConfirm={() => void replace()}
        >
          <p className="mb-2">
            {asked.abbreviation} needs a {KIND_WORD[asked.entitySuperType]} as the customer, and{" "}
            {name === UNNAMED ? "this customer" : name} is a {KIND_WORD[entityKindOf(customer)]}. Their details will be cleared and you'll go back to the NIF search.
          </p>
          {losesSecondHolder(credoper, asked.entitySuperType) ? (
            <>
              <div className="alert alert-warning small py-2 mb-2">{SECOND_HOLDER_LOST}</div>
              <p className="mb-0">Guarantors stay as they are.</p>
            </>
          ) : (
            <p className="mb-0">The second holder and guarantors stay as they are.</p>
          )}
        </ConfirmPrompt>
      )}
    </>
  );
}

export default ClassificationField;
