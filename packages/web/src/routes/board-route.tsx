import { useParams } from "react-router-dom";

import { BoardPage } from "../features/boards/board-page";
import { NotFoundRoute } from "./not-found-route";

export const BoardRoute = () => {
  const { boardId } = useParams();

  if (boardId === undefined) {
    return <NotFoundRoute />;
  }

  return <BoardPage boardId={boardId} />;
};
