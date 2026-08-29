module.exports = async function handler(req, res) {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const routePath = url.searchParams.get("path");
  if (routePath) {
    url.searchParams.delete("path");
    req.url = `/api/${routePath}${url.search}`;
  }
  const api = await import("../apps/api/src/server.mjs");
  return api.default(req, res);
};
