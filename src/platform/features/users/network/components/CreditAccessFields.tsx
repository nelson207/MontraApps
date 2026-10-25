import type { AccessErrors } from "@platform/features/users/usersAccess";
import { scopeForLevel, type CreditAccess } from "../userLevels";
import LevelPicker from "./LevelPicker";
import UserScopeFields from "./UserScopeFields";

type Props = { value: CreditAccess; onChange: (next: CreditAccess) => void; errors: AccessErrors };

// Credit's "Access" section of the shared user form: level A–E and the network part it's tied to.
function CreditAccessFields({ value, onChange, errors }: Props) {
  return (
    <>
      <LevelPicker
        value={value.level}
        // Keep what still applies (e.g. D → B keeps the intermediary), drop the rest
        onChange={(level) => onChange({ level, ...scopeForLevel(level, value) })}
      />
      <UserScopeFields
        level={value.level}
        value={{ intermediary: value.intermediary, supplier: value.supplier }}
        onChange={(scope) => onChange({ ...value, ...scope })}
        errors={{ intermediary: errors.intermediary ?? null, supplier: errors.supplier ?? null }}
      />
    </>
  );
}

export default CreditAccessFields;
