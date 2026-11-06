import { Fragment, useState, type ReactNode } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  useGetEquipmentCategoriesQuery,
  useGetEquipmentStatesQuery,
  useGetEquipmentTypesQuery,
} from "@platform/features/equipment/api/equipmentApi";
import { labelOfCode } from "@platform/features/equipment/api/equipmentLists";
import { nodeFromId } from "@platform/features/workContext/nodeLabels";
import type { CodeAbbreviation, CredOperAssetDto } from "@platform/api/legacy/legacyApi";
import { vatOf } from "../../entityLookup/entityLookup";
import { money } from "../../hooks/useCalculation";
import { equipmentModeOf, hasEquipment } from "../../model/business";
import { useGetInsuranceTypesQuery } from "../../insurance/insuranceApi";
import {
  insuredLabel,
  interventionName,
  interventionRole,
  ROLE_LABELS,
  type CredOperDraft,
  type Insurance,
} from "../../model/credOperDraft";
import type { QuotationDataProps } from "../../types/credoperTypes";
import type { StepId } from "../../wizard/steps";
import { useVehicleName } from "./useVehicleName";

// Review cards of the Summary step: each leads with what it's about, then its key facts.

const labelOf = (list: CodeAbbreviation[] | undefined, code?: number | null) =>
  code == null
    ? null
    : (list?.find((item) => String(item.code) === String(code))?.abbreviation ?? String(code));

const isBlank = (value: ReactNode) => value === null || value === undefined || value === "";

/** Without `goTo` the card is read-only (no Edit). */
export type CardProps = {
  step?: StepId;
  issues?: number;
  goTo?: (step: StepId) => void;
};

export function ReviewCard({
  title,
  icon,
  step,
  issues = 0,
  goTo,
  children,
  nav,
}: CardProps & { title: string; icon: string; children: ReactNode; /** Header slot, before Edit */ nav?: ReactNode }) {
  return (
    <div className="col-12 col-md-6">
      <article className={`card h-100 app-review-card ${issues > 0 ? "has-issues" : ""}`}>
        <div className="card-header d-flex align-items-center gap-2">
          <span className="app-review-icon">
            <i className={`bi ${icon}`} aria-hidden="true" />
          </span>
          <h4 className="h6 fw-semibold mb-0 flex-grow-1 text-truncate">{title}</h4>
          {issues > 0 && <span className="badge rounded-pill text-bg-danger">{issues} to fix</span>}
          {nav}
          {goTo && step && (
            <button
              type="button"
              className="btn btn-sm btn-link text-decoration-none p-0"
              onClick={() => goTo(step)}
              aria-label={`Edit ${title}`}
            >
              <i className="bi bi-pencil me-1" aria-hidden="true" />
              Edit
            </button>
          )}
        </div>
        <div className="card-body">{children}</div>
      </article>
    </div>
  );
}

export function Fields({ children }: { children: ReactNode }) {
  return <dl className="app-review-fields mb-0">{children}</dl>;
}

/** Nothing when empty: what's required and missing is listed by Readiness */
export function Field({ label, value }: { label: string; value: ReactNode }) {
  if (isBlank(value)) return null;
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="small text-body-tertiary mb-0">{children}</p>;
}

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter((_, index, words) => index === 0 || index === words.length - 1)
    .map((word) => word[0]?.toUpperCase())
    .join("");

/** What a card or an entry is about: its name, with who or what it is below */
function Lead({ name, detail, avatar = false }: { name: ReactNode; detail?: ReactNode; avatar?: boolean }) {
  return (
    <div className="app-review-lead">
      {avatar && typeof name === "string" && (
        <span className="app-review-avatar" aria-hidden="true">
          {initialsOf(name)}
        </span>
      )}
      <div className="min-w-0">
        <div className="app-review-lead-name">{name}</div>
        {!isBlank(detail) && <div className="small text-body-secondary">{detail}</div>}
      </div>
    </div>
  );
}

/** The rest of an entry's fields, one click away */
function MoreDetails({ label = "Show all details", children }: { label?: string; children: ReactNode }) {
  return (
    <details className="app-review-more">
      <summary>{label}</summary>
      {children}
    </details>
  );
}

export function CustomerCard({ op, ...card }: CardProps & { op: CredOperDraft }) {
  const network = [
    nodeFromId("organization", op.creditIntermediaryStructNode)?.name,
    nodeFromId("unit", op.showRoomStructNode)?.name,
    nodeFromId("member", op.salePersonStructNode)?.name,
  ]
    .filter(Boolean)
    .join(" › ");
  const fiscalNumber = op.customerVAT?.legalDocNumber;

  return (
    <ReviewCard title="Customer" icon="bi-person" {...card}>
      {op.customerName ? (
        <Lead avatar name={op.customerName} detail={fiscalNumber && `Fiscal number ${fiscalNumber}`} />
      ) : (
        <Empty>No customer yet.</Empty>
      )}
      <Fields>
        <Field label="E-mail" value={op.customerEmail?.email} />
        <Field label="Mobile" value={op.customerPhone?.phoneNumber} />
        <Field label="Landline" value={op.customerLandLine?.phoneNumber} />
        <Field label="Commercial network" value={network} />
      </Fields>
    </ReviewCard>
  );
}

export type GalleryItem = { key: string; label: string; content: ReactNode };

/**
 * A review card for something that can have several entries (vehicles, people, insurances):
 * one entry at a time, ← / → in the header and "n / total". One entry: a plain card.
 */
export function GalleryCard({
  title,
  icon,
  items,
  empty,
  ...card
}: CardProps & { title: string; icon: string; items: GalleryItem[]; empty: string }) {
  const [index, setIndex] = useState(0);
  const current = Math.min(index, Math.max(0, items.length - 1));
  const item = items[current];
  const many = items.length > 1;

  const nav = many && (
    <div className="d-flex align-items-center gap-1 flex-shrink-0" role="group" aria-label={`${title}: browse`}>
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary app-gallery-btn"
        aria-label={`Previous ${title.toLowerCase()}`}
        disabled={current === 0}
        onClick={() => setIndex(current - 1)}
      >
        <i className="bi bi-chevron-left" />
      </button>
      <small className="text-body-secondary app-tabular" aria-live="polite">
        {current + 1} / {items.length}
      </small>
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary app-gallery-btn"
        aria-label={`Next ${title.toLowerCase()}`}
        disabled={current === items.length - 1}
        onClick={() => setIndex(current + 1)}
      >
        <i className="bi bi-chevron-right" />
      </button>
    </div>
  );

  return (
    <ReviewCard title={title} icon={icon} nav={nav} {...card}>
      {item ? (
        <>
          {many && <div className="small fw-semibold text-body-secondary mb-2 text-truncate">{item.label}</div>}
          {item.content}
        </>
      ) : (
        <Empty>{empty}</Empty>
      )}
    </ReviewCard>
  );
}

const amount = (value: number | null | undefined) => (value != null ? money.format(value) : null);

/** One vehicle: its name and plate, the facts that tell it apart, and the rest a click away */
function VehicleFields({ op, index }: { op: CredOperDraft; index: number }) {
  const equipment = op.assets?.[index]?.equipment;
  const renting = equipmentModeOf(op) === "multiple";
  // The same cached lists as the equipment detail
  const companyId = op.aplCompanyId;
  const typeId = equipment?.equipmentTypeId;
  const types = useGetEquipmentTypesQuery({ companyId });
  const states = useGetEquipmentStatesQuery();
  const categories = useGetEquipmentCategoriesQuery(typeId ? { companyId, equipmentTypeId: typeId } : skipToken);
  const name = useVehicleName(op, index);
  const label = (list: { data?: Parameters<typeof labelOfCode>[0] }, code?: number | string | null) =>
    labelOfCode(list.data, code) ?? (code == null || code === "" ? null : String(code));
  const facts: [string, ReactNode][] = [
    ["State", label(states, equipment?.equipmentStateId)],
    ["Year", equipment?.equipYear],
    ["Month", equipment?.equipMonth],
    ["Km", equipment?.odometer != null ? `${equipment.odometer.toLocaleString("pt-PT")} km` : null],
    ["Amount", renting ? amount(equipment?.netAmount) : null],
    ["Commercial value", amount(equipment?.baseMarketValue)],
  ];
  const more: [string, ReactNode][] = [
    ["Type", label(types, equipment?.equipmentTypeId)],
    ["Category", label(categories, equipment?.equipmentCategoryId)],
    // Not when it's what names the vehicle
    ["Description", equipment?.description !== name ? equipment?.description : null],
    ["Engine size", equipment?.enginesize != null ? `${equipment.enginesize} cc` : null],
    ["Doors", equipment?.doors],
  ];
  const filled = (fields: [string, ReactNode][]) => fields.some(([, value]) => !isBlank(value));
  const fields = (list: [string, ReactNode][]) => (
    <Fields>
      {list.map(([fieldLabel, value]) => (
        <Field key={fieldLabel} label={fieldLabel} value={value} />
      ))}
    </Fields>
  );
  if (!name && !filled(facts) && !filled(more)) return <Empty>No details yet.</Empty>;
  return (
    <>
      {name && <Lead name={name} detail={name !== equipment?.licencePlate ? equipment?.licencePlate : null} />}
      {filled(facts) && fields(facts)}
      {filled(more) && <MoreDetails>{fields(more)}</MoreDetails>}
    </>
  );
}

/** Every vehicle of the operation, as one gallery */
export function VehicleCards({ op, ...card }: CardProps & { op: CredOperDraft }) {
  if (!hasEquipment(op)) return null;
  const assets = op.assets ?? [];
  return (
    <GalleryCard
      title={assets.length > 1 ? "Vehicles" : "Vehicle"}
      icon="bi-car-front"
      empty="No vehicles added."
      items={assets.map((asset, index) => ({
        key: asset.correlationID ?? String(index),
        label: `Vehicle ${index + 1}${asset.equipment?.licencePlate ? ` · ${asset.equipment.licencePlate}` : ""}`,
        content: <VehicleFields op={op} index={index} />,
      }))}
      {...card}
    />
  );
}

/** The people of a proposal (customer, second holder, guarantors), all in view, their details a click away */
export function PeopleCard({ op, ...card }: CardProps & { op: CredOperDraft }) {
  const people = op.interventions ?? [];
  return (
    <ReviewCard title="Interventions" icon="bi-people" {...card}>
      {people.length === 0 && <Empty>No people added.</Empty>}
      <ul className="list-unstyled d-flex flex-column gap-3 mb-0">
        {people.map((person, index) => {
          const docs = person.entity?.documents ?? [];
          return (
            <li key={person.correlationID ?? index}>
              <Lead avatar name={interventionName(person)} detail={ROLE_LABELS[interventionRole(person)]} />
              <MoreDetails label="Show details">
                <Fields>
                  <Field label="NIF" value={vatOf(person)} />
                  <Field label="Birth date" value={person.person?.birthDate?.slice(0, 10)} />
                  {docs.map((doc, docIndex) => {
                    // Without a name, documents are told apart by their position
                    const name = doc.documentName?.trim() || doc.typeLabel || `Document ${docIndex + 1}`;
                    return (
                      <Fragment key={doc.correlationID ?? docIndex}>
                        <Field label={`${name} number`} value={doc.legalDocNumber} />
                        <Field label={`${name} expiry`} value={doc.validDate?.slice(0, 10)} />
                      </Fragment>
                    );
                  })}
                  <Field label="E-mail" value={person.entityEmail?.email} />
                  <Field label="Phone" value={person.entityMobilePhone?.phoneNumber} />
                  <Field label="Landline" value={person.entityLandlinePhone?.phoneNumber} />
                </Fields>
              </MoreDetails>
            </li>
          );
        })}
      </ul>
    </ReviewCard>
  );
}

/** The insurances, as one gallery: type, who / what is insured, driver and protections */
export function InsurancesCard({ op, title, ...card }: CardProps & { op: CredOperDraft; title: string }) {
  const protectionTypes = useGetInsuranceTypesQuery("CreditProtection");
  const carTypes = useGetInsuranceTypesQuery("Car");
  const typeName = (ins: Insurance) =>
    (ins.kind === "car" ? carTypes.data : protectionTypes.data)?.find((t) => t.id === ins.insuranceTypeId)?.name ??
    "Insurance";

  return (
    <GalleryCard
      title={title}
      icon="bi-shield-check"
      empty="No insurances added."
      items={op.insurances.map((ins) => ({
        key: ins.id,
        label: typeName(ins),
        content: (
          <Fields>
            <Field label="Insurance" value={typeName(ins)} />
            <Field label="Kind" value={ins.kind === "car" ? "Car insurance" : "Credit protection"} />
            <Field label={ins.kind === "car" ? "Vehicle" : "Insured person"} value={insuredLabel(ins, op) ?? "Link missing"} />
            {ins.kind === "car" && (
              <>
                <Field label="Driver" value={ins.driver.mainDriverIsCustomer ? "The customer" : ins.driver.name} />
                {!ins.driver.mainDriverIsCustomer && <Field label="Driver license" value={ins.driver.licenseNumber} />}
                <Field label="License expiry" value={ins.driver.licenseExpiryDate} />
                <Field label="Protections" value={ins.protectionIds.length} />
              </>
            )}
          </Fields>
        ),
      }))}
      {...card}
    />
  );
}

export function FinancingCard({
  op,
  options,
  ...card
}: CardProps & { op: CredOperDraft; options: QuotationDataProps["options"] }) {
  // Worked out by the API (retake, calculate): shown, never typed
  const asset = op.assets?.[0] as (CredOperAssetDto & { building?: { taxAmount?: number | null } | null }) | undefined;
  const taxAmount = asset?.equipment?.taxAmount ?? asset?.building?.taxAmount;
  // The amounts and the term are in the overview above
  return (
    <ReviewCard title="Financing details" icon="bi-cash-coin" {...card}>
      <Fields>
        <Field label="Financial product" value={labelOf(options?.financialProducts, op.financialProduct)} />
        <Field label="Contract classification" value={labelOf(options?.credOperClassifications, op.credOperClassification)} />
        {asset?.baseAmount != null && <Field label="Base amount" value={money.format(asset.baseAmount)} />}
        {taxAmount != null && <Field label="Tax" value={money.format(taxAmount)} />}
      </Fields>
    </ReviewCard>
  );
}
