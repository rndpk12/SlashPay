globalThis.__nitro_main__ = import.meta.url;
import { i as HTTPError, n as defineLazyEventHandler, t as H3Core } from "./_libs/h3+rou3+srvx.mjs";
import { t as HookableCore } from "./_libs/hookable.mjs";
import { r as FastResponse } from "./_libs/h3-v2+rou3+srvx.mjs";
//#region #nitro-vite-setup
function lazyService(loader) {
	let promise, mod;
	return { fetch(req) {
		if (mod) return mod.fetch(req);
		if (!promise) promise = loader().then((_mod) => mod = _mod.default || _mod);
		return promise.then((mod) => mod.fetch(req));
	} };
}
var services = { ["ssr"]: lazyService(() => import("./_ssr/ssr.mjs")) };
globalThis.__nitro_vite_envs__ = services;
//#endregion
//#region #nitro/virtual/public-assets-data
var public_assets_data_default = {
	"/robots.txt": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"a0-CKGXSIe7TSsqDTmGm/nY1t/o5d0\"",
		"mtime": "2026-09-24T13:50:14.163Z",
		"size": 160,
		"path": "../public/robots.txt"
	},
	"/slash-pay.svg": {
		"type": "image/svg+xml",
		"etag": "\"10f-KnTFUpgn0q5qycL/sFci1qMt5ho\"",
		"mtime": "2026-09-24T13:50:14.163Z",
		"size": 271,
		"path": "../public/slash-pay.svg"
	},
	"/favicon.ico": {
		"type": "image/vnd.microsoft.icon",
		"etag": "\"4f95-3RXc3p2mhEAs1WBwaIvE0Y0uu0Y\"",
		"mtime": "2026-09-24T13:50:14.163Z",
		"size": 20373,
		"path": "../public/favicon.ico"
	},
	"/assets/dashboard-Hl-F9CLW.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1fe6-Lav5p435+/Py9TP79x95Iz5HW/Q\"",
		"mtime": "2026-09-24T13:50:13.920Z",
		"size": 8166,
		"path": "../public/assets/dashboard-Hl-F9CLW.js"
	},
	"/assets/label-MCtIs9FM.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"66f-aHlajyWXI6GOD37V8rvwguz9Dfk\"",
		"mtime": "2026-09-24T13:50:13.920Z",
		"size": 1647,
		"path": "../public/assets/label-MCtIs9FM.js"
	},
	"/assets/login-DZUOuHt7.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1063-9+r/MBrbHxz85tWoCyJ0SiEl9hA\"",
		"mtime": "2026-09-24T13:50:13.920Z",
		"size": 4195,
		"path": "../public/assets/login-DZUOuHt7.js"
	},
	"/assets/google-logo-v2-CZqw6NSK.webp": {
		"type": "image/webp",
		"etag": "\"2f00-1w10IqJn6PTmXiBobZab9kBiubM\"",
		"mtime": "2026-09-24T13:50:13.921Z",
		"size": 12032,
		"path": "../public/assets/google-logo-v2-CZqw6NSK.webp"
	},
	"/assets/paypal-logo-CCUi1x-V.png": {
		"type": "image/png",
		"etag": "\"1b33-poLkDFjQOlAq/duKO7POx5kG6cw\"",
		"mtime": "2026-09-24T13:50:13.921Z",
		"size": 6963,
		"path": "../public/assets/paypal-logo-CCUi1x-V.png"
	},
	"/assets/get-paid-C2AcRzBW.jpg": {
		"type": "image/jpeg",
		"etag": "\"2724d-cb8sJ/JKheQwsVte0ECr4Yco+JQ\"",
		"mtime": "2026-09-24T13:50:13.921Z",
		"size": 160333,
		"path": "../public/assets/get-paid-C2AcRzBW.jpg"
	},
	"/assets/phone-travel-Y3B-rRqk.jpg": {
		"type": "image/jpeg",
		"etag": "\"231c5-Krf1s/91gPWxuzLD9IrsGgXhGBQ\"",
		"mtime": "2026-09-24T13:50:13.921Z",
		"size": 143813,
		"path": "../public/assets/phone-travel-Y3B-rRqk.jpg"
	},
	"/assets/routes-CmAIdYvQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"9c54-VQ/ooUrPxtkVZciLM3eR3ZwZo4M\"",
		"mtime": "2026-09-24T13:50:13.921Z",
		"size": 40020,
		"path": "../public/assets/routes-CmAIdYvQ.js"
	},
	"/assets/index-B07ubjEI.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"657f2-9Ylfg2AObCboAktGT/G1x9ioyis\"",
		"mtime": "2026-09-24T13:50:13.920Z",
		"size": 415730,
		"path": "../public/assets/index-B07ubjEI.js"
	},
	"/assets/skydo-logo-D38Ytztj.avif": {
		"type": "image/avif",
		"etag": "\"8764-uz9EcHbNOTMCZWXcYyc8BVNlZBk\"",
		"mtime": "2026-09-24T13:50:13.923Z",
		"size": 34660,
		"path": "../public/assets/skydo-logo-D38Ytztj.avif"
	},
	"/assets/signup-CNgmC4FY.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"a96-Nenr9AK/D95lSK7OnQrbjt3ZLeA\"",
		"mtime": "2026-09-24T13:50:13.921Z",
		"size": 2710,
		"path": "../public/assets/signup-CNgmC4FY.js"
	},
	"/assets/security-lock-BC3xdrKs.jpg": {
		"type": "image/jpeg",
		"etag": "\"18dc6-bzt7bAV+tZhuWP6uxbfyxtOND3M\"",
		"mtime": "2026-09-24T13:50:13.922Z",
		"size": 101830,
		"path": "../public/assets/security-lock-BC3xdrKs.jpg"
	},
	"/assets/users-DvYZTMfC.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"996-Xxx1IrtTtZDgFw7ujLTBlBqLcgg\"",
		"mtime": "2026-09-24T13:50:13.921Z",
		"size": 2454,
		"path": "../public/assets/users-DvYZTMfC.js"
	},
	"/assets/wise-logo-B1JmgelH.png": {
		"type": "image/png",
		"etag": "\"1bd3-RtbDm3AOUP2BuIaT75XrJNTmJFM\"",
		"mtime": "2026-09-24T13:50:13.923Z",
		"size": 7123,
		"path": "../public/assets/wise-logo-B1JmgelH.png"
	},
	"/assets/slash-pay-brand-CoE1pJ_p.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3c7-bgdDkDYdgvzE2+HYfUABfEVGr2w\"",
		"mtime": "2026-09-24T13:50:13.921Z",
		"size": 967,
		"path": "../public/assets/slash-pay-brand-CoE1pJ_p.js"
	},
	"/assets/supabase-B3ColsPZ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"34505-Fl/V0uVzj5FGlKmnYYhfVM3aAoU\"",
		"mtime": "2026-09-24T13:50:13.921Z",
		"size": 214277,
		"path": "../public/assets/supabase-B3ColsPZ.js"
	},
	"/assets/styles-D9C1ynwV.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"16ec5-Y7Cx4WuCektk3zRALB2GX63czHo\"",
		"mtime": "2026-09-24T13:50:13.923Z",
		"size": 93893,
		"path": "../public/assets/styles-D9C1ynwV.css"
	}
};
//#endregion
//#region #nitro/virtual/public-assets
var publicAssetBases = {};
function isPublicAssetURL(id = "") {
	if (public_assets_data_default[id]) return true;
	for (const base in publicAssetBases) if (id.startsWith(base)) return true;
	return false;
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/route-rules.mjs
var headers = ((m) => function headersRouteRule(event) {
	for (const [key, value] of Object.entries(m.options || {})) event.res.headers.set(key, value);
});
//#endregion
//#region #nitro/virtual/routing
var findRouteRules = /* @__PURE__ */ (() => {
	const $0 = [{
		name: "headers",
		route: "/assets/**",
		handler: headers,
		options: { "cache-control": "public, max-age=31536000, immutable" }
	}];
	return (m, p) => {
		let r = [];
		if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
		let s = p.split("/");
		if (s.length > 1) {
			if (s[1] === "assets") r.unshift({
				data: $0,
				params: { "_": s.slice(2).join("/") }
			});
		}
		return r;
	};
})();
var _lazy_dBumov = defineLazyEventHandler(() => import("./_chunks/ssr-renderer.mjs"));
var findRoute = /* @__PURE__ */ (() => {
	const data = {
		route: "/**",
		handler: _lazy_dBumov
	};
	return ((_m, p) => {
		return {
			data,
			params: { "_": p.slice(1) }
		};
	});
})();
[].filter(Boolean);
//#endregion
//#region node_modules/nitro/dist/runtime/internal/error/prod.mjs
var errorHandler = (error, event) => {
	const res = defaultHandler(error, event);
	return new FastResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event) {
	const unhandled = error.unhandled ?? !HTTPError.isError(error);
	const { status = 500, statusText = "" } = unhandled ? {} : error;
	if (status === 404) {
		const url = event.url || new URL(event.req.url);
		const baseURL = "/";
		if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) return {
			status: 302,
			headers: new Headers({ location: `${baseURL}${url.pathname.slice(1)}${url.search}` })
		};
	}
	const headers = new Headers(unhandled ? {} : error.headers);
	headers.set("content-type", "application/json; charset=utf-8");
	return {
		status,
		statusText,
		headers,
		body: {
			error: true,
			...unhandled ? {
				status,
				unhandled: true
			} : typeof error.toJSON === "function" ? error.toJSON() : {
				status,
				statusText,
				message: error.message
			}
		}
	};
}
//#endregion
//#region #nitro/virtual/error-handler
var errorHandlers = [errorHandler];
async function error_handler_default(error, event) {
	for (const handler of errorHandlers) try {
		const response = await handler(error, event, { defaultHandler });
		if (response) return response;
	} catch (error) {
		console.error(error);
	}
}
//#endregion
//#region #nitro/virtual/app
function createNitroApp() {
	const captureError = (error, errorCtx) => {
		if (errorCtx?.event) {
			const errors = errorCtx.event.req.context?.nitro?.errors;
			if (errors) errors.push({
				error,
				context: errorCtx
			});
		}
	};
	const h3App = createH3App({ onError(error, event) {
		return error_handler_default(error, event);
	} });
	let appHandler = (req) => {
		req.context ||= {};
		req.context.nitro = req.context.nitro || { errors: [] };
		return h3App.fetch(req);
	};
	return {
		fetch: appHandler,
		h3: h3App,
		hooks: void 0,
		captureError
	};
}
function createH3App(config) {
	const h3App = new H3Core(config);
	h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
	h3App["~getMiddleware"] = (event, route) => {
		const pathname = event.url.pathname;
		const method = event.req.method;
		const middleware = [];
		const routeRules = getRouteRules(method, pathname);
		event.context.routeRules = routeRules?.routeRules;
		if (routeRules?.routeRuleMiddleware.length) middleware.push(...routeRules.routeRuleMiddleware);
		if (route?.data?.middleware?.length) middleware.push(...route.data.middleware);
		return middleware;
	};
	return h3App;
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/app.mjs
var APP_ID = "default";
function useNitroApp() {
	let instance = useNitroApp._instance;
	if (instance) return instance;
	instance = useNitroApp._instance = createNitroApp();
	globalThis.__nitro__ = globalThis.__nitro__ || {};
	globalThis.__nitro__[APP_ID] = instance;
	return instance;
}
function useNitroHooks() {
	const nitroApp = useNitroApp();
	const hooks = nitroApp.hooks;
	if (hooks) return hooks;
	return nitroApp.hooks = new HookableCore();
}
function getRouteRules(method, pathname) {
	const m = findRouteRules(method, pathname);
	if (!m?.length) return { routeRuleMiddleware: [] };
	const routeRules = {};
	for (const layer of m) for (const rule of layer.data) {
		const currentRule = routeRules[rule.name];
		if (currentRule) {
			if (rule.options === false) {
				delete routeRules[rule.name];
				continue;
			}
			if (typeof currentRule.options === "object" && typeof rule.options === "object") currentRule.options = {
				...currentRule.options,
				...rule.options
			};
			else currentRule.options = rule.options;
			currentRule.route = rule.route;
			currentRule.params = {
				...currentRule.params,
				...layer.params
			};
		} else if (rule.options !== false) routeRules[rule.name] = {
			...rule,
			params: layer.params
		};
	}
	const middleware = [];
	const orderedRules = Object.values(routeRules).sort((a, b) => (a.handler?.order || 0) - (b.handler?.order || 0));
	for (const rule of orderedRules) {
		if (rule.options === false || !rule.handler) continue;
		middleware.push(rule.handler(rule));
	}
	return {
		routeRules,
		routeRuleMiddleware: middleware
	};
}
//#endregion
//#region node_modules/nitro/dist/presets/cloudflare/runtime/_module-handler.mjs
function createHandler(hooks) {
	const nitroApp = useNitroApp();
	const nitroHooks = useNitroHooks();
	return {
		async fetch(request, env, context) {
			globalThis.__env__ = env;
			augmentReq(request, {
				env,
				context
			});
			const ctxExt = {};
			const url = new URL(request.url);
			if (hooks.fetch) {
				const res = await hooks.fetch(request, env, context, url, ctxExt);
				if (res) return res;
			}
			return await nitroApp.fetch(request);
		},
		scheduled(controller, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:scheduled", {
				controller,
				env,
				context
			}) || Promise.resolve());
		},
		email(message, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:email", {
				message,
				event: message,
				env,
				context
			}) || Promise.resolve());
		},
		queue(batch, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:queue", {
				batch,
				event: batch,
				env,
				context
			}) || Promise.resolve());
		},
		tail(traces, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:tail", {
				traces,
				env,
				context
			}) || Promise.resolve());
		},
		trace(traces, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:trace", {
				traces,
				env,
				context
			}) || Promise.resolve());
		}
	};
}
function augmentReq(cfReq, ctx) {
	const req = cfReq;
	req.ip = cfReq.headers.get("cf-connecting-ip") || void 0;
	req.runtime ??= { name: "cloudflare" };
	req.runtime.cloudflare = {
		...req.runtime.cloudflare,
		...ctx
	};
	req.waitUntil = ctx.context?.waitUntil.bind(ctx.context);
}
//#endregion
//#region node_modules/nitro/dist/presets/cloudflare/runtime/cloudflare-module.mjs
var cloudflare_module_default = createHandler({ fetch(cfRequest, env, context, url) {
	if (env.ASSETS && isPublicAssetURL(url.pathname)) return env.ASSETS.fetch(cfRequest);
} });
//#endregion
export { cloudflare_module_default as default };
