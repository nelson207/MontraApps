import { useState, type ReactNode } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  useGetEquipmentBrandsQuery,
  useGetEquipmentCategoriesQuery,
  useGetEquipmentModelsQuery,
  useGetEquipmentStatesQuery,
  useGetEquipmentTypesQuery,
  useGetEquipmentVersionsQuery,
} from "@platform/features/equipment/api/equipmentApi";
import { labelOfCode } from "@platform/features/equipment/api/equipmentLists";
import { nodeFromId } from "@platform/features/workContext/nodeLabels";
import type { CodeAbbreviation } from "@platform/api/legacy/legacyApi";
import { money } from "../../hooks/useCalculation";
import { businessOf, equipmentModeOf, hasEquipment } from "../../model/business";
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

// Review cards: the Summary step (with Edit) and a converted proposal's Quotation step (read-only).

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
          {issues > 0 && <span className="badge rounded-pill text-bg-warning">{issues} to fix</span>}
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

export function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <>
      <dt>{label}</dt>
      <dd className={isBlank(value) ? "text-body-tertiary" : undefined}>{isBlank(value) ? "Not filled" : value}</dd>
    </>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="small text-body-tertiary mb-0">{children}</p>;
}

export function CustomerCard({ op, ...card }: CardProps & { op: CredOperDraft }) {
  const network = [
    nodeFromId("organization", op.creditIntermediaryStructNode)?.name,
    nodeFromId("unit", op.showRoomStructNode)?.name,
    nodeFromId("member", op.salePersonStructNode)?.name,
  ]
    .filter(Boolean)
    .join(" › ");

  return (
    <ReviewCard title="Customer" icon="bi-person" {...card}>
      <Fields>
        <Field label="Name" value={op.customerName} />
        <Field label="Fiscal number" value={op.customerVAT?.legalDocNumber} />
        <Field label="E-mail" value={op.customerEmail?.email} />
        <Field label="Mobile" value={op.customerPhone?.phoneNumber} />
        <Field label="Landline" value={op.customerLandLine?.phoneNumber} />
        <Field label="Commercial network" value={network} />
      </Fields>
    </ReviewCard>
  );
}

/** The type of business (Auto credit, Renting, …) */
export function BusinessCard({ op, ...card }: CardProps & { op: CredOperDraft }) {
  const business = businessOf(op);
  return (
    <ReviewCard title="Business" icon={business?.icon ?? "bi-grid"} {...card}>
      <Fields>
        <Field label="Type" value={business?.label} />
        <Field label="Includes" value={business?.description} />
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

/** One vehicle's fields: brand → version, type, plate…, km, engine size, doors, commercial value */
function VehicleFields({ op, index }: { op: CredOperDraft; index: number }) {
  const equipment = op.assets?.[index]?.equipment;
  const renting = equipmentModeOf(op) === "multiple";
  // The same cached lists as the equipment detail (brand, model and version are codes)
  const companyId = op.aplCompanyId;
  const typeId = equipment?.equipmentTypeId;
  const categoryId = equipment?.equipmentCategoryId;
  const brand = equipment?.brand;
  const model = equipment?.model;
  const types = useGetEquipmentTypesQuery({ companyId });
  const states = useGetEquipmentStatesQuery();
  const categories = useGetEquipmentCategoriesQuery(typeId ? { companyId, equipmentTypeId: typeId } : skipToken);
  const brands = useGetEquipmentBrandsQuery(typeId && categoryId ? { equipmentTypeId: typeId, categoryId } : skipToken);
  const models = useGetEquipmentModelsQuery(typeId && categoryId && brand ? { equipmentTypeId: typeId, categoryId, brand } : skipToken);
  const versions = useGetEquipmentVersionsQuery(
    typeId && categoryId && brand && model ? { equipmentTypeId: typeId, categoryId, brand, model } : skipToken,
  );
  const label = (list: { data?: Parameters<typeof labelOfCode>[0] }, code?: number | string | null) =>
    labelOfCode(list.data, code) ?? (code == null || code === "" ? null : String(code));
  return (
    <Fields>
      <Field label="Brand" value={label(brands, brand)} />
      <Field label="Model" value={label(models, model)} />
      <Field label="Version" value={label(versions, equipment?.version)} />
      <Field label="Type" value={label(types, equipment?.equipmentTypeId)} />
      <Field label="Category" value={label(categories, equipment?.equipmentCategoryId)} />
      <Field label="State" value={label(states, equipment?.equipmentStateId)} />
      <Field label="License plate" value={equipment?.licencePlate} />
      <Field label="Registration" value={equipment?.registrationDate?.slice(0, 10)} />
      <Field label="Description" value={equipment?.description} />
      {renting && <Field label="Amount" value={amount(equipment?.netAmount)} />}
      <Field label="Km" value={equipment?.odometer != null ? `${equipment.odometer.toLocaleString("pt-PT")} km` : null} />
      <Field label="Engine size" value={equipment?.enginesize != null ? `${equipment.enginesize} cc` : null} />
      <Field label="Doors" value={equipment?.doors} />
      <Field label="Commercial value" value={amount(equipment?.baseMarketValue)} />
    </Fields>
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

/** The people of a proposal (customer, second holder, guarantors), as one gallery */
export function PeopleCard({ op, ...card }: CardProps & { op: CredOperDraft }) {
  return (
    <GalleryCard
      title="Interventions"
      icon="bi-people"
      empty="No people added."
      items={(op.interventions ?? []).map((person, index) => {
        const doc = person.entity?.legalDocs?.[0];
        return {
          key: person.correlationID ?? String(index),
          label: `${interventionName(person)} · ${ROLE_LABELS[interventionRole(person)]}`,
          content: (
            <Fields>
              <Field label="Role" value={ROLE_LABELS[interventionRole(person)]} />
              <Field label="Name" value={person.entity?.fullName} />
              <Field label="Birth date" value={person.person?.birthDate?.slice(0, 10)} />
              <Field label="Document" value={doc?.legalDocNumber} />
              <Field label="Document expiry" value={doc?.validDate?.slice(0, 10)} />
              <Field label="E-mail" value={person.entityEmail?.email} />
              <Field label="Mobile" value={person.entityMobilePhone?.phoneNumber} />
            </Fields>
          ),
        };
      })}
      {...card}
    />
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
  const equipment = op.assets?.[0]?.equipment;
  const term = op.conditions?.[0]?.term;
  const renting = equipmentModeOf(op) === "multiple";
  const base = renting ? (op.assets ?? []).reduce((sum, a) => sum + (a.equipment?.netAmount ?? 0), 0) : equipment?.netAmount;
  const baseLabel = renting ? "Total of the vehicles" : hasEquipment(op) ? "Equipment amount" : "Loan amount";
  return (
    <ReviewCard title="Financing" icon="bi-cash-coin" {...card}>
      <Fields>
        <Field label="Customer type" value={labelOf(options?.credOperClassifications, op.credOperClassification)} />
        <Field label="Financial product" value={labelOf(options?.financialProducts, op.financialProduct)} />
        <Field label="Financed amount" value={op.amount != null ? money.format(op.amount) : null} />
        <Field label={baseLabel} value={base != null ? money.format(base) : null} />
        <Field
          label="Initial entry"
          value={
            equipment?.retakeAmount != null
              ? `${money.format(equipment.retakeAmount)} (${equipment.retakePercentage ?? 0} %)`
              : null
          }
        />
        <Field label="Term" value={term != null ? `${term} months` : null} />
      </Fields>
    </ReviewCard>
  );
}
