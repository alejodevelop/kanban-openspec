import { Route, Routes } from "react-router-dom";

import { BoardRoute } from "./board-route";
import { HomeRoute } from "./home-route";
import { NotFoundRoute } from "./not-found-route";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/boards/:boardId" element={<BoardRoute />} />
      <Route path="*" element={<NotFoundRoute />} />
    </Routes>
  );
};
