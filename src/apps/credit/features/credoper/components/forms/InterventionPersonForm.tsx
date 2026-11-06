import { selectCredoper, useAppDispatch, useAppSelector } from "@credit/store";
import type { PersonDto } from "@platform/api/legacy/legacyApi";
import InputField from "@platform/components/ui/InputField";
import SelectField from "@platform/components/ui/SelectField";
import { useCountryOptions, useGenders, useMaritalStatuses, useProfessions } from "../../hooks/useEntityOptions";
import type { InterventionFormProps } from "../../types/credoperTypes";
import { setInterventionDetailField, updateIntervention } from "../../utils/fieldSetters";
import { toLocalDate } from "../../validation/localDate";
import LazySelectField from "./LazySelectField";

/** A number typed: nothing is null */
const numberOrNull = (text: string) => (text === "" ? null : Number(text));

export default function InterventionPersonForm({ index = 0, intervention, errors }: InterventionFormProps) {
  const dispatch = useAppDispatch();
  const credoper = useAppSelector(selectCredoper);
  const { options: countries, isLoading: loadingCountries } = useCountryOptions();
  const genders = useGenders();
  const maritalStatuses = useMaritalStatuses();
  const professions = useProfessions();
  const person = intervention?.person;
  const id = (field: string) => `intervention-${index}-${field}`;
  const set = <K extends keyof PersonDto>(field: K, value: PersonDto[K]) => setInterventionDetailField(dispatch, credoper, index, "person", field, value);

  return (
    <div className="mb-3">
      <h6 className="border-bottom pb-2">Person details</h6>

      <div className="row g-3">
        <div className="col-md-4">
          <InputField
            id={id("birth-date")}
            label="Birth date"
            invalidMessage={errors?.[`interventions.${intervention?.correlationID}.person.birthDate`]}
            type="date"
            value={toLocalDate(person?.birthDate) ?? ""}
            onChange={(e) => set("birthDate", e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <LazySelectField id={id("gender")} label="Gender" value={person?.genderId} list={genders} onPick={(item) => set("genderId", item.id ?? null)} />
        </div>
        <div className="col-md-4">
          <LazySelectField id={id("marital-status")} label="Marital status" value={person?.maritalStatusId} list={maritalStatuses} onPick={(item) => set("maritalStatusId", item.id ?? null)} />
        </div>
        <div className="col-md-4">
          <SelectField
            id={id("nationality")}
            label="Nationality"
            isLoading={loadingCountries}
            value={person?.countryId ?? ""}
            options={countries}
            onChange={(e) => set("countryId", e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <LazySelectField
            id={id("profession")}
            label="Profession"
            value={person?.professionId}
            list={professions}
            selectedLabel={person?.professionDescr}
            onPick={(item, label) =>
              updateIntervention(dispatch, credoper, index, (current) => ({
                ...current,
                person: { ...current.person, professionId: item.id ?? null, professionDescr: label },
              }))
            }
          />
        </div>
        <div className="col-md-4">
          <InputField
            id={id("disposable-income")}
            label="Monthly disposable income"
            type="number"
            min={0}
            value={person?.disposableIncome ?? ""}
            onChange={(e) => set("disposableIncome", numberOrNull(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}
