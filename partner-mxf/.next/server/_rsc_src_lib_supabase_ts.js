"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "_rsc_src_lib_supabase_ts";
exports.ids = ["_rsc_src_lib_supabase_ts"];
exports.modules = {

/***/ "(rsc)/./src/lib/supabase.ts":
/*!*****************************!*\
  !*** ./src/lib/supabase.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   supabase: () => (/* binding */ supabase)\n/* harmony export */ });\n/* harmony import */ var server_only__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! server-only */ \"(rsc)/./node_modules/next/dist/compiled/server-only/empty.js\");\n/* harmony import */ var server_only__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(server_only__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _supabase_supabase_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @supabase/supabase-js */ \"(rsc)/./node_modules/@supabase/supabase-js/dist/index.mjs\");\n\n\nconst url = \"https://xszbmmwhhmaozjnparhj.supabase.co\";\nconst service = process.env.SUPABASE_SERVICE_ROLE_KEY;\nconst noCacheFetch = (input, init)=>fetch(input, {\n        ...init,\n        cache: \"no-store\"\n    });\nfunction createServerClient() {\n    if (!service) throw new Error(\"SUPABASE_SERVICE_ROLE_KEY missing\");\n    return (0,_supabase_supabase_js__WEBPACK_IMPORTED_MODULE_1__.createClient)(url, service, {\n        auth: {\n            persistSession: false\n        },\n        global: {\n            fetch: noCacheFetch\n        }\n    });\n}\nconst supabase = createServerClient();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvbGliL3N1cGFiYXNlLnRzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBcUI7QUFDZ0M7QUFFckQsTUFBTUMsTUFBTUMsMENBQW9DO0FBQ2hELE1BQU1HLFVBQVVILFFBQVFDLEdBQUcsQ0FBQ0cseUJBQXlCO0FBRXJELE1BQU1DLGVBQTZCLENBQUNDLE9BQU9DLE9BQ3pDQyxNQUFNRixPQUFPO1FBQUUsR0FBR0MsSUFBSTtRQUFFRSxPQUFPO0lBQVc7QUFFNUMsU0FBU0M7SUFDUCxJQUFJLENBQUNQLFNBQVMsTUFBTSxJQUFJUSxNQUFNO0lBQzlCLE9BQU9iLG1FQUFZQSxDQUFDQyxLQUFLSSxTQUFTO1FBQ2hDUyxNQUFNO1lBQUVDLGdCQUFnQjtRQUFNO1FBQzlCQyxRQUFRO1lBQUVOLE9BQU9IO1FBQWE7SUFDaEM7QUFDRjtBQUVPLE1BQU1VLFdBQVdMLHFCQUFxQiIsInNvdXJjZXMiOlsid2VicGFjazovL3BhcnRuZXItbXhmLy4vc3JjL2xpYi9zdXBhYmFzZS50cz8wNmUxIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBcInNlcnZlci1vbmx5XCI7XG5pbXBvcnQgeyBjcmVhdGVDbGllbnQgfSBmcm9tIFwiQHN1cGFiYXNlL3N1cGFiYXNlLWpzXCI7XG5cbmNvbnN0IHVybCA9IHByb2Nlc3MuZW52Lk5FWFRfUFVCTElDX1NVUEFCQVNFX1VSTCE7XG5jb25zdCBzZXJ2aWNlID0gcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9ST0xFX0tFWTtcblxuY29uc3Qgbm9DYWNoZUZldGNoOiB0eXBlb2YgZmV0Y2ggPSAoaW5wdXQsIGluaXQpID0+XG4gIGZldGNoKGlucHV0LCB7IC4uLmluaXQsIGNhY2hlOiBcIm5vLXN0b3JlXCIgfSk7XG5cbmZ1bmN0aW9uIGNyZWF0ZVNlcnZlckNsaWVudCgpIHtcbiAgaWYgKCFzZXJ2aWNlKSB0aHJvdyBuZXcgRXJyb3IoXCJTVVBBQkFTRV9TRVJWSUNFX1JPTEVfS0VZIG1pc3NpbmdcIik7XG4gIHJldHVybiBjcmVhdGVDbGllbnQodXJsLCBzZXJ2aWNlLCB7XG4gICAgYXV0aDogeyBwZXJzaXN0U2Vzc2lvbjogZmFsc2UgfSxcbiAgICBnbG9iYWw6IHsgZmV0Y2g6IG5vQ2FjaGVGZXRjaCB9LFxuICB9KTtcbn1cblxuZXhwb3J0IGNvbnN0IHN1cGFiYXNlID0gY3JlYXRlU2VydmVyQ2xpZW50KCk7XG4iXSwibmFtZXMiOlsiY3JlYXRlQ2xpZW50IiwidXJsIiwicHJvY2VzcyIsImVudiIsIk5FWFRfUFVCTElDX1NVUEFCQVNFX1VSTCIsInNlcnZpY2UiLCJTVVBBQkFTRV9TRVJWSUNFX1JPTEVfS0VZIiwibm9DYWNoZUZldGNoIiwiaW5wdXQiLCJpbml0IiwiZmV0Y2giLCJjYWNoZSIsImNyZWF0ZVNlcnZlckNsaWVudCIsIkVycm9yIiwiYXV0aCIsInBlcnNpc3RTZXNzaW9uIiwiZ2xvYmFsIiwic3VwYWJhc2UiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/supabase.ts\n");

/***/ })

};
;