export const LEGAL_DOCUMENT_TYPES = [
  { value: 1, label: "ID Card" },
  { value: 2, label: "Passport" },
  { value: 3, label: "VAT" },
  { value: 4, label: "Citizen Card" },
  { value: 5, label: "Other" },
] as const;

export const legalDocumentTypeName = (id?: number | null) =>
  LEGAL_DOCUMENT_TYPES.find((type) => type.value === id)?.label ?? "Legal document";