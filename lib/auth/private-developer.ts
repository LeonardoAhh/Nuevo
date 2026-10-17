const PRIVATE_DEVELOPER_EMAIL = "leo@adm.com"

export function hasPrivateDeveloperAccess(email: string | null | undefined): boolean {
  return email?.trim().toLowerCase() === PRIVATE_DEVELOPER_EMAIL
}
