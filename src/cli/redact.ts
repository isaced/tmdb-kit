export function maskSecret(value: string | undefined): string | null {
  if (!value) {
    return null
  }
  return value.length <= 4 ? '••••' : `••••${value.slice(-4)}`
}
