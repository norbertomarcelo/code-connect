const UNIQUE_VIOLATION = '23505';

// Drizzle wraps driver errors in DrizzleQueryError, keeping the original as `cause`.
export function isUniqueViolation(error: unknown): boolean {
  const { code, cause } = error as {
    code?: string;
    cause?: { code?: string };
  };
  return code === UNIQUE_VIOLATION || cause?.code === UNIQUE_VIOLATION;
}
