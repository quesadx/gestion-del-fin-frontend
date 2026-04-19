import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Box, AlertTriangle, CheckCircle2 } from "lucide-react";
import { staggerContainer, staggerItem } from "@/shared/lib/motion";

const DUMMY_INVENTORY = [
  {
    id: "RES-01A",
    name: "MRE RATIONS",
    category: "FOOD",
    quantity: 140,
    unit: "UNITS",
    minThreshold: 50,
  },
  {
    id: "RES-02B",
    name: "PURIFIED WATER",
    category: "WATER",
    quantity: 35,
    unit: "L",
    minThreshold: 50,
  },
  {
    id: "RES-05X",
    name: "9MM AMMUNITION",
    category: "AMMO",
    quantity: 850,
    unit: "ROUNDS",
    minThreshold: 200,
  },
  {
    id: "RES-11F",
    name: "ANTIBIOTICS",
    category: "MEDICAL",
    quantity: 12,
    unit: "DOSES",
    minThreshold: 20,
  },
  {
    id: "RES-44C",
    name: "DIESEL FUEL",
    category: "FUEL",
    quantity: 300,
    unit: "L",
    minThreshold: 100,
  },
  {
    id: "RES-66P",
    name: "HAZMAT SUITS",
    category: "EQUIPMENT",
    quantity: 5,
    unit: "UNITS",
    minThreshold: 10,
  },
  {
    id: "RES-99K",
    name: "RADIOS",
    category: "EQUIPMENT",
    quantity: 15,
    unit: "UNITS",
    minThreshold: 5,
  },
];

export function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const filteredInventory = DUMMY_INVENTORY.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "ALL" || item.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <div className="flex flex-1 flex-col border-2 border-green-mid bg-bg-panel p-4 pb-2 sm:p-6">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-dashed border-green-dim pb-4">
          <div>
            <h1 className="font-display text-lg sm:text-2xl text-green-hi tracking-widest uppercase mb-1">
              CAMP_INVENTORY_LOG //
              <br />
              SUPPLY_CHAIN
            </h1>
            <p className="font-system text-xs text-green-dim uppercase">
              SECTOR 7G // LAST LOG: 10 MINS AGO
            </p>
          </div>

          <div className="flex flex-col gap-2 w-full sm:w-auto shrink-0">
            <div className="relative w-full sm:w-80">
              <Search
                size={16}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-green-mid"
              />
              <input
                type="text"
                placeholder="QUERY_INVENTORY_DB..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent border-b border-green-mid py-2 pl-8 pr-2 font-mono text-xs text-green-bright placeholder:text-green-dim focus:outline-none focus:border-green-bright transition-colors uppercase"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="flex-1 bg-bg-screen border border-green-mid text-green-base font-system text-[10px] p-1 focus:outline-none focus:border-green-bright uppercase cursor-pointer"
              >
                <option value="ALL">ALL_CATEGORIES</option>
                <option value="WATER">WATER</option>
                <option value="FOOD">FOOD</option>
                <option value="AMMO">AMMUNITION</option>
                <option value="MEDICAL">MEDICAL</option>
                <option value="EQUIPMENT">EQUIPMENT</option>
                <option value="FUEL">FUEL</option>
              </select>
            </div>
          </div>
        </header>

        <div className="hidden border-b-2 border-green-mid pb-2 px-4 md:grid grid-cols-12 gap-4 font-display text-[9px] text-green-dim uppercase tracking-widest mb-2 shrink-0">
          <div className="col-span-2">REF_ID</div>
          <div className="col-span-4">ITEM_DESIGNATION</div>
          <div className="col-span-2">CLASS</div>
          <div className="col-span-2 text-right">STOCK_LEVEL</div>
          <div className="col-span-2 text-right">STATUS</div>
        </div>

        <motion.ul
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="flex flex-col flex-1 gap-2 overflow-y-auto custom-scrollbar pr-2 min-h-0"
        >
          {filteredInventory.map((item, index) => {
            const isLowStock = item.quantity <= item.minThreshold;

            return (
              <motion.li
                key={item.id}
                variants={staggerItem}
                className={`group flex flex-col md:grid md:grid-cols-12 md:items-center gap-2 md:gap-4 p-3 sm:px-4 border transition-colors ${
                  isLowStock
                    ? "bg-danger-text/5 border-warn-text/50 hover:border-warn-text"
                    : index % 2 === 0
                      ? "bg-bg-deep border-transparent hover:border-green-mid"
                      : "bg-bg-screen border-transparent hover:border-green-mid"
                }`}
              >
                <div className="col-span-2 font-mono text-xs text-green-mid flex items-center md:items-start gap-2">
                  <Box
                    size={14}
                    className={isLowStock ? "text-warn-text" : "text-green-dim"}
                  />
                  {item.id}
                </div>

                <div className="col-span-4 font-display text-[10px] sm:text-xs text-green-hi uppercase truncate">
                  {item.name}
                  {isLowStock && (
                    <span className="md:hidden ml-2 text-[8px] text-warn-text">
                      [ LOW ]
                    </span>
                  )}
                </div>

                <div className="col-span-2 font-system text-xs text-green-base uppercase mt-1 md:mt-0">
                  [ {item.category} ]
                </div>

                <div
                  className={`col-span-2 font-mono text-sm uppercase text-left md:text-right ${isLowStock ? "text-warn-text font-bold" : "text-green-bright"}`}
                >
                  {item.quantity}{" "}
                  <span className="text-[10px] text-green-dim">
                    {item.unit}
                  </span>
                </div>

                <div className="col-span-2 flex justify-start md:justify-end items-center mt-2 md:mt-0">
                  {isLowStock ? (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-danger-text/10 border border-warn-text text-warn-text font-system text-[10px] uppercase animate-pulse">
                      <AlertTriangle size={12} />
                      <span>LOW_STOCK</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 text-green-bright font-system text-[10px] uppercase opacity-80">
                      <CheckCircle2 size={12} />
                      <span>NOMINAL</span>
                    </div>
                  )}
                </div>
              </motion.li>
            );
          })}
        </motion.ul>

        <footer className="mt-4 flex justify-between border-t border-green-mid pt-2 font-system text-[10px] sm:text-xs">
          <div className="flex gap-4 text-green-dim uppercase">
            <span>
              TOTAL_ITEMS:{" "}
              <span className="text-green-hi">{DUMMY_INVENTORY.length}</span>
            </span>
            <span>
              CRITICAL_WARNINGS:{" "}
              <span className="text-warn-text">
                {
                  DUMMY_INVENTORY.filter((i) => i.quantity <= i.minThreshold)
                    .length
                }
              </span>
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
