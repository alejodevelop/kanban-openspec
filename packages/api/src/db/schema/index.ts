import { boards } from "./boards";
import { cards } from "./cards";
import { columns } from "./columns";

/**
 * Shared data-model entrypoint.
 *
 * Backend example:
 * `import { schema } from "./db/schema";`
 *
 * Future data-access layers can import only what they need:
 * `import { boards, columns, cards } from "./db/schema";`
 */
export { boards, cards, columns };

export const schema = {
  boards,
  columns,
  cards,
};
