import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from "recharts";

const DUMMY_DATA = [
  { name: "WATER", amount: 80 },
  { name: "FOOD", amount: 45 },
  { name: "AMMO", amount: 30 },
  { name: "MEDS", amount: 65 },
];

export function DashboardPage() {
  return (
    <div className="h-full w-full flex flex-col gap-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-[400px]">
        <section className="col-span-1 lg:col-span-2 border-2 border-green-mid bg-bg-panel p-4 relative flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <h2 className="font-display text-sm sm:text-base text-green-hi tracking-widest uppercase">
              TACTICAL_OVERWATCH_V4
            </h2>
            <span className="font-system text-[10px] text-green-dim">
              REF_ID: AX-992-04
            </span>
          </div>

          <div className="flex-1 border border-dashed border-green-dim flex items-center justify-center relative overflow-hidden">
            <div className="absolute h-64 w-64 rounded-full border border-green-dim/30"></div>
            <div className="absolute h-48 w-48 rounded-full border border-green-dim/50"></div>
            <div className="absolute h-32 w-32 rounded-full border border-green-mid/50"></div>
            <span className="font-display text-4xl text-green-dim/20 tracking-[0.3em]">
              ELORG
            </span>
          </div>

          <div className="mt-4 font-mono text-xs text-green-base">
            <p>LAT: 55.7558 N</p>
            <p>LNG: 37.6173 E</p>
          </div>
        </section>

        <section className="col-span-1 flex flex-col gap-4">
          <div className="flex-1 border-2 border-green-mid bg-bg-panel p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-display text-xs text-green-bright">
                BASE CONDITION
              </h3>
              <span className="font-system text-[10px] bg-green-dim text-black px-1">
                85%
              </span>
            </div>
            <div className="h-16 flex gap-1 mt-4">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 ${i < 8 ? "bg-green-hi shadow-glow-subtle" : "bg-green-dim opacity-30"}`}
                ></div>
              ))}
            </div>
            <p className="font-system text-[9px] text-warn-text mt-2 uppercase">
              WARNING: THERMAL LIMITS NEARING THRESHOLD
            </p>
          </div>

          <div className="flex-[2] border-2 border-green-mid bg-bg-panel p-4 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-display text-xs text-green-bright">
                ASSET_STRENGTH
              </h3>
              <span className="font-system text-[10px] text-green-hi">
                STABLE
              </span>
            </div>
            <div className="flex-1 relative mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={DUMMY_DATA}
                  margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                >
                  <Tooltip
                    cursor={{ fill: "var(--clr-green-mid)", opacity: 0.2 }}
                    contentStyle={{
                      backgroundColor: "var(--clr-bg-panel)",
                      border: "1px solid var(--clr-green-mid)",
                      color: "var(--clr-green-bright)",
                      fontFamily: '"Share Tech Mono", monospace',
                      borderRadius: "0",
                      fontSize: "12px",
                      textTransform: "uppercase",
                    }}
                    itemStyle={{ color: "var(--clr-green-hi)" }}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="var(--clr-green-dim)"
                    tick={{
                      fill: "var(--clr-green-base)",
                      fontSize: 10,
                      fontFamily: '"Share Tech Mono", monospace',
                    }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Bar
                    dataKey="amount"
                    fill="var(--clr-green-hi)"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-48">
        <section className="col-span-2 border-2 border-green-mid bg-bg-panel p-4 overflow-y-auto custom-scrollbar">
          <h3 className="font-display text-xs text-green-bright mb-3">
            COMMUNICATION_LOG
          </h3>
          <ul className="font-system text-xs gap-1 flex flex-col">
            <li className="text-green-base">[12:04] HQ: PROCEED TO GRID_B4</li>
            <li className="text-danger-text">
              [12:08] SYS: UNAUTHORIZED_ACCESS_DETECTED
            </li>
            <li className="text-green-base">
              [12:10] HQ: CONFIRM_IDENT_ALPHA_7
            </li>
          </ul>
        </section>

        <section className="border-2 border-green-mid bg-bg-panel p-4 font-system text-xs text-green-hi flex flex-col justify-end">
          <p className="text-green-dim mb-1">::: SYSTEM_DUMP :::</p>
          <p>BOOT_SEQUENCE... [OK]</p>
          <p>LOCAL_LINK... [127.0.0.1]</p>
          <p>UPLINK_SAT... [CONNECTED]</p>
          <p className="mt-4 animate-pulse">{`> WAITING FOR COMMAND_`}</p>
        </section>
      </div>
    </div>
  );
}
