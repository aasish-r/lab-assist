"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataView = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
/**
 * Data View Component
 * Displays lab data in tables and provides basic data management
 */
const react_1 = require("react");
const DataView = () => {
    const [animals, setAnimals] = (0, react_1.useState)([]);
    const [readings, setReadings] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [activeTab, setActiveTab] = (0, react_1.useState)('animals');
    // Load data on mount
    (0, react_1.useEffect)(() => {
        loadData();
    }, []);
    const loadData = async () => {
        setLoading(true);
        try {
            // For MVP, use mock data since database might not be fully connected yet
            setAnimals([]);
            setReadings([]);
        }
        catch (error) {
            console.error('Failed to load data:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const formatDate = (date) => {
        const d = new Date(date);
        return d.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    if (loading) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "data-view loading", children: (0, jsx_runtime_1.jsx)("div", { className: "loading-spinner", children: "Loading data..." }) }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "data-view", children: [(0, jsx_runtime_1.jsxs)("div", { className: "data-view-header", children: [(0, jsx_runtime_1.jsx)("h2", { children: "Lab Data" }), (0, jsx_runtime_1.jsxs)("div", { className: "tab-controls", children: [(0, jsx_runtime_1.jsx)("button", { className: `tab-button ${activeTab === 'animals' ? 'active' : ''}`, onClick: () => setActiveTab('animals'), children: "Animals" }), (0, jsx_runtime_1.jsx)("button", { className: `tab-button ${activeTab === 'readings' ? 'active' : ''}`, onClick: () => setActiveTab('readings'), children: "Readings" })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "data-view-content", children: (0, jsx_runtime_1.jsxs)("div", { className: "data-table-container", children: [(0, jsx_runtime_1.jsxs)("div", { className: "table-header", children: [(0, jsx_runtime_1.jsxs)("h3", { children: [activeTab === 'animals' ? 'Animals' : 'Readings', " (0)"] }), (0, jsx_runtime_1.jsx)("button", { className: "refresh-button", onClick: loadData, children: "\uD83D\uDD04 Refresh" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "empty-state", children: [(0, jsx_runtime_1.jsx)("p", { children: "No data recorded yet." }), (0, jsx_runtime_1.jsx)("p", { children: "Start by recording some data with voice commands!" })] })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "data-view-footer", children: (0, jsx_runtime_1.jsxs)("div", { className: "stats", children: [(0, jsx_runtime_1.jsxs)("span", { className: "stat-item", children: [(0, jsx_runtime_1.jsx)("strong", { children: "0" }), " animals tracked"] }), (0, jsx_runtime_1.jsxs)("span", { className: "stat-item", children: [(0, jsx_runtime_1.jsx)("strong", { children: "0" }), " total readings"] }), (0, jsx_runtime_1.jsxs)("span", { className: "stat-item", children: ["Last updated: ", formatDate(new Date())] })] }) })] }));
};
exports.DataView = DataView;
