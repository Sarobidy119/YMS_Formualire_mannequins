/**
 * Error with an associated HTTP status code.
 * The global error handler in index.ts reads `statusCode` to return the
 * right HTTP status instead of defaulting everything to 500.
 */
export class HttpError extends Error {
  readonly statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.name = 'HttpError'
    this.statusCode = statusCode
  }
}
