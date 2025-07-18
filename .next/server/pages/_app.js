/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/_app";
exports.ids = ["pages/_app"];
exports.modules = {

/***/ "./pages/_app.tsx":
/*!************************!*\
  !*** ./pages/_app.tsx ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ App)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../styles/globals.css */ \"./styles/globals.css\");\n/* harmony import */ var _styles_globals_css__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_styles_globals_css__WEBPACK_IMPORTED_MODULE_2__);\n\n\n\nfunction App({ Component, pageProps }) {\n    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{\n        // Detect if running in iframe and add class to body\n        if (window !== window.top) {\n            document.body.classList.add(\"iframe-mode\");\n        }\n        // Add resize listener for responsive iframe behavior\n        const handleResize = ()=>{\n            if (window !== window.top) {\n                // Send size information to parent window\n                const height = document.documentElement.scrollHeight;\n                window.parent.postMessage({\n                    type: \"resize\",\n                    height: height\n                }, \"*\");\n            }\n        };\n        // Initial size calculation\n        handleResize();\n        // Listen for content changes\n        const observer = new ResizeObserver(handleResize);\n        observer.observe(document.body);\n        window.addEventListener(\"resize\", handleResize);\n        return ()=>{\n            observer.disconnect();\n            window.removeEventListener(\"resize\", handleResize);\n        };\n    }, []);\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Component, {\n        ...pageProps\n    }, void 0, false, {\n        fileName: \"/Users/admin/Cursor_template/pages/_app.tsx\",\n        lineNumber: 39,\n        columnNumber: 10\n    }, this);\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9wYWdlcy9fYXBwLnRzeCIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUNrQztBQUNIO0FBRWhCLFNBQVNDLElBQUksRUFBRUMsU0FBUyxFQUFFQyxTQUFTLEVBQVk7SUFDNURILGdEQUFTQSxDQUFDO1FBQ1Isb0RBQW9EO1FBQ3BELElBQUlJLFdBQVdBLE9BQU9DLEdBQUcsRUFBRTtZQUN6QkMsU0FBU0MsSUFBSSxDQUFDQyxTQUFTLENBQUNDLEdBQUcsQ0FBQztRQUM5QjtRQUVBLHFEQUFxRDtRQUNyRCxNQUFNQyxlQUFlO1lBQ25CLElBQUlOLFdBQVdBLE9BQU9DLEdBQUcsRUFBRTtnQkFDekIseUNBQXlDO2dCQUN6QyxNQUFNTSxTQUFTTCxTQUFTTSxlQUFlLENBQUNDLFlBQVk7Z0JBQ3BEVCxPQUFPVSxNQUFNLENBQUNDLFdBQVcsQ0FBQztvQkFDeEJDLE1BQU07b0JBQ05MLFFBQVFBO2dCQUNWLEdBQUc7WUFDTDtRQUNGO1FBRUEsMkJBQTJCO1FBQzNCRDtRQUVBLDZCQUE2QjtRQUM3QixNQUFNTyxXQUFXLElBQUlDLGVBQWVSO1FBQ3BDTyxTQUFTRSxPQUFPLENBQUNiLFNBQVNDLElBQUk7UUFFOUJILE9BQU9nQixnQkFBZ0IsQ0FBQyxVQUFVVjtRQUVsQyxPQUFPO1lBQ0xPLFNBQVNJLFVBQVU7WUFDbkJqQixPQUFPa0IsbUJBQW1CLENBQUMsVUFBVVo7UUFDdkM7SUFDRixHQUFHLEVBQUU7SUFFTCxxQkFBTyw4REFBQ1I7UUFBVyxHQUFHQyxTQUFTOzs7Ozs7QUFDakMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9lbGV2ZW5sYWJzLXByb3h5LWlmcmFtZS8uL3BhZ2VzL19hcHAudHN4PzJmYmUiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBBcHBQcm9wcyB9IGZyb20gJ25leHQvYXBwJztcbmltcG9ydCB7IHVzZUVmZmVjdCB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCAnLi4vc3R5bGVzL2dsb2JhbHMuY3NzJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gQXBwKHsgQ29tcG9uZW50LCBwYWdlUHJvcHMgfTogQXBwUHJvcHMpIHtcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICAvLyBEZXRlY3QgaWYgcnVubmluZyBpbiBpZnJhbWUgYW5kIGFkZCBjbGFzcyB0byBib2R5XG4gICAgaWYgKHdpbmRvdyAhPT0gd2luZG93LnRvcCkge1xuICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKCdpZnJhbWUtbW9kZScpO1xuICAgIH1cblxuICAgIC8vIEFkZCByZXNpemUgbGlzdGVuZXIgZm9yIHJlc3BvbnNpdmUgaWZyYW1lIGJlaGF2aW9yXG4gICAgY29uc3QgaGFuZGxlUmVzaXplID0gKCkgPT4ge1xuICAgICAgaWYgKHdpbmRvdyAhPT0gd2luZG93LnRvcCkge1xuICAgICAgICAvLyBTZW5kIHNpemUgaW5mb3JtYXRpb24gdG8gcGFyZW50IHdpbmRvd1xuICAgICAgICBjb25zdCBoZWlnaHQgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsSGVpZ2h0O1xuICAgICAgICB3aW5kb3cucGFyZW50LnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICB0eXBlOiAncmVzaXplJyxcbiAgICAgICAgICBoZWlnaHQ6IGhlaWdodFxuICAgICAgICB9LCAnKicpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBJbml0aWFsIHNpemUgY2FsY3VsYXRpb25cbiAgICBoYW5kbGVSZXNpemUoKTtcblxuICAgIC8vIExpc3RlbiBmb3IgY29udGVudCBjaGFuZ2VzXG4gICAgY29uc3Qgb2JzZXJ2ZXIgPSBuZXcgUmVzaXplT2JzZXJ2ZXIoaGFuZGxlUmVzaXplKTtcbiAgICBvYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LmJvZHkpO1xuXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGhhbmRsZVJlc2l6ZSk7XG5cbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgb2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGhhbmRsZVJlc2l6ZSk7XG4gICAgfTtcbiAgfSwgW10pO1xuXG4gIHJldHVybiA8Q29tcG9uZW50IHsuLi5wYWdlUHJvcHN9IC8+O1xufSAiXSwibmFtZXMiOlsidXNlRWZmZWN0IiwiQXBwIiwiQ29tcG9uZW50IiwicGFnZVByb3BzIiwid2luZG93IiwidG9wIiwiZG9jdW1lbnQiLCJib2R5IiwiY2xhc3NMaXN0IiwiYWRkIiwiaGFuZGxlUmVzaXplIiwiaGVpZ2h0IiwiZG9jdW1lbnRFbGVtZW50Iiwic2Nyb2xsSGVpZ2h0IiwicGFyZW50IiwicG9zdE1lc3NhZ2UiLCJ0eXBlIiwib2JzZXJ2ZXIiLCJSZXNpemVPYnNlcnZlciIsIm9ic2VydmUiLCJhZGRFdmVudExpc3RlbmVyIiwiZGlzY29ubmVjdCIsInJlbW92ZUV2ZW50TGlzdGVuZXIiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./pages/_app.tsx\n");

/***/ }),

/***/ "./styles/globals.css":
/*!****************************!*\
  !*** ./styles/globals.css ***!
  \****************************/
/***/ (() => {



/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("react");

/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

"use strict";
module.exports = require("react/jsx-dev-runtime");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__("./pages/_app.tsx"));
module.exports = __webpack_exports__;

})();