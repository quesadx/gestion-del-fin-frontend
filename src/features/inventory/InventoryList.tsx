import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../lib/api";
import { useCampStore } from "../../store";
import { InventorySnapshot } from "../../types";
import {
  Package,
  AlertTriangle,
  ArrowDownUp,
  Info,
  History,
  X,
  PlusCircle,
  MinusCircle,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn, formatQuantity } from "../../lib/utils";
import { Skeleton } from "../../components/Skeleton";

export default function InventoryList() {
  const { currentCampId } = useCampStore();
  const queryClient = useQueryClient();

  // Modals
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);

  // Form states for manual adjustment
  const [selectedResourceId, setSelectedResourceId] = useState<number>(1);
  const [adjustType, setAdjustType] = useState<"MANUAL_IN" | "MANUAL_OUT">(
    "MANUAL_IN",
  );
  const [adjustQuantity, setAdjustQuantity] = useState<string>("");
  const [adjustDescription, setAdjustDescription] = useState<string>("");

  const { data: inventory, isLoading } = useQuery<InventorySnapshot[]>({
    queryKey: ["inventory", currentCampId],
    queryFn: async () => {
      const [invRes, resRes] = await Promise.all([
        apiClient.get(`/inventory/${currentCampId}`),
        apiClient.get("/resources"),
      ]);
      const items: any[] = invRes.data?.data ?? invRes.data ?? [];
      const resourceTypes: any[] = resRes.data?.data ?? resRes.data ?? [];
      return items.map((item: any) => {
        const rt = resourceTypes.find(
          (r: any) => r.id === item.resource_type_id,
        );
        const qty = item.quantity ?? 0;
        const minStock = rt?.minimum_stock ?? 0;
        return {
          resource_id: item.resource_type_id,
          resource_name: rt?.name ?? `Resource #${item.resource_type_id}`,
          unit: rt?.unit ?? "",
          quantity: qty,
          minimum_stock: minStock,
          daily_ration: rt?.daily_ration ?? 0,
          daily_usage: 0,
          projection_days: null,
          status:
            qty < minStock
              ? qty < minStock / 2
                ? "CRITICAL"
                : "LOW"
              : "OPTIMAL",
        } as InventorySnapshot;
      });
    },
    enabled: !!currentCampId,
  });

  const { data: auditLogs, isLoading: isAuditLoading } = useQuery<any[]>({
    queryKey: ["inventory-audit", currentCampId],
    queryFn: async () => {
      // The real API /inventory/audit returns a per-resource reconciliation
      // report (current quantity vs. cumulative log sum + discrepancy),
      // not a chronological event log.
      const auditRes = await apiClient.get(`/inventory/audit/${currentCampId}`);
      return auditRes.data?.data ?? auditRes.data ?? [];
    },
    enabled: !!currentCampId && isAuditOpen,
  });

  const adjustMutation = useMutation({
    mutationFn: async (payload: {
      camp_id: number;
      resource_type_id: number;
      type: "MANUAL_IN" | "MANUAL_OUT";
      quantity: number;
      description: string;
    }) => {
      const res = await apiClient.post("/inventory/adjustment", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", currentCampId] });
      queryClient.invalidateQueries({
        queryKey: ["dashboard-metrics", currentCampId],
      });
      queryClient.invalidateQueries({
        queryKey: ["resource-metrics", currentCampId],
      });
      setIsAdjustOpen(false);
      setAdjustQuantity("");
      setAdjustDescription("");
    },
  });

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(adjustQuantity);
    if (!currentCampId || !selectedResourceId || isNaN(qty) || qty <= 0) return;

    adjustMutation.mutate({
      camp_id: currentCampId,
      resource_type_id: selectedResourceId,
      type: adjustType,
      quantity: qty,
      description:
        adjustDescription ||
        `Manual ${adjustType === "MANUAL_IN" ? "Ingress" : "Egress"} of resources`,
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-brand-secondary">
            Storage Logs
          </h1>
          <p className="text-zinc-500 font-mono text-xs uppercase pl-1">
            Critical inventory & rationing alerts
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsAuditOpen(true)}
            className="brutalist-border hover:bg-zinc-900 text-zinc-300 font-bold px-4 py-2 rounded-md flex items-center gap-2 text-sm transition-all"
          >
            <History size={18} />
            AUDIT TRAIL
          </button>
          <button
            onClick={() => {
              if (inventory && inventory.length > 0) {
                setSelectedResourceId(inventory[0].resource_id);
              }
              setIsAdjustOpen(true);
            }}
            className="bg-brand-secondary hover:bg-amber-600 text-black font-bold px-4 py-2 rounded-md flex items-center gap-2 text-sm transition-all"
          >
            <ArrowDownUp size={18} />
            MANUAL ADJUST
          </button>
        </div>
      </div>

      {/* Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="p-6 bg-surface-raised/40 brutalist-border rounded-xl space-y-6 animate-pulse"
              >
                <div className="flex justify-between items-start">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <div className="flex justify-between">
                    <Skeleton className="h-2 w-8" />
                    <Skeleton className="h-2 w-24" />
                  </div>
                </div>
                <div className="pt-2 flex gap-4">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 flex-1" />
                </div>
              </div>
            ))
          : inventory?.map((item) => (
              <motion.div
                key={item.resource_id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-6 bg-surface-raised brutalist-border rounded-xl space-y-6 relative overflow-hidden group transition-all hover:bg-zinc-900/80 ${
                  item.status === "CRITICAL"
                    ? "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                    : item.status === "LOW"
                      ? "border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                      : "border-zinc-800"
                }`}
              >
                {/* Status Indicator */}
                <div
                  className={`absolute top-0 right-0 w-32 h-32 translate-x-16 -translate-y-16 rotate-45 opacity-10 ${
                    item.status === "CRITICAL"
                      ? "bg-red-500"
                      : item.status === "LOW"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                  }`}
                />

                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-zinc-950 rounded-lg flex items-center justify-center text-zinc-500 border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                    <Package size={24} />
                  </div>
                  <div
                    className={cn(
                      "text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded border flex items-center gap-1",
                      item.status === "CRITICAL"
                        ? "bg-red-950/20 text-red-500 border-red-500/30"
                        : item.status === "LOW"
                          ? "bg-amber-950/20 text-amber-500 border-amber-500/30"
                          : "bg-emerald-950/20 text-emerald-500 border-emerald-500/30",
                    )}
                  >
                    {item.status === "CRITICAL" && <AlertTriangle size={10} />}
                    {item.status}
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                    {item.resource_name}
                    <button className="text-zinc-600 hover:text-zinc-400">
                      <Info size={14} />
                    </button>
                  </h3>
                  <p className="text-zinc-500 font-mono text-xs uppercase">
                    Unit: {item.unit}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-zinc-600 uppercase tracking-widest">
                      In Stock
                    </span>
                    <span
                      className={`text-2xl font-black font-mono ${
                        item.status === "CRITICAL"
                          ? "text-red-500"
                          : item.status === "LOW"
                            ? "text-amber-500"
                            : "text-zinc-100"
                      }`}
                    >
                      {item.quantity}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min((item.quantity / (item.minimum_stock * 2)) * 100, 100)}%`,
                      }}
                      className={`h-full ${
                        item.status === "CRITICAL"
                          ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                          : item.status === "LOW"
                            ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                            : "bg-emerald-500"
                      }`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-zinc-600 uppercase">
                    <span>0</span>
                    <span className="text-zinc-400 font-bold">
                      Reserve Floor: {item.minimum_stock}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex gap-4">
                  <div className="flex-1 p-2 bg-zinc-950 border border-zinc-900 rounded text-center">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">
                      Daily Ration
                    </p>
                    <p className="text-xs font-mono font-bold">
                      {item.daily_ration} {item.unit}/p
                    </p>
                  </div>
                  <div className="flex-1 p-2 bg-zinc-950 border border-zinc-900 rounded text-center">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">
                      Projection
                    </p>
                    <p
                      className={cn(
                        "text-xs font-mono font-bold text-nowrap",
                        (item.projection_days || 0) < 5
                          ? "text-red-500"
                          : (item.projection_days || 0) < 10
                            ? "text-amber-500"
                            : "text-emerald-500",
                      )}
                    >
                      {item.projection_days !== null
                        ? `${item.projection_days} Days`
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
      </div>

      <AnimatePresence>
        {/* Audit Trail Modal */}
        {isAuditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              className="bg-surface-raised brutalist-border p-6 rounded-xl max-w-2xl w-full space-y-6"
            >
              <div className="flex justify-between items-start border-b border-zinc-900 pb-4">
                <div>
                  <p className="text-[10px] font-mono text-brand-secondary uppercase tracking-widest leading-none mb-1">
                    DATA AUDITOR AD-12
                  </p>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                    Inventory Integrity Report
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono">
                    Reconciliation of current stock vs. cumulative movement
                    logs. Flags discrepancies.
                  </p>
                </div>
                <button
                  onClick={() => setIsAuditOpen(false)}
                  className="p-1 text-zinc-500 hover:text-white border border-transparent hover:border-zinc-800 rounded transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="max-h-87.5 overflow-y-auto border border-zinc-900 rounded-lg bg-zinc-950/60 divide-y divide-zinc-900">
                {isAuditLoading ? (
                  <div className="p-8 text-center text-xs font-mono text-zinc-500 uppercase tracking-widest animate-pulse">
                    Querying secure logs database...
                  </div>
                ) : !auditLogs || auditLogs.length === 0 ? (
                  <div className="p-12 text-center text-xs font-mono text-zinc-500 uppercase tracking-widest">
                    No historical modifications recorded.
                  </div>
                ) : (
                  auditLogs.map((entry: any) => (
                    <div
                      key={entry.resource_type_id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 `hover:bg-white/2 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider border",
                              entry.is_consistent
                                ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/20"
                                : "bg-red-950/40 text-red-400 border-red-500/20",
                            )}
                          >
                            {entry.is_consistent ? "CONSISTENT" : "MISMATCH"}
                          </span>
                          <span className="font-bold text-sm text-zinc-100">
                            {entry.resource_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 font-mono text-[10px] text-zinc-500">
                          <span>
                            Current stock:{" "}
                            <span className="text-zinc-300">
                              {entry.inventory_quantity} {entry.unit}
                            </span>
                          </span>
                          <span>
                            Log delta:{" "}
                            <span className="text-zinc-300">
                              {entry.log_delta_sum} {entry.unit}
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={cn(
                            "font-mono font-bold text-base",
                            entry.discrepancy === 0
                              ? "text-emerald-400"
                              : "text-red-400",
                          )}
                        >
                          {entry.discrepancy === 0
                            ? "±0"
                            : entry.discrepancy > 0
                              ? `+${entry.discrepancy}`
                              : entry.discrepancy}
                        </span>
                        <p className="text-[10px] text-zinc-500 font-mono">
                          discrepancy
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-zinc-900 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsAuditOpen(false)}
                  className="px-6 py-2.5 text-xs font-bold border border-zinc-800 hover:bg-zinc-900 rounded transition-colors uppercase"
                >
                  DISMISS AUDITING
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Manual Adjust Modal */}
        {isAdjustOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              className="bg-surface-raised brutalist-border p-6 md:p-8 rounded-xl max-w-lg w-full space-y-6"
            >
              <div className="flex justify-between items-start border-b border-zinc-900 pb-4">
                <div>
                  <p className="text-[10px] font-mono text-brand-secondary uppercase tracking-widest leading-none mb-1">
                    DISPENSARY INTERFACE CR-08
                  </p>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                    Manual Stock Adjustment
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono">
                    Override stockpile logs due to field discoveries or
                    unplanned rationing.
                  </p>
                </div>
                <button
                  onClick={() => setIsAdjustOpen(false)}
                  className="p-1 text-zinc-500 hover:text-white border border-transparent hover:border-zinc-800 rounded transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAdjustSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Target Resource
                  </label>
                  <select
                    value={selectedResourceId}
                    onChange={(e) =>
                      setSelectedResourceId(Number(e.target.value))
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-secondary cursor-pointer"
                  >
                    {inventory?.map((item) => (
                      <option key={item.resource_id} value={item.resource_id}>
                        {item.resource_name} (Current: {item.quantity}{" "}
                        {item.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Adjustment Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAdjustType("MANUAL_IN")}
                        className={cn(
                          "py-2 text-xs font-bold border rounded flex items-center justify-center gap-1.5 transition-colors",
                          adjustType === "MANUAL_IN"
                            ? "bg-emerald-950/20 border-emerald-500 text-emerald-400"
                            : "border-zinc-800 text-zinc-500 hover:bg-zinc-900",
                        )}
                      >
                        <PlusCircle size={14} />
                        INGRESS (ADD)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdjustType("MANUAL_OUT")}
                        className={cn(
                          "py-2 text-xs font-bold border rounded flex items-center justify-center gap-1.5 transition-colors",
                          adjustType === "MANUAL_OUT"
                            ? "bg-red-950/20 border-red-500 text-red-400"
                            : "border-zinc-800 text-zinc-500 hover:bg-zinc-900",
                        )}
                      >
                        <MinusCircle size={14} />
                        EGRESS (SUB)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Quantity Change
                    </label>
                    <input
                      required
                      type="number"
                      min="1"
                      step="any"
                      value={adjustQuantity}
                      onChange={(e) => setAdjustQuantity(e.target.value)}
                      placeholder="e.g. 50"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-secondary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Modification Justification Note
                  </label>
                  <textarea
                    value={adjustDescription}
                    onChange={(e) => setAdjustDescription(e.target.value)}
                    placeholder="e.g. Discovered 5 crates of canned beans in warehouse basement near Highway 10."
                    rows={3}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-secondary resize-none"
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => setIsAdjustOpen(false)}
                    className="flex-1 py-2.5 text-xs font-bold border border-zinc-800 hover:bg-zinc-900 rounded transition-colors uppercase"
                  >
                    ABORT ADJUSTMENT
                  </button>
                  <button
                    type="submit"
                    disabled={adjustMutation.isPending || !adjustQuantity}
                    className="flex-1 py-2.5 bg-brand-secondary text-black text-xs font-black uppercase rounded hover:bg-amber-500 transition-colors disabled:opacity-30"
                  >
                    {adjustMutation.isPending
                      ? "TRANSMITTING ACTION..."
                      : "AUTHORIZE STOCK ENTRY"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
