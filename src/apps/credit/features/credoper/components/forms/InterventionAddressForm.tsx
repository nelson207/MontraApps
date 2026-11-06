import { useState } from "react";
import { selectCredoper, useAppDispatch, useAppSelector } from "@credit/store";
import type { AddressDto } from "@platform/api/generated/MontraPOSApi";
import type { CredOperIntervDto, EntityAddressDto } from "@platform/api/legacy/legacyApi";
import InputField from "@platform/components/ui/InputField";
import SelectField from "@platform/components/ui/SelectField";
import { addressIn, addressText } from "../../api/entityMapping";
import { useCountryOptions } from "../../hooks/useEntityOptions";
import { isExistingEntity, postalIsFiscal } from "../../model/credOperDraft";
import type { InterventionFormProps } from "../../types/credoperTypes";
import { updateIntervention } from "../../utils/fieldSetters";
import ChoiceCards from "./ChoiceCards";

type Part = "fiscalEntityAddress" | "entityAddress";

type BlockProps = {
  index: number;
  /** Id of its fields, and of its errors */
  name: "fiscal" | "postal";
  apiField: "fiscalAddress" | "postalAddress";
  address: EntityAddressDto | undefined;
  /** What the entity has on file (an entity that exists): one of them, or a new one */
  available: AddressDto[] | null;
  required: boolean;
  errors?: Record<string, string>;
  prefix: string;
  onChange: (address: EntityAddressDto) => void;
};

/** One address: chosen from the entity's (sent with its id) or typed (sent without one) */
function AddressBlock({ index, name, apiField, address, available, required, errors, prefix, onChange }: BlockProps) {
  const { options: countries, isLoading } = useCountryOptions();
  const [typing, setTyping] = useState(() => !available?.length || (!address?.id && !!address?.street));
  const id = (field: string) => `intervention-${index}-${name}-${field}`;
  const errorOf = (field: string) => errors?.[`${prefix}${apiField}.${field}`];
  const set = (patch: Partial<EntityAddressDto>) => onChange({ ...address, ...patch, id: null });

  return (
    <>
      {!!available?.length && (
        <ChoiceCards
          label={name === "fiscal" ? "Fiscal address" : "Postal address"}
          choices={[
            ...available.map((item) => ({
              key: item.id ?? addressText(item),
              title: addressText(item),
              selected: !typing && item.id === address?.id,
              onSelect: () => {
                setTyping(false);
                onChange(addressIn(item, undefined) ?? {});
              },
            })),
            {
              key: "new",
              title: "Use a new address",
              detail: "Type it below",
              selected: typing,
              onSelect: () => {
                setTyping(true);
                onChange({ id: null });
              },
            },
          ]}
        />
      )}
      {typing && (
        <div className="row g-3">
          <div className="col-md-6">
            <InputField
              id={id("street")}
              label="Street"
              required={required}
              invalidMessage={errorOf("street")}
              value={address?.street ?? ""}
              onChange={(e) => set({ street: e.target.value })}
            />
          </div>
          <div className="col-md-2">
            <InputField id={id("number")} label="Number" value={address?.streetNumber ?? ""} onChange={(e) => set({ streetNumber: e.target.value })} />
          </div>
          <div className="col-md-4">
            <InputField
              id={id("postal-code")}
              label="Postal code"
              required={required}
              invalidMessage={errorOf("postalCode")}
              value={address?.postalCode ?? ""}
              onChange={(e) => set({ postalCode: e.target.value })}
            />
          </div>
          <div className="col-md-6">
            <InputField id={id("locality")} label="Locality" value={address?.locality ?? ""} onChange={(e) => set({ locality: e.target.value })} />
          </div>
          <div className="col-md-6">
            <SelectField
              id={id("country")}
              label="Country"
              required={required}
              isLoading={isLoading}
              invalidMessage={errorOf("countryId")}
              value={address?.countryId ?? ""}
              options={countries}
              onChange={(e) => set({ countryId: e.target.value })}
            />
          </div>
        </div>
      )}
    </>
  );
}

// The fiscal and the postal address; the postal one is usually the same.
export default function InterventionAddressForm({ index = 0, intervention, errors }: InterventionFormProps) {
  const dispatch = useAppDispatch();
  const credoper = useAppSelector(selectCredoper);
  const update = (change: (person: CredOperIntervDto) => CredOperIntervDto) => updateIntervention(dispatch, credoper, index, change);
  const setAddress = (part: Part) => (address: EntityAddressDto) => update((person) => ({ ...person, [part]: address }));

  const existing = isExistingEntity(intervention);
  const same = postalIsFiscal(intervention);
  const prefix = `interventions.${intervention?.correlationID}.`;
  const available = existing ? (intervention?.availableAddresses ?? []) : null;
  const common = { index, available, required: !existing, errors, prefix };

  return (
    <div className="mb-3">
      <h6 className="border-bottom pb-2">Fiscal address</h6>
      <AddressBlock {...common} name="fiscal" apiField="fiscalAddress" address={intervention?.fiscalEntityAddress} onChange={setAddress("fiscalEntityAddress")} />

      <h6 className="border-bottom pb-2 mt-3">Postal address</h6>
      <div className="form-check mb-3">
        <input
          id={`intervention-${index}-same-address`}
          type="checkbox"
          className="form-check-input"
          checked={same}
          onChange={(e) => update((person) => ({ ...person, samePostalAddress: e.target.checked }))}
        />
        <label htmlFor={`intervention-${index}-same-address`} className="form-check-label">
          Same as the fiscal address
        </label>
      </div>
      {!same && <AddressBlock {...common} name="postal" apiField="postalAddress" address={intervention?.entityAddress} onChange={setAddress("entityAddress")} />}
    </div>
  );
}
