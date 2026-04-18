import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, Search, Activity } from "lucide-react";
import { staggerContainer, staggerItem } from "@/shared/lib/motion";

const DUMMY_TRANSFERS = [
  {
    id: "TRX-40492",
    direction: "OUTGOING",
    origin: "CAMP_OMEGA",
    destination: "OUTPOST_ALPHA",
    item: "PURIFIED WATER",
    qty: 50,
    unit: "L",
    status: "DELIVERED",
  },
  {
    id: "TRX-40493",
    direction: "INCOMING",
    origin: "SECTOR_7_CENTRAL",
    destination: "CAMP_OMEGA",
    item: "9MM AMMUNITION",
    qty: 200,
    unit: "ROUNDS",
    status: "IN_TRANSIT",
  },
  {
    id: "TRX-40494",
    direction: "OUTGOING",
    origin: "CAMP_OMEGA",
    destination: "FUEL_DEPOT_09",
    item: "MRE RATIONS",
    qty: 100,
    unit: "UNITS",
    status: "PENDING",
  },
  {
    id: "TRX-40495",
    direction: "INCOMING",
    origin: "HQ_COMMAND",
    destination: "CAMP_OMEGA",
    item: "ANTIBIOTICS",
    qty: 12,
    unit: "DOSES",
    status: "APPROVED",
  },
];

const getStatusStyle = (status: string) => {
  switch (status) {
    case "DELIVERED":
      return "text-green-base border-green-base bg-green-base/10";
    case "IN_TRANSIT":
      return "text-green-bright border-green-bright bg-green-bright/10";
    case "APPROVED":
      return "text-green-dim border-green-dim bg-transparent";
    case "PENDING":
      return "text-warn-text border-warn-text bg-warn-text/10";
    default:
      return "text-green-mid border-green-mid bg-transparent";
  }
};

export function TransfersPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTransfers = DUMMY_TRANSFERS.filter(
    (trx) =>
      trx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trx.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trx.origin.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <div className="flex flex-1 flex-col border-2 border-green-mid bg-bg-panel p-4 pb-2 sm:p-6">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-dashed border-green-dim pb-4">
          <div>
            <h1 className="font-display text-lg sm:text-2xl text-green-hi tracking-widest uppercase mb-1">
              RESOURCE_TRANSFER_LOG //
              <br />
              <span className="text-green-base">MANIFEST_INDEX</span>
            </h1>
            <p className="font-system text-xs text-green-dim uppercase">
              SECTOR_7_LOGISTICS // TERMINAL_REF: 0xFF92A
            </p>
          </div>

          <div className="flex flex-col gap-2 w-full sm:w-80 shrink-0">
            <div className="relative w-full">
              <Search
                size={16}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-green-mid"
              />
              <input
                type="text"
                placeholder="QUERY_MANIFEST..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent border-b border-green-mid py-2 pl-8 pr-2 font-mono text-xs text-green-bright placeholder:text-green-dim focus:outline-none focus:border-green-bright transition-colors uppercase"
              />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 shrink-0">
          <div className="border border-green-mid bg-bg-deep p-3 flex flex-col justify-between">
            <span className="font-system text-[10px] text-green-dim uppercase">
              NETWORK_STABILITY
            </span>
            <span className="font-display text-lg text-green-bright mt-2">
              98.4%
            </span>
            <div className="w-full h-[2px] bg-green-bright mt-1"></div>
          </div>
          <div className="border border-green-mid bg-bg-deep p-3 flex flex-col justify-between">
            <span className="font-system text-[10px] text-green-dim uppercase">
              TOTAL_THROUGHPUT
            </span>
            <span className="font-display text-lg text-green-hi mt-2">
              14.2 TB
            </span>
          </div>
          <div className="border border-green-mid bg-bg-deep p-3 flex flex-col justify-between">
            <span className="font-system text-[10px] text-green-dim uppercase">
              QUEUE_DEPTH
            </span>
            <span className="font-display text-lg text-warn-text mt-2">
              18_OPS
            </span>
          </div>
          <div className="border border-green-mid bg-bg-deep p-3 flex items-center justify-center">
            <button className="flex items-center gap-2 border border-green-bright px-4 py-2 font-display text-xs text-green-bright hover:bg-green-bright hover:text-bg-screen transition-colors">
              <Activity size={16} />
              INITIATE_TRANSFER
            </button>
          </div>
        </div>

        <div className="hidden border-b-2 border-green-mid pb-2 px-2 md:grid grid-cols-12 gap-4 font-display text-[9px] text-green-dim uppercase tracking-widest mb-2 shrink-0">
          <div className="col-span-1 text-center">DIR</div>
          <div className="col-span-4">ORIGIN / DESTINATION</div>
          <div className="col-span-4">CARGO_DATA</div>
          <div className="col-span-3 text-right">OPERATIONAL_STATUS</div>
        </div>

        <motion.ul
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="flex flex-col flex-1 gap-2 overflow-y-auto custom-scrollbar pr-2 min-h-0"
        >
          {filteredTransfers.map((trx) => {
            const statusConfig = getStatusStyle(trx.status);

            return (
              <motion.li
                key={trx.id}
                variants={staggerItem}
                className="group flex flex-col md:grid md:grid-cols-12 md:items-center gap-2 md:gap-4 p-3 border border-green-mid/30 bg-bg-deep hover:border-green-base transition-colors"
              >
                <div className="col-span-1 flex items-center justify-center">
                  {trx.direction === "OUTGOING" ? (
                    <ArrowUpRight size={20} className="text-green-bright" />
                  ) : (
                    <ArrowDownLeft size={20} className="text-green-dim" />
                  )}
                </div>

                <div className="col-span-4 flex flex-col justify-center">
                  <div className="font-system text-[10px] text-green-dim uppercase">
                    FROM: <span className="text-green-base">{trx.origin}</span>
                  </div>
                  <div className="font-system text-[10px] text-green-dim uppercase mt-1">
                    TO:{" "}
                    <span className="text-green-base">{trx.destination}</span>
                  </div>
                </div>

                <div className="col-span-4 flex flex-col justify-center">
                  <div className="font-display text-xs text-green-hi uppercase mb-1">
                    {trx.item}
                  </div>
                  <div className="font-system text-[9px] text-green-dim uppercase">
                    QTY: {trx.qty} {trx.unit} // REF: {trx.id}
                  </div>
                </div>

                <div className="col-span-3 flex justify-start md:justify-end items-center mt-2 md:mt-0">
                  <div
                    className={`border px-3 py-1 font-display text-[10px] tracking-widest uppercase ${statusConfig}`}
                  >
                    [ {trx.status} ]
                  </div>
                </div>
              </motion.li>
            );
          })}
        </motion.ul>

        <footer className="mt-4 flex justify-between border-t border-green-mid pt-2 font-system text-[10px] sm:text-xs">
          <div className="flex gap-4 text-green-dim uppercase">
            <span>
              PENDING_REQUESTS: <span className="text-warn-text">1</span>
            </span>
            <span>
              ACTIVE_ROUTES: <span className="text-green-bright">3</span>
            </span>
          </div>
          <div className="text-green-dim uppercase">
            SYS_LOG // EMERGENCY_SHUTDOWN
          </div>
        </footer>
      </div>
    </div>
  );
}
