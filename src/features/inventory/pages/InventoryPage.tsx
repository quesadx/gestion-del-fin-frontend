import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/shared/lib/motion';

const DUMMY_INVENTORY = [
  {
    id: 'RES-01A',
    name: 'MRE RATIONS',
    category: 'FOOD',
    quantity: 140,
    unit: 'UNITS',
    minThreshold: 50,
  },
  {
    id: 'RES-02B',
    name: 'PURIFIED WATER',
    category: 'WATER',
    quantity: 35,
    unit: 'L',
    minThreshold: 50,
  },
  {
    id: 'RES-05X',
    name: '9MM AMMUNITION',
    category: 'AMMO',
    quantity: 850,
    unit: 'ROUNDS',
    minThreshold: 200,
  },
  {
    id: 'RES-11F',
    name: 'ANTIBIOTICS',
    category: 'MEDICAL',
    quantity: 12,
    unit: 'DOSES',
    minThreshold: 20,
  },
  {
    id: 'RES-44C',
    name: 'DIESEL FUEL',
    category: 'FUEL',
    quantity: 300,
    unit: 'L',
    minThreshold: 100,
  },
  {
    id: 'RES-66P',
    name: 'HAZMAT SUITS',
    category: 'EQUIPMENT',
    quantity: 5,
    unit: 'UNITS',
    minThreshold: 10,
  },
  {
    id: 'RES-99K',
    name: 'RADIOS',
    category: 'EQUIPMENT',
    quantity: 15,
    unit: 'UNITS',
    minThreshold: 5,
  },
];

export function InventoryPage() {
  const reduceMotion = useReducedMotion();
  const listVariants = reduceMotion ? {} : staggerContainer;
  const itemVariants = reduceMotion ? {} : staggerItem;
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const filteredInventory = DUMMY_INVENTORY.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const lowStockCount = DUMMY_INVENTORY.filter((item) => item.quantity <= item.minThreshold).length;

  const splitIndex = Math.ceil(filteredInventory.length / 2);
  const leftList = filteredInventory.slice(0, splitIndex);
  const rightList = filteredInventory.slice(splitIndex);

  return (
    <>
      <div className="pip-frame">
        <span className="pip-frame-title">FILTERS</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <div className="pip-label" style={{ marginBottom: 4 }}>
              QUERY
            </div>
            <input
              type="text"
              placeholder="SEARCH INVENTORY"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pip-input"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="pip-select"
          >
            <option value="ALL">ALL CATEGORIES</option>
            <option value="WATER">WATER</option>
            <option value="FOOD">FOOD</option>
            <option value="AMMO">AMMUNITION</option>
            <option value="MEDICAL">MEDICAL</option>
            <option value="EQUIPMENT">EQUIPMENT</option>
            <option value="FUEL">FUEL</option>
          </select>
        </div>
      </div>

      <div className="pip-frame">
        <span className="pip-frame-title">SUMMARY</span>
        <div className="pip-row">
          <span className="pip-label">TOTAL ITEMS</span>
          <span className="pip-value">{String(DUMMY_INVENTORY.length).padStart(3, '0')}</span>
        </div>
        <div style={{ height: 6 }} />
        <div className="pip-row">
          <span className="pip-label">LOW STOCK</span>
          <span className="pip-value amber">{String(lowStockCount).padStart(3, '0')}</span>
        </div>
        <div style={{ height: 6 }} />
        <div className="pip-row">
          <span className="pip-label">FILTERED</span>
          <span className="pip-value">{String(filteredInventory.length).padStart(3, '0')}</span>
        </div>
      </div>

      <div className="pip-frame" style={{ minHeight: 0, overflow: 'hidden' }}>
        <span className="pip-frame-title">STOCK A</span>
        <motion.div
          style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}
          className="custom-scrollbar"
          variants={listVariants}
          initial="initial"
          animate="animate"
        >
          {leftList.map((item) => {
            const isLowStock = item.quantity <= item.minThreshold;
            return (
              <motion.div key={item.id} variants={itemVariants}>
                <div className="pip-row">
                  <span className="pip-label">{item.id}</span>
                  <span
                    className={`pip-value ${isLowStock ? 'amber' : ''}`}
                    style={{ fontSize: 16 }}
                  >
                    {item.quantity} {item.unit}
                  </span>
                </div>
                <div className="pip-row">
                  <span className="pip-value" style={{ fontSize: 18 }}>
                    {item.name}
                  </span>
                  <span className="pip-label">{item.category}</span>
                </div>
              </motion.div>
            );
          })}
          {leftList.length === 0 && <div className="pip-label">NO MATCHES</div>}
        </motion.div>
      </div>

      <div className="pip-frame" style={{ minHeight: 0, overflow: 'hidden' }}>
        <span className="pip-frame-title">STOCK B</span>
        <motion.div
          style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}
          className="custom-scrollbar"
          variants={listVariants}
          initial="initial"
          animate="animate"
        >
          {rightList.map((item) => {
            const isLowStock = item.quantity <= item.minThreshold;
            return (
              <motion.div key={item.id} variants={itemVariants}>
                <div className="pip-row">
                  <span className="pip-label">{item.id}</span>
                  <span
                    className={`pip-value ${isLowStock ? 'amber' : ''}`}
                    style={{ fontSize: 16 }}
                  >
                    {item.quantity} {item.unit}
                  </span>
                </div>
                <div className="pip-row">
                  <span className="pip-value" style={{ fontSize: 18 }}>
                    {item.name}
                  </span>
                  <span className="pip-label">{item.category}</span>
                </div>
              </motion.div>
            );
          })}
          {rightList.length === 0 && <div className="pip-label">NO MATCHES</div>}
        </motion.div>
      </div>
    </>
  );
}
