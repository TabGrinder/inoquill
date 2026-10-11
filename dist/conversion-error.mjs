export class ConversionError extends Error {
  constructor(message, line = 1) {
    super(message);
    this.line = line;
  }
}
