import { useState } from "react";
import { motion } from "framer-motion";
import { Search, User } from "lucide-react";
import { staggerContainer, staggerItem } from "@/shared/lib/motion";

const DUMMY_PEOPLE = [
  {
    id: "SRV-0942",
    name: "ELIAS VANCE",
    role: "RESOURCE_MANAGER",
    condition: "HEALTHY",
    location: "SECTOR_B4_HYDRO",
  },
  {
    id: "SRV-1209",
    name: "MARCUS REED",
    role: "TRAVEL_LEAD",
    condition: "INJURED",
    location: "MED_BAY_01",
  },
  {
    id: "SRV-8821",
    name: "SARAH CONNOR",
    role: "SYSTEM_ADMIN",
    condition: "HEALTHY",
    location: "PERIMETER_GATE_NORTH",
  },
  {
    id: "SRV-0034",
    name: "ELENA MARS",
    role: "WORKER",
    condition: "CRITICAL",
    location: "ICU_STATION_B",
  },
  {
    id: "SRV-5421",
    name: "OTTO KLINE",
    role: "WORKER",
    condition: "SICK",
    location: "QUARANTINE_ZONE_C",
  },
  {
    id: "SRV-7704",
    name: "JADE WREN",
    role: "WORKER",
    condition: "HEALTHY",
    location: "COMMS_HUB",
  },
];

export function PeopleListPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [conditionFilter, setConditionFilter] = useState("ALL");
  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "HEALTHY":
        return "text-green-bright bg-green-bright/10 border-green-bright";
      case "INJURED":
      case "SICK":
        return "text-warn-text bg-warn-text/10 border-warn-text";
      case "CRITICAL":
        return "text-danger-text bg-danger-text/10 border-danger-text";
      default:
        return "text-green-base bg-green-base/10 border-green-base";
    }
  };

  const filteredPeople = DUMMY_PEOPLE.filter((person) => {
    const matchesSearch =
      person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "ALL" || person.role === roleFilter;

    let matchesCondition = conditionFilter === "ALL";
    if (conditionFilter === "HEALTHY")
      matchesCondition = person.condition === "HEALTHY";
    if (conditionFilter === "WARNING")
      matchesCondition =
        person.condition === "INJURED" || person.condition === "SICK";
    if (conditionFilter === "CRITICAL")
      matchesCondition = person.condition === "CRITICAL";

    return matchesSearch && matchesRole && matchesCondition;
  });

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <div className="flex flex-1 flex-col border-2 border-green-mid bg-bg-panel p-4 pb-2 sm:p-6">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-dashed border-green-dim pb-4">
          <div>
            <h1 className="font-display text-lg sm:text-2xl text-green-hi tracking-widest uppercase mb-1">
              PERSONNEL_ROSTER //
              <br />
              DIVISION 7
            </h1>
            <p className="font-system text-xs text-green-dim uppercase">
              AUTHORIZED ACCESS ONLY // SYSTEM_VER: 4.2.0-ALFA
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
                placeholder="QUERY_SURVIVOR_DATABASE..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent border-b border-green-mid py-2 pl-8 pr-2 font-mono text-xs text-green-bright placeholder:text-green-dim focus:outline-none focus:border-green-bright transition-colors"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="flex-1 bg-bg-screen border border-green-mid text-green-base font-system text-[10px] p-1 focus:outline-none focus:border-green-bright uppercase uppercase cursor-pointer"
              >
                <option value="ALL">ALL_ROLES</option>
                <option value="WORKER">WORKER</option>
                <option value="RESOURCE_MANAGER">RESOURCE_MGR</option>
                <option value="TRAVEL_LEAD">TRAVEL_LEAD</option>
                <option value="SYSTEM_ADMIN">SYS_ADMIN</option>
              </select>
              <select
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value)}
                className="flex-1 bg-bg-screen border border-green-mid text-green-base font-system text-[10px] p-1 focus:outline-none focus:border-green-bright uppercase cursor-pointer"
              >
                <option value="ALL">ALL_CONDITIONS</option>
                <option value="HEALTHY">HEALTHY</option>
                <option value="WARNING">INJURED / SICK</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>
        </header>

        <motion.ul
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto custom-scrollbar md:grid-cols-2 lg:grid-cols-3 pr-2 min-h-0 items-start content-start"
        >
          {filteredPeople.map((person) => (
            <motion.li
              key={person.id}
              variants={staggerItem}
              className="group flex gap-3 border border-green-mid bg-bg-deep p-3 transition-all duration-200 hover:border-green-bright hover:-translate-y-1 hover:shadow-glow-subtle cursor-pointer hover:bg-green-mid/5"
            >
              <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center border border-dashed border-green-dim bg-bg-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-green-dim/5 group-hover:bg-green-bright/10 transition-colors" />
                <User
                  size={32}
                  className="text-green-dim group-hover:text-green-base transition-colors"
                />
              </div>

              <div className="flex flex-1 flex-col justify-between overflow-hidden">
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-system text-[10px] text-green-mid">
                      ID: {person.id}
                    </span>
                    <span
                      className={`font-display text-[8px] px-1 border uppercase ${getConditionColor(person.condition)}`}
                    >
                      {person.condition}
                    </span>
                  </div>

                  <h3 className="font-display text-xs text-green-hi truncate uppercase mb-1">
                    {person.name}
                  </h3>

                  <span className="inline-block bg-green-dim/20 px-1 font-mono text-[10px] text-green-bright uppercase">
                    {person.role}
                  </span>
                </div>

                <div className="mt-2 flex flex-col gap-[2px] font-system text-[11px] uppercase">
                  <div className="flex gap-2">
                    <span className="text-green-mid">CONDITION:</span>
                    <span
                      className={
                        getConditionColor(person.condition).split(" ")[0]
                      }
                    >
                      {person.condition}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-green-mid">LOCATION:</span>
                    <span className="text-green-base truncate">
                      {person.location}
                    </span>
                  </div>
                </div>
              </div>
            </motion.li>
          ))}
        </motion.ul>

        <footer className="mt-4 flex flex-col md:flex-row justify-between border-t border-green-mid pt-2 font-system text-[10px] sm:text-xs">
          <div className="flex gap-4 text-green-dim uppercase">
            <span>
              TOTAL_RECORDS: <span className="text-green-hi">042</span>
            </span>
            <span>
              ACTIVE_DUTY: <span className="text-green-bright">038</span>
            </span>
            <span>
              CASUALTIES: <span className="text-danger-text">004</span>
            </span>
          </div>
          <div className="border border-green-mid px-2 py-1 text-green-bright mt-2 md:mt-0 uppercase">
            AUTHENTICATED_SESSION // UID: AC-992-ELG
          </div>
        </footer>
      </div>
    </div>
  );
}
