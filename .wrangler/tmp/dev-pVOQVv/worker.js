var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/worker.js
var encoder = new TextEncoder();
var USERS = [];
var PASSWORDS = /* @__PURE__ */ new Map();
var nextUserId = 1;
var FAVORITES = {};
var nextFavoriteId = 1;
var PRODUCTS = [
  { id: 1, title: "Camiseta Estilosa", price: 49.9, image: "https://via.placeholder.com/300", rating: 4.5 },
  { id: 2, title: "T\xEAnis Confort\xE1vel", price: 129.9, image: "https://via.placeholder.com/300", rating: 4.7 },
  { id: 3, title: "Mochila Resistente", price: 89, image: "https://via.placeholder.com/300", rating: 4.3 }
];
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}
__name(jsonResponse, "jsonResponse");
async function readJson(request) {
  try {
    return await request.json();
  } catch (e) {
    return null;
  }
}
__name(readJson, "readJson");
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (path === "/auth/register" && request.method === "POST") {
      const body = await readJson(request);
      if (!body || !body.email || !body.password || !body.name) {
        return jsonResponse({ message: "Dados inv\xE1lidos" }, 400);
      }
      if (USERS.find((u) => u.email === body.email)) {
        return jsonResponse({ message: "Email j\xE1 cadastrado" }, 409);
      }
      const user = { id: nextUserId++, name: body.name, email: body.email };
      USERS.push(user);
      PASSWORDS.set(user.email, body.password);
      FAVORITES[user.id] = [];
      return jsonResponse({ token: "demo-token", client: user }, 201);
    }
    if (path === "/auth/login" && request.method === "POST") {
      const body = await readJson(request);
      if (!body || !body.email || !body.password) return jsonResponse({ message: "Credenciais inv\xE1lidas" }, 400);
      const user = USERS.find((u) => u.email === body.email);
      if (!user || PASSWORDS.get(body.email) !== body.password) return jsonResponse({ message: "Email ou senha incorretos" }, 401);
      return jsonResponse({ token: "demo-token", client: user });
    }
    if (path === "/products" && request.method === "GET") {
      return jsonResponse(PRODUCTS);
    }
    if (path === "/clients" && request.method === "GET") {
      return jsonResponse(USERS);
    }
    if (path === "/clients" && request.method === "POST") {
      const body = await readJson(request);
      if (!body || !body.email || !body.name) return jsonResponse({ message: "Dados inv\xE1lidos" }, 400);
      if (USERS.find((u) => u.email === body.email)) return jsonResponse({ message: "Email j\xE1 cadastrado" }, 409);
      const user = { id: nextUserId++, name: body.name, email: body.email };
      USERS.push(user);
      PASSWORDS.set(user.email, body.password || "demo");
      FAVORITES[user.id] = [];
      return jsonResponse(user, 201);
    }
    const favMatch = path.match(/^\/clients\/(\d+)\/favorites(?:\/(\d+))?$/);
    if (favMatch) {
      const clientId = Number(favMatch[1]);
      const favId = favMatch[2] ? Number(favMatch[2]) : null;
      if (!USERS.find((u) => u.id === clientId)) return jsonResponse({ message: "Cliente n\xE3o encontrado" }, 404);
      if (request.method === "GET") {
        return jsonResponse(FAVORITES[clientId] || []);
      }
      if (request.method === "POST") {
        const body = await readJson(request);
        const productId = body?.productId;
        if (!productId) return jsonResponse({ message: "productId obrigat\xF3rio" }, 400);
        const favorite = { id: nextFavoriteId++, productId };
        FAVORITES[clientId].push(favorite);
        return jsonResponse(favorite, 201);
      }
      if (request.method === "DELETE" && favId) {
        const list = FAVORITES[clientId];
        const idx = list.findIndex((f) => f.id === favId);
        if (idx === -1) return jsonResponse({}, 204);
        list.splice(idx, 1);
        return jsonResponse({}, 204);
      }
    }
    try {
      return await env.ASSETS.fetch(request);
    } catch (err) {
      return new Response("Not found", { status: 404 });
    }
  }
};

// ../Users/w-san/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../Users/w-san/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-W8VQp7/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../Users/w-san/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-W8VQp7/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
