export const mockData = {
  operator: {
    name: "R. HAWTHORNE",
    id: "OP-7732-B",
    role: "SCOUT",
    camp: "ECHO-7",
  },
  time: {
    clock: "14:32",
    seconds: "08",
    date: "2287.04.26",
    daysSinceArrival: 142,
  },
  location: {
    coords: "38.7 N  92.1 W",
    sector: "SECTOR 14-D",
    shelterDistance: "1.2 km",
    heading: "NNE",
    threats: 2,
  },
  resources: [
    { label: "FOOD", value: 184, capacity: 240, fill: 0.77, tone: "ok" as const },
    { label: "WATER", value: 96, capacity: 200, fill: 0.48, tone: "ok" as const },
    { label: "MEDICINE", value: 14, capacity: 80, fill: 0.18, tone: "warn" as const },
    { label: "AMMO", value: 312, capacity: 500, fill: 0.62, tone: "ok" as const },
    { label: "FUEL", value: 41, capacity: 120, fill: 0.34, tone: "ok" as const },
  ],
};
