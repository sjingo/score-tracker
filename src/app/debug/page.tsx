"use client";

import { useEffect, useState } from "react";

interface DebugData {
    timestamp: string;
    summary: Record<string, number>;
    tables: {
        teams: any[];
        players: any[];
        gameTypes: any[];
        games: any[];
        gameScorers: any[];
        seasonStats: any[];
    };
}

export default function DebugPage() {
    const [data, setData] = useState<DebugData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedTables, setExpandedTables] = useState<Set<string>>(
        new Set(["summary"])
    );

    useEffect(() => {
        const fetchDebugData = async () => {
            try {
                console.log("[DEBUG PAGE] Fetching debug data...");
                const res = await fetch("/api/debug");
                const result = await res.json();

                if (result.success) {
                    console.log("[DEBUG PAGE] Debug data received:", result.data);
                    setData(result.data);
                } else {
                    setError(result.error);
                }
            } catch (err) {
                console.error("[DEBUG PAGE] Fetch error:", err);
                setError(String(err));
            } finally {
                setLoading(false);
            }
        };

        fetchDebugData();
        // Refresh every 5 seconds
        const interval = setInterval(fetchDebugData, 5000);
        return () => clearInterval(interval);
    }, []);

    const toggleTable = (tableName: string) => {
        const newExpanded = new Set(expandedTables);
        if (newExpanded.has(tableName)) {
            newExpanded.delete(tableName);
        } else {
            newExpanded.add(tableName);
        }
        setExpandedTables(newExpanded);
    };

    const renderTable = (tableName: string, rows: any[]) => {
        if (rows.length === 0) {
            return <div className="text-gray-500 italic">No data</div>;
        }

        const columns = Object.keys(rows[0]);

        return (
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className="bg-gray-100 border-b">
                            {columns.map((col) => (
                                <th key={col} className="border p-2 text-left font-semibold">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, idx) => (
                            <tr key={idx} className="border-b hover:bg-gray-50">
                                {columns.map((col) => (
                                    <td key={`${idx}-${col}`} className="border p-2">
                                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                            {String(row[col] !== null ? row[col] : "NULL")}
                                        </code>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    if (loading) return <div className="p-4 text-center">Loading debug data...</div>;
    if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold mb-2">🔍 Debug Console</h1>
                <p className="text-gray-600 mb-6">
                    Last updated: {data?.timestamp} (auto-refreshes every 5 seconds)
                </p>

                {/* Summary */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                    <div className="cursor-pointer" onClick={() => toggleTable("summary")}>
                        <h2 className="text-2xl font-bold mb-4">
                            {expandedTables.has("summary") ? "▼" : "▶"} Summary
                        </h2>
                    </div>
                    {expandedTables.has("summary") && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {Object.entries(data?.summary || {}).map(([key, count]) => (
                                <div key={key} className="bg-blue-50 p-2 rounded border-l-4 border-blue-500">
                                    <div className="text-xs font-semibold text-blue-600 uppercase">{key}</div>
                                    <div className="text-3xl font-bold text-blue-900">{count}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Tables */}
                {Object.entries(data?.tables || {}).map(([tableName, rows]) => (
                    <div key={tableName} className="bg-white rounded-lg shadow-md p-4 mb-6">
                        <div
                            className="cursor-pointer"
                            onClick={() => toggleTable(tableName)}
                        >
                            <h2 className="text-2xl font-bold mb-4">
                                {expandedTables.has(tableName) ? "▼" : "▶"} {tableName}
                                <span className="text-sm font-normal text-gray-600 ml-2">
                                    ({(rows as any[]).length} rows)
                                </span>
                            </h2>
                        </div>
                        {expandedTables.has(tableName) && (
                            <div className="mt-4">
                                {renderTable(tableName, rows as any[])}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Console Logger Display */}
            <div className="fixed bottom-4 right-4 bg-black text-white p-2 rounded w-96 max-h-64 overflow-y-auto font-mono text-xs">
                <div className="font-bold mb-2">📋 Console Output</div>
                <div className="text-gray-300">Check browser console (F12) for detailed logs</div>
            </div>
        </div>
    );
}
