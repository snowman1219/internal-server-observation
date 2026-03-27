import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("servers/:serverName", "routes/servers.$serverName.tsx"),
] satisfies RouteConfig;
