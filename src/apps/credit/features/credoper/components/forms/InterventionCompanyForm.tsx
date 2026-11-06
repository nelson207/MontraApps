import { selectCredoper, useAppDispatch, useAppSelector } from "@credit/store";
import type { CompanyDto } from "@platform/api/legacy/legacyApi";
import InputField from "@platform/components/ui/InputField";
import SelectField from "@platform/components/ui/SelectField";
import { useCountryOptions } from "../../hooks/useEntityOptions";
import type { InterventionFormProps } from "../../types/credoperTypes";
import { setInterventionDetailField } from "../../utils/fieldSetters";
import { toLocalDate } from "../../validation/localDate";

/** A number typed: nothing is null */
const numberOrNull = (text: string) => (text === "" ? null : Number(text));

// What only a company has, in place of the person's details (entity.kind decides, never the user).
// Its name, legal form and activity are in Details.
export default function InterventionCompanyForm({ index = 0, intervention }: InterventionFormProps) {
  const dispatch = useAppDispatch();
  const credoper = useAppSelector(selectCredoper);
  const { options: countries, isLoading: loadingCountries } = useCountryOptions();
  const company = intervention?.company;
  const id = (field: string) => `intervention-${index}-${field}`;
  const set = <K extends keyof CompanyDto>(field: K, value: CompanyDto[K]) => setInterventionDetailField(dispatch, credoper, index, "company", field, value);

  return (
    <div className="mb-3">
      <h6 className="border-bottom pb-2">Company details</h6>

      <div className="row g-3">
        <div className="col-md-4">
          <SelectField
            id={id("company-country")}
            label="Country"
            isLoading={loadingCountries}
            value={company?.countryId ?? ""}
            options={countries}
            onChange={(e) => set("countryId", e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <InputField id={id("registry-number")} label="Registry number" value={company?.registryNumber ?? ""} onChange={(e) => set("registryNumber", e.target.value)} />
        </div>
        <div className="col-md-4">
          <InputField id={id("begin-year")} label="Begin year" type="number" value={company?.beginYear ?? ""} onChange={(e) => set("beginYear", numberOrNull(e.target.value))} />
        </div>
        <div className="col-md-4">
          <InputField
            id={id("activity-begin-date")}
            label="Activity begin date"
            type="date"
            value={toLocalDate(company?.activityBeginDate) ?? ""}
            onChange={(e) => set("activityBeginDate", e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <InputField id={id("equity-capital")} label="Equity capital" type="number" min={0} value={company?.equityCapital ?? ""} onChange={(e) => set("equityCapital", numberOrNull(e.target.value))} />
        </div>
        <div className="col-md-4">
          <InputField id={id("employees")} label="Employees" type="number" min={0} value={company?.employees ?? ""} onChange={(e) => set("employees", numberOrNull(e.target.value))} />
        </div>
        <div className="col-12">
          <div className="form-check mb-3">
            <input id={id("vat-payer")} type="checkbox" className="form-check-input" checked={!!company?.isVATPayer} onChange={(e) => set("isVATPayer", e.target.checked)} />
            <label htmlFor={id("vat-payer")} className="form-check-label">
              Pays VAT
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
