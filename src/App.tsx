import { Center, Loader } from "@mantine/core";
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import "./App.css";
import { AppLayout } from "./components/AppLayout";

const DashboardPage = lazy(() =>
    import("./pages/DashboardPage").then((module) => ({
        default: module.DashboardPage,
    })),
);
const FilamentsPage = lazy(() =>
    import("./pages/FilamentsPage").then((module) => ({
        default: module.FilamentsPage,
    })),
);
const FilamentDetailPage = lazy(() =>
    import("./pages/FilamentDetailPage").then((module) => ({
        default: module.FilamentDetailPage,
    })),
);
const HistoryPage = lazy(() =>
    import("./pages/HistoryPage").then((module) => ({
        default: module.HistoryPage,
    })),
);
const DataPage = lazy(() =>
    import("./pages/DataPage").then((module) => ({ default: module.DataPage })),
);
const PrivacyPage = lazy(() =>
    import("./pages/PrivacyPage").then((module) => ({
        default: module.PrivacyPage,
    })),
);

function App() {
    return (
        <Suspense
            fallback={
                <Center mih="100vh">
                    <Loader aria-label="Loading page" />
                </Center>
            }
        >
            <Routes>
                <Route element={<AppLayout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="filaments" element={<FilamentsPage />} />
                    <Route
                        path="filaments/:spoolId"
                        element={<FilamentDetailPage />}
                    />
                    <Route path="history" element={<HistoryPage />} />
                    <Route path="data" element={<DataPage />} />
                    <Route path="privacy" element={<PrivacyPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    );
}

export default App;
