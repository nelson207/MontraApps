// Server-driven field rules: every part of an operation carries `metadataResponse`
// ({ jsonName, isRequired, isVisible, isReadOnly }) describing its fields.

export type FieldMeta = {
  jsonName?: string | null;
  isRequired?: boolean;
  isVisible?: boolean;
  isReadOnly?: boolean;
};

export type FieldRule = { visible: boolean; required: boolean; readOnly: boolean };

/** Field path → message, e.g. "customerName", "assets.0.equipment.registrationDate". */
export type FieldErrors = Record<string, string>;

export const REQUIRED_MESSAGE = "This field is required.";

/** The server's rule for a field; no metadata → visible, optional, editable. */
export function fieldRule(metadata: FieldMeta[] | null | undefined, jsonName: string): FieldRule {
  const meta = metadata?.find((m) => m.jsonName === jsonName);
  return {
    visible: meta?.isVisible ?? true,
    required: meta?.isRequired ?? false,
    readOnly: meta?.isReadOnly ?? false,
  };
}

/** Only "nothing entered" is empty: 0 and false are real values. */
export function isEmptyValue(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === "string" && value.trim() === "");
}

/** Hidden fields are never validated. */
export function requiredError(rule: FieldRule, value: unknown): string | null {
  return rule.visible && rule.required && isEmptyValue(value) ? REQUIRED_MESSAGE : null;
}

/** Adds `message` under `key` when it's not null (the first message of a key wins). */
export function addError(errors: FieldErrors, key: string, message: string | null) {
  if (message && !errors[key]) errors[key] = message;
}

/** Required check for one field, driven by its part's metadata. */
export function checkRequired(
  errors: FieldErrors,
  metadata: FieldMeta[] | null | undefined,
  jsonName: string,
  key: string,
  value: unknown,
) {
  addError(errors, key, requiredError(fieldRule(metadata, jsonName), value));
}
