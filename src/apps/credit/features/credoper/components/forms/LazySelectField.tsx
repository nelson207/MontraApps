import SelectField from "@platform/components/ui/SelectField";
import { optionLabel, type PagedList } from "../../hooks/useEntityOptions";

type Item = { id?: number | null; abbreviation?: string | null; description?: string | null };

type Props<T extends Item> = {
  id: string;
  label: string;
  value: number | null | undefined;
  list: PagedList<T>;
  onPick: (item: T, label: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  invalidMessage?: string | null;
  /** The name of the value, when its item may not be among those loaded */
  selectedLabel?: string | null;
};

/** A searchable, lazy-loading list of the API's: sends the item's id */
export default function LazySelectField<T extends Item>({ id, label, value, list, onPick, required, disabled, placeholder, invalidMessage, selectedLabel }: Props<T>) {
  const loaded = list.items.find((item) => item.id === value);
  return (
    <SelectField
      id={id}
      label={label}
      required={required}
      disabled={disabled}
      placeholder={placeholder}
      invalidMessage={invalidMessage}
      value={value}
      options={list.items.map((item) => ({ value: item.id, label: optionLabel(item) }))}
      selectedLabel={loaded ? optionLabel(loaded) : (selectedLabel ?? (value != null ? "Selected" : undefined))}
      isLoading={list.isLoading}
      isLoadingMore={list.isLoadingMore}
      hasMore={list.hasMore}
      onLoadMore={list.loadMore}
      onSearchChange={list.setSearch}
      onChange={(e) => {
        const item = list.items.find((candidate) => String(candidate.id) === e.target.value);
        if (item) onPick(item, optionLabel(item));
      }}
    />
  );
}
