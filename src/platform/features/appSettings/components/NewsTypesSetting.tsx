import { useGetApiCatalogNewsTypesQuery } from "@platform/api/generated/MontraPOSApi";
import { CATALOG_CACHE, labelOf, offered, selectable, useSeen, withSaved } from "./choices";
import { AllOrNone, ChoiceLabel, LoadError, Loading, SectionHeader } from "./settingsParts";

// Settings → Application → News: the news types the app's portal shows, from the whole catalog
// (GET /api/catalog/news-types?includeInvalid=true). An expired type stays listed while ticked.
function NewsTypesSetting({ value, onChange }: { value: number[]; onChange: (next: number[]) => void }) {
  const { currentData, isFetching, isError, error, refetch } = useGetApiCatalogNewsTypesQuery({ includeInvalid: true }, CATALOG_CACHE);
  const seen = useSeen(value);
  const listed = (currentData ?? []).flatMap((t) =>
    typeof t.id === "number" ? [{ id: t.id, label: labelOf(t, `Type ${t.id}`), isValid: t.isValid !== false }] : [],
  );
  const choices = withSaved(offered(listed, seen), seen);
  const toggle = (id: number, on: boolean) => onChange(on ? [...value, id] : value.filter((v) => v !== id));

  return (
    <section>
      <SectionHeader
        title="News"
        help="The types of news shown on the home page and in the news search."
        warning={value.length === 0 ? "No type is ticked: no news will be shown." : null}
      />
      {isError ? (
        <LoadError error={error} text="Couldn't load the news types." onRetry={() => void refetch()} />
      ) : isFetching && !currentData ? (
        <Loading />
      ) : choices.length === 0 ? (
        <div className="small text-body-secondary">There are no news types.</div>
      ) : (
        <>
          <div className="d-flex flex-wrap align-items-center gap-3 mb-2 small">
            <span className="text-body-secondary">
              {value.length} of {choices.length} ticked
            </span>
            <AllOrNone label="news types" onAll={() => onChange(selectable(choices, value))} onNone={() => onChange([])} />
          </div>
          <div className="app-setting-choices">
            {choices.map((choice) => {
              const id = `app-setting-newsTypes-${choice.id}`;
              const checked = value.includes(choice.id);
              return (
                <div className="form-check" key={choice.id}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={id}
                    checked={checked}
                    // An expired or unknown type can only be unticked
                    disabled={!checked && (choice.expired || choice.unknown)}
                    onChange={(e) => toggle(choice.id, e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor={id}>
                    <ChoiceLabel choice={choice} />
                  </label>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

export default NewsTypesSetting;
