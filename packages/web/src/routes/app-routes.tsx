import { Route, Routes } from "react-router-dom";

import { HomeRoute } from "./home-route";
import { NotFoundRoute } from "./not-found-route";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="*" element={<NotFoundRoute />} />
    </Routes>
  );
};
