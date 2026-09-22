import { n as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { t as SlashPayBrand } from "./slash-pay-brand-BU87sMKa.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as UserRound, l as LockKeyhole } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-U_USbe1P.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function LoginPage() {
	const [revealed, setRevealed] = (0, import_react.useState)(false);
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [remember, setRemember] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const frame = window.requestAnimationFrame(() => setRevealed(true));
		return () => window.cancelAnimationFrame(frame);
	}, []);
	function handleSubmit(event) {
		event.preventDefault();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "login-page",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: `login-shell ${revealed ? "is-revealed" : ""}`,
			"aria-label": "Slash Pay login",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "login-curtain",
					"aria-hidden": "true",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "login-curtain__mark",
						children: "➤"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "login-panel",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/",
							className: "login-brand",
							"aria-label": "Back to Slash Pay home",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlashPayBrand, {})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "login-form-wrap",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "login-heading",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Log in to your account." })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								className: "login-form",
								onSubmit: handleSubmit,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "login-field",
										"aria-label": "Email address",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "login-input-wrap",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, {
												"aria-hidden": "true",
												size: 17
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "email",
												autoComplete: "email",
												value: email,
												onChange: (event) => setEmail(event.target.value),
												placeholder: "",
												required: true
											})]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "login-field",
										"aria-label": "Password",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "login-input-wrap",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LockKeyhole, {
												"aria-hidden": "true",
												size: 18
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "password",
												autoComplete: "current-password",
												value: password,
												onChange: (event) => setPassword(event.target.value),
												placeholder: "",
												required: true
											})]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "login-options",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: "login-check",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "checkbox",
												checked: remember,
												onChange: (event) => setRemember(event.target.checked)
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Remember me" })]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										className: "login-submit",
										type: "submit",
										children: "Log in now"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "login-recovery",
										children: ["Forgot password? ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											children: "Reset password"
										})]
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "login-footer",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "login-footer__active",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, {
									"aria-hidden": "true",
									size: 14
								}), " Log in"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LockKeyhole, {
									"aria-hidden": "true",
									size: 14
								}), " Sign up"]
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "login-blank",
					"aria-hidden": "true"
				})
			]
		})
	});
}
//#endregion
export { LoginPage as component };
