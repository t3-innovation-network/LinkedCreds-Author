/** Unwrap vc-storage Drive envelope `{ body: "<json>" }` or return raw VC JSON. */
export function parseVcPayloadFromDrive(fileData: unknown): Record<string, unknown> | null {
  if (!fileData) return null
  let vcData: unknown = fileData
  if (typeof vcData === 'string') {
    vcData = JSON.parse(vcData)
  }
  const envelope = vcData as { body?: string }
  if (envelope?.body && typeof envelope.body === 'string') {
    vcData = JSON.parse(envelope.body)
  }
  return vcData as Record<string, unknown>
}
