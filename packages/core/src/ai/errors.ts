/** Kastas när en AI-motor inte kan producera ett tolkbart svar. Delas av alla motorer. */
export class EngineError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "EngineError";
  }
}
