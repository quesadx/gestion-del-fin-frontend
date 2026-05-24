import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, unwrapList } from "../../lib/api";
import { useCampStore, useAuthStore } from "../../store";
import { Expedition } from "../../types";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import {
  Map,
  MapPin,
  Calendar,
  Users,
  Plus,
  ChevronRight,
  Timer,
  AlertCircle,
  X,
  Edit2,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn, formatDate } from "../../lib/utils";
import { Skeleton } from "../../components/Skeleton";

export default function ExpeditionList() {
  const { currentCampId } = useCampStore();
  const { userId } = useAuthStore();
  const queryClient = useQueryClient();

  // --- Confirm dialogs ---
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // --- Create form state ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [destination, setDestination] = useState("");
  const [notes, setNotes] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  const [maxReturnDate, setMaxReturnDate] = useState("");

  // --- Return modal state ---
  const [returningExpedition, setReturningExpedition] =
    useState<Expedition | null>(null);
  const [foundResources, setFoundResources] = useState<
    { resource_type_id: number; amount: number }[]
  >([]);
  const [returnMemberStatus, setReturnMemberStatus] =
    useState<string>("HEALTHY");

  // --- Edit form state (PUT — no status) ---
  const [editingExpedition, setEditingExpedition] = useState<Expedition | null>(
    null,
  );
  const [editDestination, setEditDestination] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editDepartureDate, setEditDepartureDate] = useState("");
  const [editExpectedReturn, setEditExpectedReturn] = useState("");
  const [editMaxReturn, setEditMaxReturn] = useState("");

  // Helper: fallback user ID (the server validates via JWT; this just satisfies the required field)
  const actorId = userId ?? 1;

  const { data: expeditions, isLoading } = useQuery<Expedition[]>({
    queryKey: ["expeditions", currentCampId],
    queryFn: async () => {
      const res = await apiClient.get("/expeditions");
      return unwrapList<Expedition>(res.data);
    },
    enabled: !!currentCampId,
  });

  const { data: resources } = useQuery<
    { id: number; name: string; unit: string }[]
  >({
    queryKey: ["resources"],
    queryFn: async () => {
      const res = await apiClient.get("/resources");
      return unwrapList<any>(res.data);
    },
  });

  // POST /expeditions — all required fields
  const createExpMutation = useMutation({
    mutationFn: async (payload: {
      camp_id: number;
      created_by: number;
      destination: string;
      departure_date: string;
      expected_return_date: string;
      max_return_date: string;
      notes: string;
      status: string;
    }) => {
      const res = await apiClient.post("/expeditions", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["expeditions", currentCampId],
      });
      queryClient.invalidateQueries({
        queryKey: ["dashboard-metrics", currentCampId],
      });
      setIsModalOpen(false);
      setDestination("");
      setNotes("");
      setDepartureDate("");
      setExpectedReturnDate("");
      setMaxReturnDate("");
    },
  });

  // PUT /expeditions/:id — fields only, NO status
  const updateDetailsMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<Expedition>;
    }) => {
      const res = await apiClient.put(`/expeditions/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["expeditions", currentCampId],
      });
      setEditingExpedition(null);
    },
  });

  // PATCH /expeditions/:id/status — status changes only
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      actual_return_date,
      resources_to_return,
      return_member_status,
    }: {
      id: number;
      status: string;
      actual_return_date?: string;
      resources_to_return?: { resource_type_id: number; amount: number }[];
      return_member_status?: string;
    }) => {
      const body: Record<string, any> = { status, changed_by: actorId };
      if (actual_return_date) body.actual_return_date = actual_return_date;
      if (resources_to_return?.length)
        body.resources_to_return = resources_to_return;
      if (return_member_status)
        body.return_member_status = return_member_status;

      try {
        const res = await apiClient.patch(`/expeditions/${id}/status`, body);
        return res.data;
      } catch (error: any) {
        if (![404, 405].includes(error.response?.status)) {
          throw error;
        }

        const legacyRes = await apiClient.put(`/expeditions/${id}`, {
          status,
          ...(actual_return_date ? { actual_return_date } : {}),
        });
        return legacyRes.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["expeditions", currentCampId],
      });
      queryClient.invalidateQueries({
        queryKey: ["dashboard-metrics", currentCampId],
      });
    },
  });

  // DELETE /expeditions/:id — changed_by required in body
  const deleteExpMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete(`/expeditions/${id}`, {
        data: { changed_by: actorId },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["expeditions", currentCampId],
      });
      queryClient.invalidateQueries({
        queryKey: ["dashboard-metrics", currentCampId],
      });
    },
  });

  const today = new Date().toISOString().split("T")[0];
  const [returnDate, setReturnDate] = useState(today);

  const handleCreateExpedition = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !destination ||
      !currentCampId ||
      !departureDate ||
      !expectedReturnDate ||
      !maxReturnDate
    )
      return;
    createExpMutation.mutate({
      camp_id: currentCampId,
      created_by: actorId,
      destination,
      departure_date: departureDate,
      expected_return_date: expectedReturnDate,
      max_return_date: maxReturnDate,
      notes,
      status: "PLANNED",
    });
  };

  const handleEditExpClick = (exp: Expedition) => {
    setEditingExpedition(exp);
    setEditDestination(exp.destination);
    setEditNotes(exp.notes || "");
    setEditDepartureDate(exp.departure_date?.split("T")[0] ?? "");
    setEditExpectedReturn(exp.expected_return_date?.split("T")[0] ?? "");
    setEditMaxReturn(exp.max_return_date?.split("T")[0] ?? "");
  };

  const handleEditExpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpedition) return;
    updateDetailsMutation.mutate({
      id: editingExpedition.id,
      data: {
        destination: editDestination,
        notes: editNotes,
        departure_date: editDepartureDate,
        expected_return_date: editExpectedReturn || undefined,
        max_return_date: editMaxReturn || undefined,
      },
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-brand-primary">
            Exploration Planning
          </h1>
          <p className="text-zinc-500 font-mono text-xs uppercase pl-1">
            Critical mission management & tracking logistics
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-primary hover:bg-brand-primary/95 text-black font-semibold uppercase tracking-wider px-6 py-2 rounded-md flex items-center gap-2 text-sm transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)]"
        >
          <Plus size={20} />
          CONFIGURE MISSION
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="p-6 bg-surface-raised/40 brutalist-border rounded-xl space-y-4 animate-pulse flex flex-col lg:flex-row justify-between items-start lg:items-center"
            >
              <div className="space-y-2 flex-1 w-full">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-7 w-48" />
                </div>
                <Skeleton className="h-4 w-5/6" />
              </div>
              <div className="flex gap-4 w-full lg:w-auto pt-4 lg:pt-0">
                <Skeleton className="h-8 w-24 rounded" />
                <Skeleton className="h-8 w-24 rounded" />
              </div>
            </div>
          ))
        ) : expeditions?.length === 0 ? (
          <div className="py-20 text-center bg-surface-raised brutalist-border rounded-xl">
            <Map size={48} className="mx-auto text-zinc-800 mb-4" />
            <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
              No active or planned expeditions.
            </p>
          </div>
        ) : (
          expeditions?.map((exp, i) => (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group bg-surface-raised brutalist-border rounded-xl overflow-hidden hover:border-zinc-700 transition-all"
            >
              <div className="flex flex-col lg:flex-row">
                <div
                  className={cn(
                    "w-full lg:w-2 py-4 lg:py-0",
                    exp.status === "ONGOING" || exp.status === "ACTIVE"
                      ? "bg-amber-500 shadow-[2px_0_10px_rgba(245,158,11,0.3)]"
                      : exp.status === "PLANNED" || exp.status === "PLANNING"
                        ? "bg-zinc-700"
                        : exp.status === "RETURNED"
                          ? "bg-emerald-500"
                          : "bg-red-500 animate-pulse",
                  )}
                />

                <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
                  <div className="lg:col-span-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-[9px] font-black uppercase px-2 py-0.5 rounded border",
                          exp.status === "ONGOING" || exp.status === "ACTIVE"
                            ? "bg-amber-950/20 text-amber-500 border-amber-500/30"
                            : exp.status === "RETURNED"
                              ? "bg-emerald-950/20 text-emerald-500 border-emerald-500/30"
                              : exp.status === "CANCELLED" ||
                                  exp.status === "LOST"
                                ? "bg-red-950/20 text-red-500 border-red-500/30"
                                : "bg-zinc-950/20 text-zinc-500 border-zinc-700/50",
                        )}
                      >
                        {exp.status}
                      </span>
                      <span className="text-zinc-600 font-mono text-[10px]">
                        ID: EX-{exp.id}09
                      </span>
                    </div>
                    <h3 className="text-2xl font-black tracking-tighter uppercase italic">
                      {exp.destination}
                    </h3>
                    <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-brand-primary" />
                        {exp.destination}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        START: {formatDate(exp.departure_date)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 border-l border-zinc-900 pl-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase">
                        <Users size={12} /> Personnel
                      </div>
                      <p className="font-mono font-bold text-xl">
                        — <span className="text-xs text-zinc-600">UNITS</span>
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase">
                        <Timer size={12} /> Expected Return
                      </div>
                      <p className="font-mono font-bold text-sm text-zinc-400">
                        {exp.expected_return_date
                          ? formatDate(exp.expected_return_date)
                          : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:border-l lg:border-zinc-900 lg:pl-6">
                    {(exp.status === "PLANNED" ||
                      exp.status === "PLANNING") && (
                      <button
                        onClick={() =>
                          updateStatusMutation.mutate({
                            id: exp.id,
                            status: "ONGOING",
                          })
                        }
                        disabled={updateStatusMutation.isPending}
                        className="px-3 py-1.5 bg-brand-primary text-black font-extrabold text-[10px] uppercase rounded hover:bg-brand-primary/90 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        DEPLOY SQUAD
                      </button>
                    )}
                    {(exp.status === "ONGOING" || exp.status === "ACTIVE") && (
                      <>
                        <button
                          onClick={() => {
                            setFoundResources([]);
                            setReturnMemberStatus("HEALTHY");
                            setReturningExpedition(exp);
                          }}
                          disabled={updateStatusMutation.isPending}
                          className="px-3 py-1.5 bg-emerald-600 text-white font-extrabold text-[10px] uppercase rounded hover:bg-emerald-500 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          CONFIRM RETURN
                        </button>
                        <button
                          onClick={() => setConfirmCancelId(exp.id)}
                          disabled={updateStatusMutation.isPending}
                          className="px-3 py-1.5 bg-red-600 text-white font-extrabold text-[10px] uppercase rounded hover:bg-red-500 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          MARK LOST
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleEditExpClick(exp)}
                      className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
                      title="Edit details"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(exp.id)}
                      disabled={deleteExpMutation.isPending}
                      className="p-2 bg-zinc-950 border border-red-950/40 text-red-500/70 hover:text-red-400 hover:bg-red-950/20 rounded transition-colors cursor-pointer"
                      title="Delete log"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {(exp.status === "ONGOING" || exp.status === "ACTIVE") && (
                <div className="px-6 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1 bg-zinc-900 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: "10%" }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="w-1/3 h-full bg-amber-500/50"
                      />
                    </div>
                    <span className="text-[9px] font-mono text-amber-500 animate-pulse">
                      TRANSMISSION IN PROGRESS...
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      <div className="p-6 bg-red-950/10 border border-red-500/20 rounded-xl flex items-start gap-4">
        <AlertCircle className="text-red-500 shrink-0 mt-1" size={20} />
        <div className="space-y-1">
          <p className="text-sm font-bold text-red-500 uppercase">
            Exploration Emergency Protocol
          </p>
          <p className="text-xs text-zinc-500 leading-relaxed max-w-2xl font-medium">
            Any expedition exceeding its max return date will be marked as{" "}
            <span className="text-red-400 font-black italic">
              OPERATIONAL FATALITY
            </span>
            . No rescue missions authorized without direct approval from the
            System Administrator.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {/* Create Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-surface-raised brutalist-border p-6 md:p-8 rounded-xl max-w-xl w-full space-y-6"
            >
              <div className="border-b border-zinc-900 pb-4 mb-2">
                <p className="text-[10px] font-mono text-brand-primary uppercase tracking-widest leading-none mb-1">
                  TACTICAL INTERFACE EX-10
                </p>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                  Configure Scouting Mission
                </h3>
                <p className="text-xs text-zinc-500 font-mono">
                  Deploy a squad to forage supplies or scout hostile territory
                  structures.
                </p>
              </div>

              <form onSubmit={handleCreateExpedition} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Destination Landmark
                  </label>
                  <input
                    required
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. Forgotten Highway Warehouse"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary font-mono uppercase"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Departure Date
                    </label>
                    <input
                      required
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Expected Return
                    </label>
                    <input
                      required
                      type="date"
                      value={expectedReturnDate}
                      onChange={(e) => setExpectedReturnDate(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Max Return
                    </label>
                    <input
                      required
                      type="date"
                      value={maxReturnDate}
                      onChange={(e) => setMaxReturnDate(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Mission briefings / allocated assets notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. searching dry food caches. Allocating 4 units of 9mm ammo and basic scout gear."
                    rows={3}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary resize-none font-mono uppercase"
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 text-xs font-bold border border-zinc-800 hover:bg-zinc-900 rounded transition-colors uppercase"
                  >
                    ABORT CONFIG
                  </button>
                  <button
                    type="submit"
                    disabled={createExpMutation.isPending}
                    className="flex-2 py-2.5 bg-brand-primary text-black text-xs font-bold uppercase rounded hover:bg-brand-primary/90 transition-colors disabled:opacity-30"
                  >
                    {createExpMutation.isPending
                      ? "ENCRYPTING DISPATCH..."
                      : "CONFIRM MISSION DISPATCH"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Edit Modal — PUT only, no status */}
        {editingExpedition && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-surface-raised brutalist-border p-6 md:p-8 rounded-xl max-w-xl w-full space-y-6"
            >
              <div className="flex justify-between items-start border-b border-zinc-900 pb-4 mb-2">
                <div>
                  <p className="text-[10px] font-mono text-brand-primary uppercase tracking-widest leading-none mb-1">
                    TACTICAL INTERFACE EX-10
                  </p>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                    Edit Scouting Mission
                  </h3>
                  <p className="text-[10px] font-mono text-zinc-600 mt-1">
                    To change mission status use the quick-action buttons on the
                    mission card.
                  </p>
                </div>
                <button
                  onClick={() => setEditingExpedition(null)}
                  className="p-1 text-zinc-500 hover:text-white rounded"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleEditExpSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Destination Landmark
                  </label>
                  <input
                    required
                    type="text"
                    value={editDestination}
                    onChange={(e) => setEditDestination(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary font-mono uppercase"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Departure Date
                    </label>
                    <input
                      required
                      type="date"
                      value={editDepartureDate}
                      onChange={(e) => setEditDepartureDate(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Expected Return
                    </label>
                    <input
                      type="date"
                      value={editExpectedReturn}
                      onChange={(e) => setEditExpectedReturn(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Max Return
                    </label>
                    <input
                      type="date"
                      value={editMaxReturn}
                      onChange={(e) => setEditMaxReturn(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Mission briefings / notes
                  </label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={3}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary resize-none font-mono uppercase"
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => setEditingExpedition(null)}
                    className="flex-1 py-2.5 text-xs font-bold border border-zinc-800 hover:bg-zinc-900 rounded transition-colors uppercase"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={updateDetailsMutation.isPending}
                    className="flex-2 py-2.5 bg-brand-primary text-black text-xs font-bold uppercase rounded hover:bg-brand-primary/90 transition-colors disabled:opacity-30"
                  >
                    {updateDetailsMutation.isPending
                      ? "SAVING CHANGES..."
                      : "SAVE CHANGES"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Return Modal */}
        {returningExpedition && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-surface-raised brutalist-border p-6 md:p-8 rounded-xl max-w-xl w-full space-y-6"
            >
              <div className="flex justify-between items-start border-b border-zinc-900 pb-4 mb-2">
                <div>
                  <p className="text-[10px] font-mono text-brand-primary uppercase tracking-widest leading-none mb-1">
                    TACTICAL INTERFACE EX-10
                  </p>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                    CONFIRM EXPEDITION RETURN
                  </h3>
                  <p className="text-[10px] font-mono text-zinc-600 mt-1">
                    {returningExpedition.destination}
                  </p>
                </div>
                <button
                  onClick={() => setReturningExpedition(null)}
                  className="p-1 text-zinc-500 hover:text-white rounded"
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateStatusMutation.mutate(
                    {
                      id: returningExpedition.id,
                      status: "RETURNED",
                      actual_return_date: returnDate,
                      resources_to_return: foundResources.filter(
                        (r) => r.resource_type_id && r.amount > 0,
                      ),
                      return_member_status: returnMemberStatus,
                    },
                    { onSettled: () => setReturningExpedition(null) },
                  );
                }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Return Date
                  </label>
                  <input
                    required
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    FOUND RESOURCES (optional)
                  </label>
                  {foundResources.map((row, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <select
                        value={row.resource_type_id || ""}
                        onChange={(e) => {
                          const updated = [...foundResources];
                          updated[idx] = {
                            ...updated[idx],
                            resource_type_id: Number(e.target.value),
                          };
                          setFoundResources(updated);
                        }}
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary font-mono"
                      >
                        <option value="">Select resource…</option>
                        {(resources ?? []).map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} ({r.unit})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        value={row.amount || ""}
                        onChange={(e) => {
                          const updated = [...foundResources];
                          updated[idx] = {
                            ...updated[idx],
                            amount: Number(e.target.value),
                          };
                          setFoundResources(updated);
                        }}
                        placeholder="Qty"
                        className="w-20 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary font-mono"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFoundResources(
                            foundResources.filter((_, i) => i !== idx),
                          )
                        }
                        className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setFoundResources([
                        ...foundResources,
                        { resource_type_id: 0, amount: 0 },
                      ])
                    }
                    className="text-[10px] font-bold text-brand-primary uppercase hover:text-brand-primary/80 transition-colors"
                  >
                    + ADD RESOURCE
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    MEMBER STATUS ON RETURN
                  </label>
                  <select
                    value={returnMemberStatus}
                    onChange={(e) => setReturnMemberStatus(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary font-mono uppercase"
                  >
                    <option value="HEALTHY">HEALTHY</option>
                    <option value="INJURED">INJURED</option>
                    <option value="SICK">SICK</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => setReturningExpedition(null)}
                    className="flex-1 py-2.5 text-xs font-bold border border-zinc-800 hover:bg-zinc-900 rounded transition-colors uppercase"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={updateStatusMutation.isPending}
                    className="flex-2 py-2.5 bg-emerald-600 text-white text-xs font-bold uppercase rounded hover:bg-emerald-500 transition-colors disabled:opacity-30"
                  >
                    {updateStatusMutation.isPending
                      ? "PROCESSING..."
                      : "CONFIRM RETURN"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm: mark expedition as cancelled */}
      <ConfirmDialog
        isOpen={confirmCancelId !== null}
        title="Mark deployment as lost?"
        description="This will permanently mark the expedition as CANCELLED. The status cannot be reversed."
        confirmLabel="MARK LOST"
        variant="warning"
        isPending={updateStatusMutation.isPending}
        onConfirm={() => {
          if (confirmCancelId !== null) {
            updateStatusMutation.mutate(
              { id: confirmCancelId, status: "CANCELLED" },
              { onSettled: () => setConfirmCancelId(null) },
            );
          }
        }}
        onCancel={() => setConfirmCancelId(null)}
      />

      {/* Confirm: delete expedition log */}
      <ConfirmDialog
        isOpen={confirmDeleteId !== null}
        title="Delete scouting log?"
        description="This will permanently remove the expedition record. This action cannot be undone."
        confirmLabel="DELETE"
        variant="danger"
        isPending={deleteExpMutation.isPending}
        onConfirm={() => {
          if (confirmDeleteId !== null) {
            deleteExpMutation.mutate(confirmDeleteId, {
              onSettled: () => setConfirmDeleteId(null),
            });
          }
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
