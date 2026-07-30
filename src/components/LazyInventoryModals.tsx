import { lazy, Suspense, useEffect, useState } from "react";

import type { AdjustmentFormModalProps } from "./AdjustmentFormModal";
import type { PrintFormModalProps } from "./PrintFormModal";
import type { SpoolFormModalProps } from "./SpoolFormModal";

const AdjustmentFormModal = lazy(() =>
    import("./AdjustmentFormModal").then((module) => ({
        default: module.AdjustmentFormModal,
    })),
);
const PrintFormModal = lazy(() =>
    import("./PrintFormModal").then((module) => ({
        default: module.PrintFormModal,
    })),
);
const SpoolFormModal = lazy(() =>
    import("./SpoolFormModal").then((module) => ({
        default: module.SpoolFormModal,
    })),
);

function useLoadOnOpen(opened: boolean) {
    const [hasOpened, setHasOpened] = useState(opened);

    useEffect(() => {
        if (opened) setHasOpened(true);
    }, [opened]);

    return opened || hasOpened;
}

export function LazyAdjustmentFormModal(props: AdjustmentFormModalProps) {
    const shouldLoad = useLoadOnOpen(props.opened);

    return shouldLoad ? (
        <Suspense fallback={null}>
            <AdjustmentFormModal {...props} />
        </Suspense>
    ) : null;
}

export function LazyPrintFormModal(props: PrintFormModalProps) {
    const shouldLoad = useLoadOnOpen(props.opened);

    return shouldLoad ? (
        <Suspense fallback={null}>
            <PrintFormModal {...props} />
        </Suspense>
    ) : null;
}

export function LazySpoolFormModal(props: SpoolFormModalProps) {
    const shouldLoad = useLoadOnOpen(props.opened);

    return shouldLoad ? (
        <Suspense fallback={null}>
            <SpoolFormModal {...props} />
        </Suspense>
    ) : null;
}
