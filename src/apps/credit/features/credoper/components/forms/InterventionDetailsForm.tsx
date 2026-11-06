import { useState } from "react";
import { selectCredoper, selectEntityLookup, useAppDispatch, useAppSelector } from "@credit/store";
import type { EmailDto, PhoneDto } from "@platform/api/generated/MontraPOSApi";
import type { CredOperIntervDto } from "@platform/api/legacy/legacyApi";
import InputField from "@platform/components/ui/InputField";
import { emailIn, joinName, nameParts, phoneIn } from "../../api/entityMapping";
import { isLookupPending, normalizeNif, vatOf, withVat } from "../../entityLookup/entityLookup";
import { useActivityTypes, useJuridicalTypes, usePhoneTypes } from "../../hooks/useEntityOptions";
import { entityKindOf, isCompany, isExistingEntity } from "../../model/credOperDraft";
import type { InterventionFormProps } from "../../types/credoperTypes";
import { updateIntervention } from "../../utils/fieldSetters";
import ChoiceCards, { type Choice } from "./ChoiceCards";
import LazySelectField from "./LazySelectField";
import PhoneField from "./PhoneField";

const SMS_HINT = "Only a mobile can receive an SMS code.";

const NEW_CHOICE = "new";

/** What the entity has on file, with the one selected even when it isn't listed */
const withSelected = <T extends { id?: string | null }>(list: T[] | null | undefined, selected: T | undefined): T[] =>
  selected?.id && !list?.some((item) => item.id === selected.id) ? [selected, ...(list ?? [])] : (list ?? []);

// Who they are and how to reach them. New: typed. An entity that exists: name and legal form
// read-only, its contacts chosen from what it has on file (or new ones).
export default function InterventionDetailsForm({ index = 0, intervention, errors }: InterventionFormProps) {
  const dispatch = useAppDispatch();
  const credoper = useAppSelector(selectCredoper);
  const lookup = useAppSelector(selectEntityLookup(intervention?.correlationID));
  const phoneTypes = usePhoneTypes();

  const update = (change: (person: CredOperIntervDto) => CredOperIntervDto) => updateIntervention(dispatch, credoper, index, change);
  const errorOf = (field: string) => errors?.[`interventions.${intervention?.correlationID}.${field}`];
  const id = (field: string) => `intervention-${index}-${field}`;

  const company = isCompany(intervention ?? undefined);
  const existing = isExistingEntity(intervention);
  const entity = intervention?.entity;

  const juridicalTypes = useJuridicalTypes(entityKindOf(intervention ?? undefined));
  const juridicalType = entity?.juridicalType ?? juridicalTypes.items.find((type) => type.id === entity?.juridicalTypeId);
  const contextId = juridicalType?.hasActivity ? (juridicalType.activityTypeContextId ?? null) : null;
  const activityTypes = useActivityTypes(contextId);
  const activityId = company ? intervention?.company?.leafActivityTypeId : intervention?.person?.leafActivityTypeNodeId;

  const names = existing ? { firstName: intervention?.person?.firstName, lastName: intervention?.person?.lastName } : nameParts(entity?.fullName, intervention?.person);
  const setName = (part: "firstName" | "lastName", value: string) =>
    update((person) => {
      const next = { ...names, [part]: value };
      return {
        ...person,
        person: { ...person.person, ...next },
        // An entity that exists keeps its own name
        entity: existing ? person.entity : { ...person.entity, fullName: joinName(next.firstName, next.lastName) },
      };
    });

  const setActivity = (activity: number | null, label: string | null) =>
    update((person) => ({
      ...person,
      ...(company
        ? { company: { ...person.company, leafActivityTypeId: activity } }
        : { person: { ...person.person, leafActivityTypeNodeId: activity } }),
      entity: { ...person.entity, optionLabels: { ...person.entity?.optionLabels, activity: label ?? "" } },
    }));

  return (
    <div className="mb-3">
      <h6 className="border-bottom pb-2">{company ? "Company" : "Identity"}</h6>
      <div className="row g-3 mb-3">
        {/* While the search is on screen, the NIF is typed there */}
        {!isLookupPending(intervention, lookup) && (
          <div className="col-md-4">
            <InputField
              id={id("nif")}
              label="NIF"
              required={!existing}
              // Searched and not found, or the entity's: another one is searched for instead
              disabled={existing || lookup?.outcome === "notFound"}
              invalidMessage={errorOf("entity.vatNumber")}
              value={vatOf(intervention ?? undefined)}
              onChange={(e) => update((person) => withVat(person, normalizeNif(e.target.value)))}
            />
          </div>
        )}
        {(company || existing) && (
          <div className="col-md-8">
            <InputField
              id={id("name")}
              label={company ? "Company name" : "Name"}
              required={company && !existing}
              disabled={existing}
              invalidMessage={errorOf("entity.fullName")}
              value={entity?.fullName ?? ""}
              onChange={(e) => update((person) => ({ ...person, entity: { ...person.entity, fullName: e.target.value } }))}
            />
          </div>
        )}
        {!company && (
          <>
            <div className="col-md-6">
              <InputField
                id={id("first-name")}
                label="First name"
                required={!existing}
                invalidMessage={errorOf("person.firstName")}
                value={names.firstName ?? ""}
                onChange={(e) => setName("firstName", e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <InputField
                id={id("last-name")}
                label="Last name"
                required={!existing}
                invalidMessage={errorOf("person.lastName")}
                value={names.lastName ?? ""}
                onChange={(e) => setName("lastName", e.target.value)}
              />
            </div>
          </>
        )}
        <div className="col-md-6">
          <LazySelectField
            id={id("juridical-type")}
            label="Legal form"
            required={company && !existing}
            disabled={existing}
            placeholder={existing ? "Not available" : undefined}
            invalidMessage={errorOf("entity.juridicalTypeId")}
            value={entity?.juridicalTypeId}
            list={juridicalTypes}
            selectedLabel={entity?.juridicalType?.description ?? entity?.juridicalType?.abbreviation}
            onPick={(type) =>
              update((person) => ({
                ...person,
                entity: { ...person.entity, juridicalTypeId: type.id, juridicalType: type, optionLabels: { ...person.entity?.optionLabels, activity: "" } },
                // The activity is of the legal form: another one clears it
                ...(company
                  ? { company: { ...person.company, leafActivityTypeId: null } }
                  : { person: { ...person.person, leafActivityTypeNodeId: null } }),
              }))
            }
          />
        </div>
        <div className="col-md-6">
          <LazySelectField
            id={id("activity-type")}
            label="Activity (CAE)"
            required={company && !existing && !!juridicalType?.hasActivity}
            disabled={contextId === null}
            placeholder={contextId !== null ? undefined : juridicalType ? "This legal form has no activity" : "Choose the legal form first"}
            invalidMessage={errorOf(company ? "company.leafActivityTypeId" : "person.leafActivityTypeNodeId")}
            value={activityId}
            list={activityTypes}
            selectedLabel={entity?.optionLabels?.activity || undefined}
            onPick={(activity, label) => setActivity(activity.id ?? null, label)}
          />
        </div>
      </div>

      <h6 className="border-bottom pb-2">Contacts</h6>
      {phoneTypes.isError && !isLookupPending(intervention, lookup) && (
        <div className="alert alert-warning d-flex align-items-center gap-2 py-2" role="alert">
          <span className="flex-grow-1 small">Couldn't load the phone types, so phones can't be filled in.</span>
          <button type="button" className="btn btn-sm btn-outline-warning" onClick={() => void phoneTypes.retry()}>
            Retry
          </button>
        </div>
      )}
      {existing ? (
        <ExistingContacts index={index} intervention={intervention!} update={update} phoneError={errorOf("entity.phone")} emailError={errorOf("entityEmail.email")} />
      ) : (
        <>
          <PhoneFields index={index} intervention={intervention} update={update} invalidMessage={errorOf("entity.phone")} />
          <div className="row g-3">
            <div className="col-md-6">
              <EmailField
                id={id("email")}
                label="E-mail"
                invalidMessage={errorOf("entityEmail.email")}
                value={intervention?.entityEmail?.email ?? ""}
                onChange={(email) => update((person) => ({ ...person, entityEmail: { ...person.entityEmail, email } }))}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

type Update = (change: (person: CredOperIntervDto) => CredOperIntervDto) => void;

/** The e-mail field of the Customer step */
function EmailField({ id, label, value, invalidMessage, onChange }: { id: string; label: string; value: string; invalidMessage?: string; onChange: (email: string) => void }) {
  return <InputField id={id} label={label} type="email" inputGroupSpan="@" invalidMessage={invalidMessage} value={value} onChange={(e) => onChange(e.target.value)} />;
}

/** A mobile and a landline, each with its type from the API: at least one is filled (typed: no id) */
function PhoneFields({ index, intervention, update, invalidMessage }: { index: number; intervention: CredOperIntervDto | null | undefined; update: Update; invalidMessage?: string }) {
  const phoneTypes = usePhoneTypes();
  return (
    <div className="row g-3">
      <div className="col-md-6">
        <PhoneField
          id={`intervention-${index}-mobile-phone`}
          label="Mobile phone"
          type="mobile"
          disabled={!phoneTypes.isReady}
          invalidMessage={invalidMessage}
          value={intervention?.entityMobilePhone}
          onChange={(typed) =>
            update((person) => ({ ...person, entityMobilePhone: { ...person.entityMobilePhone, ...typed, id: null, phoneTypeId: phoneTypes.mobileId } }))
          }
        />
      </div>
      <div className="col-md-6">
        <PhoneField
          id={`intervention-${index}-landline-phone`}
          label="Landline phone"
          type="landline"
          disabled={!phoneTypes.isReady}
          value={intervention?.entityLandlinePhone}
          onChange={(typed) =>
            update((person) => ({ ...person, entityLandlinePhone: { ...person.entityLandlinePhone, ...typed, id: null, phoneTypeId: phoneTypes.landlineId } }))
          }
        />
      </div>
      <div className="col-12">
        <small className="d-block text-body-secondary app-field-note">Enter at least one phone. {SMS_HINT}</small>
      </div>
    </div>
  );
}

type ExistingProps = {
  index: number;
  intervention: CredOperIntervDto;
  update: Update;
  phoneError?: string;
  emailError?: string;
};

/** The entity's phones and e-mails to choose from, or new ones (sent without an id) */
function ExistingContacts({ index, intervention, update, phoneError, emailError }: ExistingProps) {
  const phoneTypes = usePhoneTypes();
  // A landline only comes back in its own place when it's what was typed
  const { entityMobilePhone: mobile, entityLandlinePhone: landline } = intervention;
  const phone = mobile?.id ? mobile : landline?.id ? landline : undefined;
  const email = intervention.entityEmail;
  const phones = withSelected<PhoneDto>(intervention.availablePhones, phone ? { id: phone.id, phoneNumber: phone.phoneNumber, countryId: phone.countryId, phoneTypeId: phone.phoneTypeId } : undefined);
  const emails = withSelected<EmailDto>(intervention.availableEmails, email?.id ? { id: email.id, emailAddress: email.email } : undefined);
  const [newPhone, setNewPhone] = useState(() => !phones.length || (!phone && (!!mobile?.phoneNumber || !!landline?.phoneNumber)));
  const [newEmail, setNewEmail] = useState(() => !emails.length || (!email?.id && !!email?.email));

  const typeName = (phoneTypeId: number | null | undefined) => phoneTypes.kindOf(phoneTypeId) ?? "Phone";
  const phoneChoices: Choice[] = [
    ...phones.map((item) => ({
      key: item.id ?? "",
      title: item.phoneNumber ?? "",
      detail: typeName(item.phoneTypeId),
      selected: !newPhone && item.id === phone?.id,
      onSelect: () => {
        setNewPhone(false);
        update((person) => ({ ...person, entityMobilePhone: phoneIn(item, undefined), entityLandlinePhone: {} }));
      },
    })),
    {
      key: NEW_CHOICE,
      title: "Use a new phone",
      detail: "Type it below",
      selected: newPhone,
      onSelect: () => {
        setNewPhone(true);
        // Nothing selected, nothing typed yet: what model/interventionRequired asks to fill in
        update((person) => ({ ...person, entityMobilePhone: { phoneNumber: "", phoneTypeId: phoneTypes.mobileId }, entityLandlinePhone: {} }));
      },
    },
  ];
  const emailChoices: Choice[] = [
    ...emails.map((item) => ({
      key: item.id ?? "",
      title: item.emailAddress ?? "",
      selected: !newEmail && item.id === email?.id,
      onSelect: () => {
        setNewEmail(false);
        update((person) => ({ ...person, entityEmail: emailIn(item, undefined) }));
      },
    })),
    {
      key: NEW_CHOICE,
      title: "Use a new e-mail",
      detail: "Type it below",
      selected: newEmail,
      onSelect: () => {
        setNewEmail(true);
        update((person) => ({ ...person, entityEmail: { email: "" } }));
      },
    },
  ];

  return (
    <>
      <div className="small fw-medium text-body-secondary mb-1">Phone</div>
      <ChoiceCards label="Phone" choices={phoneChoices} />
      {newPhone && <PhoneFields index={index} intervention={intervention} update={update} invalidMessage={phoneError} />}

      <div className="small fw-medium text-body-secondary mb-1">E-mail</div>
      <ChoiceCards label="E-mail" choices={emailChoices} />
      {newEmail && (
        <div className="row g-3">
          <div className="col-md-6">
            <EmailField
              id={`intervention-${index}-email`}
              label="New e-mail"
              invalidMessage={emailError}
              value={email?.email ?? ""}
              onChange={(typed) => update((person) => ({ ...person, entityEmail: { ...person.entityEmail, id: null, email: typed } }))}
            />
          </div>
        </div>
      )}
    </>
  );
}
