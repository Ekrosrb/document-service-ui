/**
 * Error thrown for a failed API call. Carries the HTTP status (null when no response
 * arrived) and the server's error metadata, such as field validation messages.
 */
export class ApiError extends Error {
  constructor(message, { status = null, metadata = {}, cause } = {}) {
    super(message, { cause })
    this.name = 'ApiError'
    this.status = status
    this.metadata = metadata
  }

  /** Builds an ApiError from an axios error and the server's GeneralErrorResponse body. */
  static from(error) {
    const body = error.response?.data
    return new ApiError(body?.message ?? error.message, {
      status: error.response?.status ?? null,
      metadata: body?.metadata ?? {},
      cause: error,
    })
  }
}
