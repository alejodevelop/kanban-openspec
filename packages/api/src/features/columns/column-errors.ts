export class ColumnNotFoundError extends Error {
  constructor(columnId: string) {
    super(`Column ${columnId} was not found`);
    this.name = "ColumnNotFoundError";
  }
}
