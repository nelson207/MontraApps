export function getFieldMetadata(
  metadata: any[] | null | undefined,
  jsonName: string,
) {
  return metadata?.find((m) => m.jsonName === jsonName);
}
