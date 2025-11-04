(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/frontend/lib/utils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/components/ui/button.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Button",
    ()=>Button,
    "buttonVariants",
    ()=>buttonVariants
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/@radix-ui/react-slot/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/class-variance-authority/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/utils.ts [app-client] (ecmascript)");
;
;
;
;
const buttonVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cva"])("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive", {
    variants: {
        variant: {
            default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
            destructive: "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
            outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
            secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
            ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
            link: "text-primary underline-offset-4 hover:underline"
        },
        size: {
            default: "h-9 px-4 py-2 has-[>svg]:px-3",
            sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
            lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
            icon: "size-9"
        }
    },
    defaultVariants: {
        variant: "default",
        size: "default"
    }
});
function Button({ className, variant, size, asChild = false, ...props }) {
    const Comp = asChild ? __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Slot"] : "button";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Comp, {
        "data-slot": "button",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])(buttonVariants({
            variant,
            size,
            className
        })),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/components/ui/button.tsx",
        lineNumber: 51,
        columnNumber: 5
    }, this);
}
_c = Button;
;
var _c;
__turbopack_context__.k.register(_c, "Button");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/components/ui/input.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Input",
    ()=>Input
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/utils.ts [app-client] (ecmascript)");
;
;
;
const Input = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"](_c = ({ className, type, ...props }, ref)=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
        type: type,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50", className),
        ref: ref,
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/components/ui/input.tsx",
        lineNumber: 11,
        columnNumber: 7
    }, ("TURBOPACK compile-time value", void 0));
});
_c1 = Input;
Input.displayName = "Input";
;
var _c, _c1;
__turbopack_context__.k.register(_c, "Input$React.forwardRef");
__turbopack_context__.k.register(_c1, "Input");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/frontend/app/project/[id]/annotate/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/api.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/logger.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/dist/shared/lib/app-dynamic.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/components/ui/button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/components/ui/input.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/icons/chevron-left.js [app-client] (ecmascript) <export default as ChevronLeft>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/icons/chevron-right.js [app-client] (ecmascript) <export default as ChevronRight>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zoom$2d$in$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ZoomIn$3e$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/icons/zoom-in.js [app-client] (ecmascript) <export default as ZoomIn>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zoom$2d$out$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ZoomOut$3e$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/icons/zoom-out.js [app-client] (ecmascript) <export default as ZoomOut>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Square$3e$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/icons/square.js [app-client] (ecmascript) <export default as Square>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mouse$2d$pointer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MousePointer$3e$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/icons/mouse-pointer.js [app-client] (ecmascript) <export default as MousePointer>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/icons/trash-2.js [app-client] (ecmascript) <export default as Trash2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/icons/save.js [app-client] (ecmascript) <export default as Save>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
;
;
function AnnotatePageContent() {
    _s();
    const { id } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"])();
    const [currentFrameImage, setCurrentFrameImage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [currentFrame, setCurrentFrame] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [currentImage, setCurrentImage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const [totalImages, setTotalImages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(150); // 動態總幀數
    const [currentVideo, setCurrentVideo] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const [totalVideos] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(10);
    const [selectedTool, setSelectedTool] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("box");
    const [selectedClass, setSelectedClass] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("stop_sign");
    const [annotations, setAnnotations] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isDrawing, setIsDrawing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [drawStart, setDrawStart] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        x: 0,
        y: 0
    });
    const [currentBox, setCurrentBox] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [zoom, setZoom] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(100);
    const [imageScale, setImageScale] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const [classes, setClasses] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([
        {
            id: "give_way_sign",
            name: "give_way_sign",
            color: "#fbbf24"
        },
        {
            id: "pedestrian_child",
            name: "pedestrian_child",
            color: "#3b82f6"
        },
        {
            id: "zebra_crossing_sign",
            name: "zebra_crossing_sign",
            color: "#8b5cf6"
        },
        {
            id: "traffic_light_red",
            name: "traffic_light_red",
            color: "#10b981"
        },
        {
            id: "stop_sign",
            name: "stop_sign",
            color: "#ef4444"
        }
    ]);
    const [newClassName, setNewClassName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [classPage, setClassPage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const CLASSES_PER_PAGE = 5;
    const [currentVideoId, setCurrentVideoId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [annotationStatus, setAnnotationStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("not yet started");
    const [lastAnnotatedFrame, setLastAnnotatedFrame] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [isAutoSaving, setIsAutoSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [lastSavedTime, setLastSavedTime] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [saveStatus, setSaveStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('idle');
    const canvasRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const projectId = Array.isArray(id) ? id[0] : id;
    const safeProjectId = projectId || "";
    const getClientTimestamp = ()=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        return new Date().toISOString();
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AnnotatePageContent.useEffect": ()=>{
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            const urlParams = new URLSearchParams(window.location.search);
            const videoId = urlParams.get('video_id');
            if (videoId) {
                // 直接使用傳入的視頻 ID（應該是資料庫中的唯一 ID）
                setCurrentVideoId(videoId);
                console.log('🆔 [ANNOTATE] Video ID from params:', videoId);
            } else {
                console.warn('⚠️ [ANNOTATE] No video_id parameter found, getting first available video');
                getFirstAvailableVideoId();
            }
        }
    }["AnnotatePageContent.useEffect"], [
        projectId
    ]);
    const getFirstAvailableVideoId = async ()=>{
        try {
            if (safeProjectId) {
                const videos = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ApiService"].getUploadedVideos(safeProjectId);
                if (videos && videos.length > 0) {
                    const firstVideo = videos[0];
                    // 後端返回的數據結構：{name, file, path, url}，其中 file 是 video_id
                    const videoId = firstVideo.file_id || firstVideo.video_id || firstVideo.id;
                    if (videoId && videoId !== "undefined" && videoId !== "" && videoId !== undefined) {
                        setCurrentVideoId(videoId.toString());
                        console.log('🆔 [ANNOTATE] Using first available video ID:', videoId);
                    } else {
                        console.warn('⚠️ [ANNOTATE] No valid video ID found in video data:', firstVideo);
                        const defaultVideoId = `1`;
                        setCurrentVideoId(defaultVideoId);
                        console.log('🆔 [ANNOTATE] Using fallback video ID:', defaultVideoId);
                    }
                } else {
                    const defaultVideoId = `1`; // 使用數字 ID 而不是字符串
                    setCurrentVideoId(defaultVideoId);
                    console.log('🆔 [ANNOTATE] No videos found, using default video ID:', defaultVideoId);
                }
            }
        } catch (error) {
            console.error('Error getting first available video ID:', error);
            const defaultVideoId = `1`; // 使用數字 ID 而不是字符串
            setCurrentVideoId(defaultVideoId);
            console.log('🆔 [ANNOTATE] Error occurred, using default video ID:', defaultVideoId);
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AnnotatePageContent.useEffect": ()=>{
            const loadClasses = {
                "AnnotatePageContent.useEffect.loadClasses": async ()=>{
                    try {
                        if (safeProjectId) {
                            const classesData = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ApiService"].getClasses(safeProjectId);
                            // 確保 classesData 是一個數組
                            if (Array.isArray(classesData)) {
                                setClasses(classesData);
                                __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$logger$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["log"].info('ANNOTATE', 'Classes loaded successfully', {
                                    projectId: safeProjectId,
                                    classCount: classesData.length
                                });
                            } else {
                                console.warn('Classes data is not an array:', classesData);
                                setClasses([
                                    {
                                        id: "give_way_sign",
                                        name: "give_way_sign",
                                        color: "#fbbf24"
                                    },
                                    {
                                        id: "pedestrian_child",
                                        name: "pedestrian_child",
                                        color: "#3b82f6"
                                    },
                                    {
                                        id: "zebra_crossing_sign",
                                        name: "zebra_crossing_sign",
                                        color: "#8b5cf6"
                                    },
                                    {
                                        id: "traffic_light_red",
                                        name: "traffic_light_red",
                                        color: "#10b981"
                                    },
                                    {
                                        id: "stop_sign",
                                        name: "stop_sign",
                                        color: "#ef4444"
                                    }
                                ]);
                            }
                        }
                    } catch (error) {
                        console.error('Error loading classes:', error);
                        setClasses([
                            {
                                id: "give_way_sign",
                                name: "give_way_sign",
                                color: "#fbbf24"
                            },
                            {
                                id: "pedestrian_child",
                                name: "pedestrian_child",
                                color: "#3b82f6"
                            },
                            {
                                id: "zebra_crossing_sign",
                                name: "zebra_crossing_sign",
                                color: "#8b5cf6"
                            },
                            {
                                id: "traffic_light_red",
                                name: "traffic_light_red",
                                color: "#10b981"
                            },
                            {
                                id: "stop_sign",
                                name: "stop_sign",
                                color: "#ef4444"
                            }
                        ]);
                    }
                }
            }["AnnotatePageContent.useEffect.loadClasses"];
            loadClasses();
        }
    }["AnnotatePageContent.useEffect"], [
        safeProjectId
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AnnotatePageContent.useEffect": ()=>{
            if (safeProjectId && currentVideoId) {
                const timer = setTimeout({
                    "AnnotatePageContent.useEffect.timer": async ()=>{
                        await checkAnnotationStatus();
                        await loadCurrentFrame();
                    }
                }["AnnotatePageContent.useEffect.timer"], 100);
                return ({
                    "AnnotatePageContent.useEffect": ()=>clearTimeout(timer)
                })["AnnotatePageContent.useEffect"];
            }
        }
    }["AnnotatePageContent.useEffect"], [
        safeProjectId,
        currentVideoId
    ]);
    const checkAnnotationStatus = async ()=>{
        try {
            if (safeProjectId && currentVideoId) {
                const statusData = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ApiService"].checkAnnotationStatus(safeProjectId, currentVideoId);
                if (statusData && typeof statusData === 'object') {
                    setAnnotationStatus(statusData["annotation status"] || "not yet started");
                    setLastAnnotatedFrame(statusData["last annotated frame"] || 0);
                    console.log('Annotation status:', statusData);
                } else {
                    setAnnotationStatus("not yet started");
                    setLastAnnotatedFrame(0);
                }
            }
        } catch (error) {
            console.error('Error checking annotation status:', error);
            setAnnotationStatus("not yet started");
            setLastAnnotatedFrame(0);
        }
    };
    const getNextFrameToAnnotate = async ()=>{
        try {
            if (!safeProjectId || !currentVideoId || currentVideoId === "" || currentVideoId === "undefined") {
                console.warn('Invalid projectId or videoId', {
                    projectId: safeProjectId,
                    videoId: currentVideoId
                });
                return;
            }
            const frameData = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ApiService"].getNextFrameToAnnotate(safeProjectId, currentVideoId, currentFrame);
            console.log('🔍 [FRONTEND] Frame data received:', frameData);
            if (frameData && frameData.success) {
                if (frameData.image) {
                    // Validate and format the image data properly
                    let imageData = frameData.image;
                    // Check if it's already a data URL
                    if (!imageData.startsWith('data:')) {
                        // If it's raw base64, add the proper data URL prefix
                        if (imageData.startsWith('9j/') || imageData.startsWith('iVBORw0KGgo')) {
                            // This looks like base64 data without proper data URL format
                            console.warn('⚠️ [FRONTEND] Received malformed base64 data, attempting to fix');
                            imageData = `data:image/jpeg;base64,${imageData}`;
                        } else {
                            // Assume it's base64 and add JPEG data URL prefix
                            imageData = `data:image/jpeg;base64,${imageData}`;
                        }
                    }
                    // Validate the data URL format
                    if (!imageData.startsWith('data:image/')) {
                        console.error('❌ [FRONTEND] Invalid image data format:', imageData.substring(0, 100) + '...');
                        setCurrentFrameImage("");
                        return;
                    }
                    setCurrentFrameImage(imageData);
                    setTotalImages(frameData.total_frames || 150); // 動態更新總幀數
                    // 優先使用 frame_id，如果沒有則使用 frame_num，最後才手動遞增
                    if (frameData.frame_id !== undefined) {
                        setCurrentFrame(frameData.frame_id);
                        setCurrentImage(frameData.frame_id + 1);
                        console.log(`✅ [FRONTEND] Key frame loaded: frame ${frameData.frame_id} (total: ${frameData.total_frames})`);
                    } else if (frameData.frame_num !== undefined) {
                        setCurrentFrame(frameData.frame_num);
                        setCurrentImage(frameData.frame_num + 1);
                        console.log(`✅ [FRONTEND] Key frame loaded using frame_num: frame ${frameData.frame_num} (total: ${frameData.total_frames})`);
                    } else {
                        console.warn('⚠️ [FRONTEND] No frame ID provided, using manual increment');
                        setCurrentFrame((prev)=>prev + 1);
                        setCurrentImage((prev)=>prev + 1);
                    }
                } else {
                    console.log('❌ [FRONTEND] No image returned, possible end of video');
                    setCurrentFrameImage("");
                    setAnnotationStatus("completed");
                }
            } else {
                console.log('❌ [FRONTEND] API returned success=false:', frameData?.message);
                setCurrentFrameImage("");
            }
        } catch (error) {
            console.error('Error getting next frame:', error);
            // 檢查是否為431錯誤或其他網路錯誤
            if (error instanceof Error && error.message && error.message.includes('431')) {
                console.warn('⚠️ [FRONTEND] 431 Request Header Fields Too Large - using fallback mechanism');
                // 清除可能過大的本地存儲
                try {
                    localStorage.removeItem('large_session_data');
                    sessionStorage.clear();
                } catch (storageError) {
                    console.warn('Could not clear storage:', storageError);
                }
            }
            // 使用fallback機制 - 手動遞增幀數
            console.log('🔄 [FRONTEND] Using fallback: manual frame increment');
            setCurrentFrame((prev)=>prev + 1);
            setCurrentImage((prev)=>prev + 1);
            setCurrentFrameImage(""); // 清空圖片，讓用戶知道需要重新載入
        }
    };
    const loadCurrentFrame = async ()=>{
        await getNextFrameToAnnotate();
    };
    // 添加重試機制
    const retryGetNextFrame = async (retryCount = 0, maxRetries = 3)=>{
        try {
            await getNextFrameToAnnotate();
        } catch (error) {
            if (retryCount < maxRetries) {
                console.log(`🔄 [FRONTEND] Retrying frame request (${retryCount + 1}/${maxRetries})`);
                setTimeout(()=>{
                    retryGetNextFrame(retryCount + 1, maxRetries);
                }, 1000 * (retryCount + 1)); // 遞增延遲
            } else {
                console.error('❌ [FRONTEND] Max retries reached, using fallback');
                // 最終fallback：手動遞增幀數
                setCurrentFrame((prev)=>prev + 1);
                setCurrentImage((prev)=>prev + 1);
            }
        }
    };
    const getNextVideo = async ()=>{
        try {
            if (safeProjectId && currentVideo < totalVideos) {
                const videoData = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ApiService"].getNextVideo(safeProjectId, currentVideoId);
                if (videoData && videoData.success && videoData.next_video_id) {
                    setCurrentVideoId(videoData.next_video_id);
                    setCurrentVideo((prev)=>prev + 1);
                    setCurrentImage(1);
                    setCurrentFrame(0);
                    setAnnotations([]);
                    setCurrentFrameImage("");
                    setTimeout(async ()=>{
                        await checkAnnotationStatus();
                        await loadCurrentFrame();
                    }, 100);
                    console.log('Next video loaded:', videoData);
                } else {
                    console.log('No next video available');
                }
            }
        } catch (error) {
            console.error('Error getting next video:', error);
        }
    };
    const redrawAnnotations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AnnotatePageContent.useCallback[redrawAnnotations]": ()=>{
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            annotations.forEach({
                "AnnotatePageContent.useCallback[redrawAnnotations]": (annotation)=>{
                    const classInfo = classes.find({
                        "AnnotatePageContent.useCallback[redrawAnnotations].classInfo": (c)=>c.id === annotation.class
                    }["AnnotatePageContent.useCallback[redrawAnnotations].classInfo"]);
                    if (!classInfo) return;
                    ctx.strokeStyle = classInfo.color;
                    ctx.fillStyle = classInfo.color + "20";
                    ctx.lineWidth = 2;
                    ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
                    ctx.fillRect(annotation.x, annotation.y, annotation.width, annotation.height);
                }
            }["AnnotatePageContent.useCallback[redrawAnnotations]"]);
            if (currentBox) {
                const currentClass = classes.find({
                    "AnnotatePageContent.useCallback[redrawAnnotations]": (c)=>c.id === selectedClass
                }["AnnotatePageContent.useCallback[redrawAnnotations]"]) || classes[0] || {
                    id: "default",
                    name: "default",
                    color: "#3b82f6"
                };
                ctx.strokeStyle = currentClass.color;
                ctx.fillStyle = currentClass.color + "20";
                ctx.lineWidth = 3;
                ctx.setLineDash([
                    8,
                    4
                ]);
                ctx.strokeRect(currentBox.x, currentBox.y, currentBox.width, currentBox.height);
                ctx.fillRect(currentBox.x, currentBox.y, currentBox.width, currentBox.height);
                if (currentBox.width > 50 && currentBox.height > 20) {
                    ctx.fillStyle = currentClass.color;
                    ctx.font = "bold 12px Arial";
                    ctx.fillText(currentClass.name, currentBox.x + 5, currentBox.y + 15);
                }
                ctx.setLineDash([]);
            }
        }
    }["AnnotatePageContent.useCallback[redrawAnnotations]"], [
        annotations,
        currentBox,
        selectedClass,
        classes
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AnnotatePageContent.useEffect": ()=>{
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            const updateCanvasSize = {
                "AnnotatePageContent.useEffect.updateCanvasSize": ()=>{
                    if (containerRef.current) {
                        const rect = containerRef.current.getBoundingClientRect();
                        canvas.width = rect.width;
                        canvas.height = rect.height;
                        canvas.style.width = `${rect.width}px`;
                        canvas.style.height = `${rect.height}px`;
                        redrawAnnotations();
                    }
                }
            }["AnnotatePageContent.useEffect.updateCanvasSize"];
            updateCanvasSize();
            window.addEventListener("resize", updateCanvasSize);
            return ({
                "AnnotatePageContent.useEffect": ()=>window.removeEventListener("resize", updateCanvasSize)
            })["AnnotatePageContent.useEffect"];
        }
    }["AnnotatePageContent.useEffect"], [
        redrawAnnotations
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AnnotatePageContent.useEffect": ()=>{
            redrawAnnotations();
        }
    }["AnnotatePageContent.useEffect"], [
        redrawAnnotations,
        currentFrameImage
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AnnotatePageContent.useEffect": ()=>{
            const totalPages = Math.max(1, Math.ceil(classes.length / CLASSES_PER_PAGE));
            if (classPage > totalPages) {
                setClassPage(totalPages);
            }
        }
    }["AnnotatePageContent.useEffect"], [
        classes,
        classPage
    ]);
    if (!currentVideoId) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-center h-screen",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-2xl font-bold text-gray-800 mb-4",
                        children: "No Video Selected"
                    }, void 0, false, {
                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                        lineNumber: 399,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-gray-600 mb-4",
                        children: "Please select a video to annotate from the upload page."
                    }, void 0, false, {
                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                        lineNumber: 400,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: "Debug Info:"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                    lineNumber: 403,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                    fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                    lineNumber: 403,
                                    columnNumber: 43
                                }, this),
                                "Project ID: ",
                                safeProjectId,
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                    fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                    lineNumber: 404,
                                    columnNumber: 42
                                }, this),
                                "Current Video ID: ",
                                currentVideoId,
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("br", {}, void 0, false, {
                                    fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                    lineNumber: 405,
                                    columnNumber: 49
                                }, this),
                                "URL: ",
                                ("TURBOPACK compile-time truthy", 1) ? window.location.href : "TURBOPACK unreachable"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                            lineNumber: 402,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                        lineNumber: 401,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-x-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                href: `/project/${safeProjectId}/upload`,
                                className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md",
                                children: "Go to Upload Page"
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                lineNumber: 410,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>window.location.reload(),
                                className: "bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md",
                                children: "Reload Page"
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                lineNumber: 413,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                        lineNumber: 409,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                lineNumber: 398,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
            lineNumber: 397,
            columnNumber: 7
        }, this);
    }
    const currentClass = classes.find((c)=>c.id === selectedClass) || classes[0] || {
        id: "default",
        name: "default",
        color: "#3b82f6"
    };
    const handleMouseDown = (e)=>{
        if (selectedTool !== "box") return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / imageScale;
        const y = (e.clientY - rect.top) / imageScale;
        setIsDrawing(true);
        setDrawStart({
            x,
            y
        });
        setCurrentBox({
            x,
            y,
            width: 0,
            height: 0
        });
        e.preventDefault();
        e.stopPropagation();
    };
    const handleMouseMove = (e)=>{
        if (!isDrawing || selectedTool !== "box") return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / imageScale;
        const y = (e.clientY - rect.top) / imageScale;
        const width = x - drawStart.x;
        const height = y - drawStart.y;
        setCurrentBox({
            x: Math.min(drawStart.x, x),
            y: Math.min(drawStart.y, y),
            width: Math.abs(width),
            height: Math.abs(height)
        });
        e.preventDefault();
        e.stopPropagation();
    };
    const handleMouseUp = (e)=>{
        if (!isDrawing || !currentBox || selectedTool !== "box") return;
        if (currentBox.width > 10 && currentBox.height > 10) {
            const newAnnotation = {
                id: `annotation_${annotations.length + 1}_${getClientTimestamp().replace(/[^0-9]/g, '')}`,
                class: selectedClass,
                x: currentBox.x,
                y: currentBox.y,
                width: currentBox.width,
                height: currentBox.height,
                color: currentClass.color
            };
            setAnnotations((prev)=>[
                    ...prev,
                    newAnnotation
                ]);
        }
        setIsDrawing(false);
        setCurrentBox(null);
        e.preventDefault();
        e.stopPropagation();
    };
    const handleZoom = (newZoom)=>{
        setZoom(newZoom);
        setImageScale(newZoom / 100);
    };
    const handleNextImage = async ()=>{
        if (currentFrame < totalImages - 1) {
            await handleAutoSave();
            setAnnotations([]);
            await getNextFrameToAnnotate();
            setCurrentImage((prev)=>prev + 1);
            console.log(`🔄 [FRONTEND] Key frame updated: ${currentFrame + 1}/${totalImages}`);
        } else {
            console.log('Already at the last frame, switching to next video');
            await getNextVideo();
        }
    };
    const handlePrevImage = ()=>{
        console.log('Previous frame navigation is disabled');
    };
    const handleAutoSave = async ()=>{
        if (annotations.length === 0) {
            console.log('No annotations to save, skipping auto-save');
            return;
        }
        setIsAutoSaving(true);
        setSaveStatus('saving');
        try {
            const annotationData = {
                project_id: safeProjectId,
                video_id: currentVideoId,
                frame_num: currentFrame,
                bboxes: annotations.map((ann)=>({
                        class_name: ann.class,
                        x: Number(ann.x),
                        y: Number(ann.y),
                        width: Number(ann.width),
                        height: Number(ann.height)
                    }))
            };
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ApiService"].saveAnnotation(annotationData);
            if (result.success) {
                setLastSavedTime(result.savedAt || getClientTimestamp());
                setSaveStatus('saved');
                console.log('Annotations auto-saved successfully', {
                    savedAt: result.savedAt,
                    bboxCount: annotations.length
                });
            } else {
                setSaveStatus('error');
                saveToLocalStorage(annotationData);
            }
        } catch (error) {
            console.error('Error auto-saving annotations:', error);
            setSaveStatus('error');
            const annotationData = {
                project_id: safeProjectId,
                video_id: currentVideoId,
                frame_num: currentFrame,
                bboxes: annotations.map((ann)=>({
                        class_name: ann.class,
                        x: Number(ann.x),
                        y: Number(ann.y),
                        width: Number(ann.width),
                        height: Number(ann.height)
                    }))
            };
            saveToLocalStorage(annotationData);
        } finally{
            setIsAutoSaving(false);
            setTimeout(()=>setSaveStatus('idle'), 3000);
        }
    };
    const saveToLocalStorage = (annotationData)=>{
        try {
            const key = `annotation_backup_${annotationData.project_id}_${annotationData.video_id}_${annotationData.frame_num}`;
            localStorage.setItem(key, JSON.stringify({
                ...annotationData,
                savedAt: getClientTimestamp(),
                isBackup: true
            }));
            console.log('Annotation saved to local storage as backup');
        } catch (error) {
            console.error('Failed to save to local storage:', error);
        }
    };
    const handleManualSave = async ()=>{
        if (!safeProjectId || !currentVideoId) {
            console.warn('Cannot save annotations: missing projectId or videoId');
            alert('Cannot save: Missing project or video information');
            return;
        }
        try {
            const annotationData = {
                project_id: safeProjectId,
                video_id: currentVideoId,
                frame_num: currentFrame,
                bboxes: annotations.map((ann)=>({
                        class_name: ann.class,
                        x: Number(ann.x),
                        y: Number(ann.y),
                        width: Number(ann.width),
                        height: Number(ann.height)
                    }))
            };
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ApiService"].saveAnnotation(annotationData);
            if (result.success) {
                console.log('Annotations saved successfully', {
                    savedAt: result.savedAt,
                    bboxCount: annotations.length
                });
                alert(`Annotations saved successfully! (${annotations.length} bounding boxes)`);
            } else {
                saveToLocalStorage(annotationData);
                alert(`Failed to save annotations: ${result.message || 'Unknown error'}. Data backed up locally.`);
            }
        } catch (error) {
            console.error('Error saving annotations:', error);
            const annotationData = {
                project_id: safeProjectId,
                video_id: currentVideoId,
                frame_num: currentFrame,
                bboxes: annotations.map((ann)=>({
                        class_name: ann.class,
                        x: Number(ann.x),
                        y: Number(ann.y),
                        width: Number(ann.width),
                        height: Number(ann.height)
                    }))
            };
            saveToLocalStorage(annotationData);
            alert(`Error saving annotations: ${error instanceof Error ? error.message : 'Unknown error'}. Data backed up locally.`);
        }
    };
    const isValidHex = (color)=>/^#([0-9a-fA-F]{3}){1,2}$/.test(color);
    const generateUniqueColor = (used)=>{
        const palette = [
            "#ef4444",
            "#3b82f6",
            "#10b981",
            "#f59e0b",
            "#8b5cf6",
            "#ec4899",
            "#14b8a6",
            "#f97316",
            "#84cc16",
            "#06b6d4"
        ];
        for (const c of palette){
            if (!used.has(c.toLowerCase())) return c;
        }
        const hash = used.size;
        const hue = hash * 137.508 % 360;
        return `hsl(${Math.floor(hue)}, 70%, 50%)`;
    };
    const handleAddClass = async ()=>{
        const input = newClassName.trim();
        if (!input) return;
        const entries = input.split(",").map((s)=>s.trim()).filter(Boolean);
        for (const entry of entries){
            const [namePartRaw, colorPartRaw] = entry.split(":").map((s)=>s.trim());
            const namePart = namePartRaw || "";
            if (!namePart) continue;
            let chosenColor = "#3b82f6";
            if (colorPartRaw && isValidHex(colorPartRaw)) {
                chosenColor = colorPartRaw.toLowerCase();
            }
            const generatedId = namePart.toLowerCase().replace(/\s+/g, "_");
            if (classes.some((c)=>c.id === generatedId)) {
                console.log(`Class '${namePart}' already exists`);
                continue;
            }
            try {
                const result = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ApiService"].addClass(safeProjectId, namePart, chosenColor);
                if (result && result.success) {
                    const classesData = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ApiService"].getClasses(safeProjectId);
                    setClasses(classesData);
                    setSelectedClass(generatedId);
                    console.log('✅ [ANNOTATE] Class added via API');
                } else {
                    alert(`Failed to add class: ${result?.message || 'Unknown error'}`);
                }
            } catch (error) {
                alert(`Error adding class: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        setNewClassName("");
    };
    const handleDeleteClass = async (classId)=>{
        const classToDelete = classes.find((c)=>c.id === classId);
        if (!classToDelete) return;
        try {
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ApiService"].deleteClass(safeProjectId, classToDelete.name);
            if (result && result.success) {
                const classesData = await __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ApiService"].getClasses(safeProjectId);
                setClasses(classesData);
                if (selectedClass === classId) {
                    const remaining = classesData.filter((c)=>c.id !== classId);
                    setSelectedClass(remaining[0]?.id || "");
                }
                console.log('✅ Class deleted successfully via API');
            } else {
                alert(`無法刪除類別: ${result?.message || 'Unknown error'}`);
            }
        } catch (error) {
            alert(`刪除類別時發生錯誤: ${error instanceof Error ? error.message : String(error)}`);
        }
    };
    const handleDeleteAnnotation = async (annotationId)=>{
        try {
            setAnnotations((prev)=>prev.filter((ann)=>ann.id !== annotationId));
            await handleAutoSave();
            console.log(`✅ [FRONTEND] Annotation ${annotationId} deleted successfully`);
        } catch (error) {
            console.error('❌ [FRONTEND] Error deleting annotation:', error);
        }
    };
    const isLastImage = currentFrame >= totalImages - 1;
    const isLastVideo = currentVideo >= totalVideos;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex h-screen bg-gray-100",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 flex flex-col",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-white border-b border-gray-200 p-4 flex items-center justify-between",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center space-x-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center space-x-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex flex-col space-y-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                        variant: "outline",
                                                        size: "sm",
                                                        onClick: handlePrevImage,
                                                        disabled: true,
                                                        className: "flex items-center opacity-50 cursor-not-allowed",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__["ChevronLeft"], {
                                                                className: "w-4 h-4 mr-1"
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                                lineNumber: 711,
                                                                columnNumber: 19
                                                            }, this),
                                                            "Prev image"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                        lineNumber: 704,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                        variant: "outline",
                                                        size: "sm",
                                                        onClick: handleNextImage,
                                                        disabled: isLastImage || isAutoSaving,
                                                        className: "flex items-center",
                                                        children: isAutoSaving ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-1"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                                    lineNumber: 723,
                                                                    columnNumber: 23
                                                                }, this),
                                                                "Saving..."
                                                            ]
                                                        }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                            children: [
                                                                "Next key frame",
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                                                                    className: "w-4 h-4 ml-1"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                                    lineNumber: 729,
                                                                    columnNumber: 23
                                                                }, this)
                                                            ]
                                                        }, void 0, true)
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                        lineNumber: 714,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                lineNumber: 703,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-semibold text-gray-700",
                                                children: [
                                                    "Frame ",
                                                    currentImage,
                                                    " of ",
                                                    totalImages
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                lineNumber: 734,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-xs text-gray-500 ml-2",
                                                children: [
                                                    "Debug: currentFrame=",
                                                    currentFrame,
                                                    ", videoId=",
                                                    currentVideoId
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                lineNumber: 737,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                        lineNumber: 702,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-px h-6 bg-gray-200"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                        lineNumber: 741,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center space-x-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-semibold text-gray-700",
                                                children: [
                                                    "Video ",
                                                    currentVideo,
                                                    " of ",
                                                    totalVideos
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                lineNumber: 743,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex flex-col space-y-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                        size: "sm",
                                                        onClick: ()=>{
                                                            if (currentVideo > 1) {
                                                                setCurrentVideo((prev)=>prev - 1);
                                                                setCurrentImage(1);
                                                                setCurrentFrame(0);
                                                                setAnnotations([]);
                                                                setCurrentFrameImage("");
                                                                setTimeout(async ()=>{
                                                                    await checkAnnotationStatus();
                                                                    await loadCurrentFrame();
                                                                }, 100);
                                                            }
                                                        },
                                                        disabled: currentVideo <= 1,
                                                        className: "flex items-center bg-blue-600 hover:bg-blue-700 text-white",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$left$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronLeft$3e$__["ChevronLeft"], {
                                                                className: "w-4 h-4 mr-1"
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                                lineNumber: 765,
                                                                columnNumber: 19
                                                            }, this),
                                                            "Prev video"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                        lineNumber: 747,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                        size: "sm",
                                                        onClick: getNextVideo,
                                                        disabled: isLastVideo,
                                                        className: "flex items-center bg-blue-600 hover:bg-blue-700 text-white",
                                                        children: [
                                                            "Next video",
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$chevron$2d$right$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ChevronRight$3e$__["ChevronRight"], {
                                                                className: "w-4 h-4 ml-1"
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                                lineNumber: 775,
                                                                columnNumber: 19
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                        lineNumber: 768,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                lineNumber: 746,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                        lineNumber: 742,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                lineNumber: 701,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center space-x-3",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                    onClick: handleManualSave,
                                    variant: "outline",
                                    size: "sm",
                                    className: "text-gray-600 border-gray-300 hover:bg-gray-50",
                                    title: "Emergency manual save (auto-save is enabled)",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$save$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Save$3e$__["Save"], {
                                            className: "w-4 h-4 mr-2"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                            lineNumber: 788,
                                            columnNumber: 15
                                        }, this),
                                        "Manual Save"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                    lineNumber: 781,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                lineNumber: 780,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                        lineNumber: 700,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1 flex flex-col",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-gray-50 border-b border-gray-200 p-3 flex items-center justify-between",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center space-x-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-semibold text-gray-700",
                                                children: "Tools"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                lineNumber: 796,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center space-x-2 text-sm",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-gray-600",
                                                        children: "狀態:"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                        lineNumber: 798,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: `px-2 py-1 rounded text-xs ${annotationStatus === "not yet started" ? "bg-gray-200 text-gray-700" : annotationStatus === "in progress" ? "bg-yellow-200 text-yellow-700" : annotationStatus === "completed" ? "bg-green-200 text-green-700" : "bg-blue-200 text-blue-700"}`,
                                                        children: annotationStatus
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                        lineNumber: 799,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-gray-600",
                                                        children: [
                                                            "最後註釋幀: ",
                                                            lastAnnotatedFrame
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                        lineNumber: 807,
                                                        columnNumber: 17
                                                    }, this),
                                                    saveStatus === 'saving' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-blue-600 text-xs flex items-center",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                                lineNumber: 810,
                                                                columnNumber: 21
                                                            }, this),
                                                            "自動保存中..."
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                        lineNumber: 809,
                                                        columnNumber: 19
                                                    }, this) : saveStatus === 'saved' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-green-600 text-xs flex items-center",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "w-3 h-3 bg-green-500 rounded-full mr-1"
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                                lineNumber: 815,
                                                                columnNumber: 21
                                                            }, this),
                                                            "已保存 ",
                                                            lastSavedTime ? new Date(lastSavedTime).toLocaleTimeString() : ''
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                        lineNumber: 814,
                                                        columnNumber: 19
                                                    }, this) : saveStatus === 'error' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-red-600 text-xs flex items-center",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "w-3 h-3 bg-red-500 rounded-full mr-1"
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                                lineNumber: 820,
                                                                columnNumber: 21
                                                            }, this),
                                                            "保存失敗 (已備份到本地)"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                        lineNumber: 819,
                                                        columnNumber: 19
                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-green-600 text-xs",
                                                        children: "✓ 自動保存已啟用"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                        lineNumber: 824,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                lineNumber: 797,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex space-x-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                        variant: selectedTool === "select" ? "default" : "outline",
                                                        size: "sm",
                                                        onClick: ()=>setSelectedTool("select"),
                                                        className: "flex items-center",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mouse$2d$pointer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__MousePointer$3e$__["MousePointer"], {
                                                                className: "w-4 h-4 mr-1"
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                                lineNumber: 834,
                                                                columnNumber: 19
                                                            }, this),
                                                            "Select"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                        lineNumber: 828,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                        variant: selectedTool === "box" ? "default" : "outline",
                                                        size: "sm",
                                                        onClick: ()=>setSelectedTool("box"),
                                                        className: "flex items-center",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Square$3e$__["Square"], {
                                                                className: "w-4 h-4 mr-1"
                                                            }, void 0, false, {
                                                                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                                lineNumber: 843,
                                                                columnNumber: 19
                                                            }, this),
                                                            "Box"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                        lineNumber: 837,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                lineNumber: 827,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                        lineNumber: 795,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center space-x-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-sm text-gray-600",
                                                children: "Zoom"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                lineNumber: 849,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                variant: "outline",
                                                size: "sm",
                                                onClick: ()=>handleZoom(Math.max(25, zoom - 25)),
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zoom$2d$out$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ZoomOut$3e$__["ZoomOut"], {
                                                    className: "w-4 h-4"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                    lineNumber: 855,
                                                    columnNumber: 17
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                lineNumber: 850,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-sm font-medium min-w-[3rem] text-center",
                                                children: [
                                                    zoom,
                                                    "%"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                lineNumber: 857,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                variant: "outline",
                                                size: "sm",
                                                onClick: ()=>handleZoom(Math.min(400, zoom + 25)),
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$zoom$2d$in$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ZoomIn$3e$__["ZoomIn"], {
                                                    className: "w-4 h-4"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                    lineNumber: 863,
                                                    columnNumber: 17
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                lineNumber: 858,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                        lineNumber: 848,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                lineNumber: 794,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                ref: containerRef,
                                className: "flex-1 relative bg-white overflow-hidden flex items-center justify-center",
                                children: [
                                    currentFrameImage ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                        src: currentFrameImage,
                                        alt: `Frame ${currentImage}`,
                                        className: "max-w-full max-h-full object-contain pointer-events-none",
                                        style: {
                                            transform: `scale(${imageScale})`
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                        lineNumber: 869,
                                        columnNumber: 15
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center justify-center h-64 bg-gray-100 rounded-lg",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-center",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                    lineNumber: 878,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-gray-600",
                                                    children: "Loading key frame..."
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                    lineNumber: 879,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                            lineNumber: 877,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                        lineNumber: 876,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
                                        ref: canvasRef,
                                        className: "absolute top-0 left-0 pointer-events-auto",
                                        style: {
                                            transform: `scale(${imageScale})`,
                                            cursor: selectedTool === "box" ? "crosshair" : "default"
                                        },
                                        onMouseDown: handleMouseDown,
                                        onMouseMove: handleMouseMove,
                                        onMouseUp: handleMouseUp,
                                        onContextMenu: (e)=>e.preventDefault()
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                        lineNumber: 883,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                lineNumber: 867,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                        lineNumber: 793,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                lineNumber: 699,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-80 bg-white border-l border-gray-200 flex flex-col",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-4 border-b border-gray-200",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "font-semibold text-gray-800 mb-4",
                                children: "Classes"
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                lineNumber: 897,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center space-x-2 mb-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                        placeholder: "New class name",
                                        value: newClassName,
                                        onChange: (e)=>setNewClassName(e.target.value)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                        lineNumber: 899,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                        onClick: handleAddClass,
                                        className: "bg-blue-600 hover:bg-blue-700 text-white",
                                        children: "Add"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                        lineNumber: 904,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                lineNumber: 898,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-2",
                                children: (()=>{
                                    const totalPages = Math.max(1, Math.ceil(classes.length / CLASSES_PER_PAGE));
                                    const startIdx = (classPage - 1) * CLASSES_PER_PAGE;
                                    const pageItems = classes.slice(startIdx, startIdx + CLASSES_PER_PAGE);
                                    return pageItems;
                                })().map((cls)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: `flex items-center justify-between p-3 rounded-lg transition-colors ${selectedClass === cls.id ? "bg-gray-100 border border-gray-300" : "hover:bg-gray-50"}`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                onClick: ()=>setSelectedClass(cls.id),
                                                className: "flex items-center cursor-pointer",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "w-3 h-3 rounded-full mr-3",
                                                        style: {
                                                            backgroundColor: cls.color
                                                        }
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                        lineNumber: 922,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: `text-sm ${selectedClass === cls.id ? "font-semibold" : ""}`,
                                                        children: cls.name
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                        lineNumber: 923,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                lineNumber: 921,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                variant: "outline",
                                                size: "sm",
                                                onClick: ()=>handleDeleteClass(cls.id),
                                                className: "text-red-600 border-red-600 hover:bg-red-50",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {
                                                    className: "w-4 h-4"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                    lineNumber: 933,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                lineNumber: 927,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, cls.id, true, {
                                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                        lineNumber: 915,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                lineNumber: 908,
                                columnNumber: 11
                            }, this),
                            classes.length > CLASSES_PER_PAGE && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-3 flex items-center justify-between",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs text-gray-600",
                                        children: [
                                            "Page ",
                                            classPage,
                                            " of ",
                                            Math.max(1, Math.ceil(classes.length / CLASSES_PER_PAGE))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                        lineNumber: 940,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "space-x-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                size: "sm",
                                                onClick: ()=>setClassPage((p)=>Math.max(1, p - 1)),
                                                disabled: classPage <= 1,
                                                className: "bg-blue-600 hover:bg-blue-700 text-white",
                                                children: "Prev"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                lineNumber: 944,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                size: "sm",
                                                onClick: ()=>setClassPage((p)=>Math.min(Math.max(1, Math.ceil(classes.length / CLASSES_PER_PAGE)), p + 1)),
                                                disabled: classPage >= Math.max(1, Math.ceil(classes.length / CLASSES_PER_PAGE)),
                                                className: "bg-blue-600 hover:bg-blue-700 text-white",
                                                children: "Next"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                lineNumber: 952,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                        lineNumber: 943,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                lineNumber: 939,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                        lineNumber: 896,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1 p-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "font-semibold text-gray-800 mb-4",
                                children: "Current Annotations"
                            }, void 0, false, {
                                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                lineNumber: 965,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-2",
                                children: [
                                    annotations.map((annotation)=>{
                                        const classInfo = classes.find((c)=>c.id === annotation.class);
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center justify-between p-2 bg-gray-50 rounded-lg",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "w-3 h-3 rounded-full mr-2",
                                                            style: {
                                                                backgroundColor: classInfo?.color
                                                            }
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                            lineNumber: 972,
                                                            columnNumber: 21
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-sm",
                                                            children: annotation.class
                                                        }, void 0, false, {
                                                            fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                            lineNumber: 973,
                                                            columnNumber: 21
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                    lineNumber: 971,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                    variant: "outline",
                                                    size: "sm",
                                                    onClick: ()=>handleDeleteAnnotation(annotation.id),
                                                    className: "text-red-600 border-red-600 hover:bg-red-50 p-1",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$trash$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Trash2$3e$__["Trash2"], {
                                                        className: "w-3 h-3"
                                                    }, void 0, false, {
                                                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                        lineNumber: 981,
                                                        columnNumber: 21
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                                    lineNumber: 975,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, annotation.id, true, {
                                            fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                            lineNumber: 970,
                                            columnNumber: 17
                                        }, this);
                                    }),
                                    annotations.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-gray-500 text-sm text-center py-4",
                                        children: "No annotations yet. Select the Box tool and draw on the image."
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                        lineNumber: 987,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                                lineNumber: 966,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                        lineNumber: 964,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                lineNumber: 895,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
        lineNumber: 698,
        columnNumber: 5
    }, this);
}
_s(AnnotatePageContent, "cUd0GOtWTIqSo9DSNRykg3xKzJk=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"]
    ];
});
_c = AnnotatePageContent;
const AnnotatePage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(_c1 = ()=>Promise.resolve(AnnotatePageContent), {
    ssr: false,
    loading: ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-center h-screen",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"
                    }, void 0, false, {
                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                        lineNumber: 1003,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-gray-600",
                        children: "Loading annotation tool..."
                    }, void 0, false, {
                        fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                        lineNumber: 1004,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
                lineNumber: 1002,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/frontend/app/project/[id]/annotate/page.tsx",
            lineNumber: 1001,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
});
_c2 = AnnotatePage;
const __TURBOPACK__default__export__ = AnnotatePage;
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "AnnotatePageContent");
__turbopack_context__.k.register(_c1, "AnnotatePage$dynamic");
__turbopack_context__.k.register(_c2, "AnnotatePage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=frontend_2cbe31f9._.js.map