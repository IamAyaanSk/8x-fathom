import { z } from 'zod/v4'

interface ValidateEnvProps<T> {
  schema: T
  env: unknown
}

/**
 * Validates an environment object against a Zod schema.
 *
 * This function is considered **unsafe** because it throws a `ZodError`
 * if validation fails. Use it when invalid environment variables should
 * immediately terminate application startup.
 *
 * @param schema - The Zod schema describing the expected environment variables.
 * @param env - The environment object to valiurbo rudate (typically `process.env`).
 * @returns The validated and strongly typed environment object.
 * @throws {z4.$ZodError} If the environment does not satisfy the schema.
 */
function unsafeValidateEnv<T extends z.ZodObject>({
  schema,
  env
}: ValidateEnvProps<T>): z.infer<T> {
  return z.parse(schema, env)
}

type NODE_ENVIRONMENT = 'production' | 'development' | 'test'

/**
 * Returns `true` if the provided environment is `development`.
 *
 * Useful for enabling development-only behavior such as verbose logging,
 * debugging tools, and hot reloading.
 *
 * @param envVar - The current Node.js environment.
 * @returns Whether the environment is `development`.
 */
function isDevelopmentEnvironment(envVar: NODE_ENVIRONMENT): boolean {
  return envVar === 'development'
}

/**
 * Returns `true` if the provided environment is `production`.
 *
 *
 * @param envVar - The current Node.js environment.
 * @returns Whether the environment is `production`.
 */
function isProductionEnvironment(envVar: NODE_ENVIRONMENT): boolean {
  return envVar === 'production'
}

/**
 * Returns `true` if the provided environment is `test`.
 *
 *
 * @param envVar - The current Node.js environment.
 * @returns Whether the environment is `test`.
 */
function isTestEnvironment(envVar: NODE_ENVIRONMENT): boolean {
  return envVar === 'test'
}

export {
  unsafeValidateEnv,
  isDevelopmentEnvironment,
  isProductionEnvironment,
  isTestEnvironment
}
