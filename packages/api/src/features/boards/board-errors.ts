export class BoardNotFoundError extends Error {
  constructor(boardId: string) {
    super(`Board ${boardId} was not found`);
    this.name = "BoardNotFoundError";
  }
}
