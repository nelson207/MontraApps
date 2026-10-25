import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import SelectField from "@platform/components/ui/SelectField";
import {
  changeLevel,
  clearLevel,
  isComplete,
  lockedMember,
  ownMemberIn,
  onlyOption,
  type ContextSelection,
  type HierarchyLevel,
  type HierarchyNode,
  type WorkProfile,
} from "../hierarchy";
import {
  useMemberOptions,
  useOrganizationOptions,
  useUnitOptions,
  type PagedOptions,
} from "../hooks/useHierarchyOptions";
import { rememberNodes } from "../nodeLabels";
import { useWorkContextTexts } from "../useWorkContextTexts";

type Props = {
  value: ContextSelection;
  profile: WorkProfile;
  onChange: (next: ContextSelection) => void;
  /** Prefix for element ids, so several instances can live on one page */
  idPrefix: string;
  /** Grid column for each select, e.g. "col-12" (stacked) or "col-md-4" (one row) */
  columnClassName?: string;
  /** Validation messages per level (shown under each select) */
  errors?: Partial<Record<HierarchyLevel, string | null>>;
  /** Filter mode: every level offers "All …" (empty) and no defaults are filled in */
  allowAll?: boolean;
};

/** SelectField value of "All …" in filter mode */
const ALL = "";

type LevelProps = {
  id: string;
  label: string;
  options: PagedOptions;
  value: HierarchyNode | null;
  disabled: boolean;
  placeholder: string;
  /** Filter mode: the "All …" option's label */
  allLabel?: string;
  formatLabel?: (node: HierarchyNode) => string;
  onSearch: (search: string) => void;
  onSelect: (node: HierarchyNode) => void;
  onClear: () => void;
  invalidMessage?: string | null;
};

function LevelSelect({
  id,
  label,
  options,
  value,
  disabled,
  placeholder,
  allLabel,
  formatLabel = (node) => node.name,
  onSearch,
  onSelect,
  onClear,
  invalidMessage,
}: LevelProps) {
  const nodeOptions = options.items.map((node) => ({ value: node.id, label: formatLabel(node) }));
  return (
    <SelectField
      id={id}
      label={label}
      value={value?.id ?? (allLabel ? ALL : undefined)}
      selectedLabel={value ? formatLabel(value) : allLabel}
      options={allLabel ? [{ value: ALL, label: allLabel }, ...nodeOptions] : nodeOptions}
      placeholder={placeholder}
      disabled={disabled}
      isLoading={options.isLoading}
      onSearchChange={onSearch}
      hasMore={options.hasMore}
      isLoadingMore={options.isLoadingMore}
      onLoadMore={options.loadMore}
      invalidMessage={invalidMessage}
      onChange={(e) => {
        if (allLabel && e.target.value === ALL) return onClear();
        const node = options.items.find((n) => String(n.id) === e.target.value);
        if (node) onSelect(node);
      }}
    />
  );
}

/**
 * When a level is empty and its list (no search) has a single option, pick it,
 * so choosing a unit with one member fills the member too. Several options: the user chooses.
 */
function useAutoSelectOnly(options: PagedOptions, enabled: boolean, search: string, pick: (node: HierarchyNode) => void) {
  const only = enabled && search === "" && options.isSettled ? onlyOption(options) : null;

  useEffect(() => {
    if (only) pick(only);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run when a new default becomes available
  }, [only?.id]);
}

// Cascading, searchable, lazily loaded organization → unit → member selects, labelled by the app
// (Credit: Credit intermediary → Supplier → Vendor). Changing a level clears the levels below;
// a member (role) is always themselves.
function HierarchySelects({
  value,
  profile,
  onChange,
  idPrefix,
  columnClassName = "col-12",
  errors = {},
  allowAll = false,
}: Props) {
  const { t } = useTranslation("workContext");
  const texts = useWorkContextTexts();
  // A member (role) acts as themselves: their member node is fixed (when known)
  const isMember = !!lockedMember(profile, value.unit?.id);
  const [search, setSearch] = useState<Record<HierarchyLevel, string>>({
    organization: "",
    unit: "",
    member: "",
  });
  const searchFor = (level: HierarchyLevel) => (text: string) =>
    setSearch((prev) => ({ ...prev, [level]: text }));

  const organizations = useOrganizationOptions(search.organization);
  const units = useUnitOptions(value.organization?.id ?? null, search.unit);
  // A fixed member node needs no member list
  const members = useMemberOptions(isMember ? null : (value.unit?.id ?? null), search.member);

  // Defaults are only filled in after the user changes a level (never on mere display,
  // so opening an existing record with empty fields doesn't modify it), and never in a filter
  const [userChanged, setUserChanged] = useState(false);
  const filling = !allowAll && userChanged && !isComplete(value);

  const select = (level: HierarchyLevel) => (node: HierarchyNode) => {
    rememberNodes(level, [node]);
    onChange(changeLevel(value, level, node, profile));
  };
  const pickedByUser = (level: HierarchyLevel) => (node: HierarchyNode) => {
    setUserChanged(true);
    select(level)(node);
  };
  const clear = (level: HierarchyLevel) => () => onChange(clearLevel(value, level, profile));

  // After the user picks a level, the levels below with a single option fill themselves
  useAutoSelectOnly(units, filling && !!value.organization && !value.unit, search.unit, select("unit"));
  useAutoSelectOnly(members, filling && !!value.unit && !value.member, search.member, select("member"));

  // "(you)": the API says so (isMine), or it's the user's own node on this unit
  const ownId = ownMemberIn(profile, value.unit?.id)?.id ?? profile.self?.id;
  const all = (level: HierarchyLevel) => (allowAll ? t("all", { levels: texts.plural(level) }) : undefined);

  return (
    // gx only: SelectField already spaces itself vertically (mb-3)
    <div className="row gx-3">
      <div className={columnClassName}>
        <LevelSelect
          id={`${idPrefix}-organization`}
          label={texts.label("organization")}
          options={organizations}
          value={value.organization}
          placeholder={t("select", { level: texts.name("organization") })}
          allLabel={all("organization")}
          disabled={false}
          invalidMessage={errors.organization}
          onSearch={searchFor("organization")}
          onSelect={pickedByUser("organization")}
          onClear={clear("organization")}
        />
      </div>
      <div className={columnClassName}>
        <LevelSelect
          id={`${idPrefix}-unit`}
          label={texts.label("unit")}
          options={units}
          value={value.unit}
          placeholder={
            value.organization
              ? t("select", { level: texts.name("unit") })
              : t("selectFirst", { level: texts.name("organization") })
          }
          allLabel={all("unit")}
          disabled={!value.organization}
          invalidMessage={errors.unit}
          onSearch={searchFor("unit")}
          onSelect={pickedByUser("unit")}
          onClear={clear("unit")}
        />
      </div>
      <div className={columnClassName}>
        <LevelSelect
          id={`${idPrefix}-member`}
          label={texts.label("member")}
          options={members}
          value={value.member}
          placeholder={
            value.unit
              ? t("select", { level: texts.name("member") })
              : t("selectFirst", { level: texts.name("unit") })
          }
          allLabel={isMember ? undefined : all("member")}
          // A member (role) can only act as themselves
          disabled={isMember || !value.unit}
          formatLabel={(node) => (node.isMine || node.id === ownId ? t("you", { name: node.name }) : node.name)}
          invalidMessage={errors.member}
          onSearch={searchFor("member")}
          onSelect={pickedByUser("member")}
          onClear={clear("member")}
        />
      </div>
    </div>
  );
}

export default HierarchySelects;
