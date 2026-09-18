/**
 * There is no `username` column yet. The handle shown in the UI (`@julio`) is
 * derived from the email local part so the API never has to expose the email
 * of every author on a public feed. Handles are NOT unique: two users can
 * collide. Promoting this to a real unique column is future work.
 */
export function toHandle(email: string): string {
  const local = email.split('@')[0] ?? '';
  const slug = local.toLowerCase().replace(/[^a-z0-9._-]/g, '');
  return slug || 'usuario';
}
