import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
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

const getStatusTone = (status: string) => {
  switch (status) {
    case "PENDING":
      return "amber";
    case "IN_TRANSIT":
      return "";
    case "DELIVERED":
      return "";
    case "APPROVED":
      return "";
    default:
      return "";
  }
};

export function TransfersPage() {
  const reduceMotion = useReducedMotion();
  const listVariants = reduceMotion ? {} : staggerContainer;
  const itemVariants = reduceMotion ? {} : staggerItem;
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTransfers = DUMMY_TRANSFERS.filter(
    (trx) =>
      trx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trx.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trx.origin.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const splitIndex = Math.ceil(filteredTransfers.length / 2);
  const leftList = filteredTransfers.slice(0, splitIndex);
  const rightList = filteredTransfers.slice(splitIndex);

  return (
    <>
      <div className="pip-frame">
        <span className="pip-frame-title">QUERY</span>
        <div className="pip-label" style={{ marginBottom: 4 }}>
          MANIFEST
        </div>
        <input
          type="text"
          placeholder="SEARCH TRANSFERS"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pip-input"
        />
        <div style={{ height: 6 }} />
        <button className="pip-button" type="button">
          INITIATE TRANSFER
        </button>
      </div>

      <div className="pip-frame">
        <span className="pip-frame-title">STATUS</span>
        <div className="pip-row">
          <span className="pip-label">THROUGHPUT</span>
          <span className="pip-value">14.2 TB</span>
        </div>
        <div style={{ height: 6 }} />
        <div className="pip-row">
          <span className="pip-label">QUEUE</span>
          <span className="pip-value amber">18 OPS</span>
        </div>
        <div style={{ height: 6 }} />
        <div className="pip-row">
          <span className="pip-label">NETWORK</span>
          <span className="pip-value">98.4%</span>
        </div>
      </div>

      <div className="pip-frame" style={{ minHeight: 0, overflow: "hidden" }}>
        <span className="pip-frame-title">TRANSFERS A</span>
        <motion.div
          style={{ display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}
          className="custom-scrollbar"
          variants={listVariants}
          initial="initial"
          animate="animate"
        >
          {leftList.map((trx) => (
            <motion.div key={trx.id} variants={itemVariants}>
              <div className="pip-row">
                <span className="pip-label">{trx.direction}</span>
                <span className={`pip-value ${getStatusTone(trx.status)}`} style={{ fontSize: 16 }}>
                  {trx.status}
                </span>
              </div>
              <div className="pip-value" style={{ fontSize: 18 }}>
                {trx.item}
              </div>
              <div className="pip-label">FROM {trx.origin}</div>
              <div className="pip-label">TO {trx.destination}</div>
              <div className="pip-label">QTY {trx.qty} {trx.unit} / REF {trx.id}</div>
            </motion.div>
          ))}
          {leftList.length === 0 && <div className="pip-label">NO MATCHES</div>}
        </motion.div>
      </div>

      <div className="pip-frame" style={{ minHeight: 0, overflow: "hidden" }}>
        <span className="pip-frame-title">TRANSFERS B</span>
        <motion.div
          style={{ display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}
          className="custom-scrollbar"
          variants={listVariants}
          initial="initial"
          animate="animate"
        >
          {rightList.map((trx) => (
            <motion.div key={trx.id} variants={itemVariants}>
              <div className="pip-row">
                <span className="pip-label">{trx.direction}</span>
                <span className={`pip-value ${getStatusTone(trx.status)}`} style={{ fontSize: 16 }}>
                  {trx.status}
                </span>
              </div>
              <div className="pip-value" style={{ fontSize: 18 }}>
                {trx.item}
              </div>
              <div className="pip-label">FROM {trx.origin}</div>
              <div className="pip-label">TO {trx.destination}</div>
              <div className="pip-label">QTY {trx.qty} {trx.unit} / REF {trx.id}</div>
            </motion.div>
          ))}
          {rightList.length === 0 && <div className="pip-label">NO MATCHES</div>}
        </motion.div>
      </div>
    </>
  );
}
