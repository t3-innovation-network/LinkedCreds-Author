/**
 * Custom error class for timeout-related exceptions
 * @extends Error
 */
class TimeoutError extends Error {
  constructor() {
    var msg = "Operation timed out"
    super(msg)
    this.name = "TimeoutError"
    this.message = msg
    Object.setPrototypeOf(this, TimeoutError.prototype)
  }

  /**
   * Checks if an error is a TimeoutError
   * @param error - The error to check
   */
  static isTimeoutError(error: unknown): error is TimeoutError {
    return error instanceof TimeoutError;
  }
}

/**
 * Configuration options for timeout behavior
 */
interface TimeoutOptions {
  /** Timeout duration in milliseconds */
  timeoutMs: number;
  /** Whether the operation supports abortion */
  abortable?: boolean;
  /** Optional callback to execute on timeout */
  onTimeout?: () => void;
}

/**
 * Wraps a promise with a timeout mechanism
 * @template T - The type of the promise result
 * @param promise - The promise to wrap
 * @param options - Timeout configuration options
 * @returns A promise that will reject if the timeout is exceeded
 * @throws {TimeoutError} When the operation times out
 *
 * @example
 * // Basic usage
 * const result = await withTimeout(
 *   fetch('https://api.example.com/data'),
 *   { timeoutMs: 5000 }
 * );
 *
 * // With abort signal
 * const result = await withTimeout(
 *   fetch('https://api.example.com/data'),
 *   { timeoutMs: 5000, abortable: true }
 * );
 */
async function withTimeout<T>(
  promise: Promise<T>,
  options: TimeoutOptions
): Promise<T> {
  const { timeoutMs, abortable = false, onTimeout } = options;

  if (timeoutMs <= 0) {
    throw new Error("Timeout must be greater than 0");
  }

  if (abortable) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      onTimeout?.();
    }, timeoutMs);

    try {
      const result = await promise;
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new TimeoutError();
      }
      throw error;
    }
  }

  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      const timeoutId = setTimeout(() => {
        onTimeout?.();
        reject(new TimeoutError());
      }, timeoutMs);
    }),
  ]);
}

export type { TimeoutOptions, TimeoutError }
export { withTimeout }
