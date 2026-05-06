import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/shared/lib/motion';
import { useCampStore } from '@/features/camps/store/camp.store';
import { useCamp } from '@/features/camps/hooks/useCamp';
import { useCamps } from '@/features/camps/hooks/useCamps';
import { useInventory } from '@/features/inventory/hooks/useInventory';

export function InventoryPage() {
  const reduceMotion = useReducedMotion();
  const listVariants = reduceMotion ? {} : staggerContainer;
  const itemVariants = reduceMotion ? {} : staggerItem;
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedCampId, setSelectedCampId] = useState('');

  const activeCamp = useCampStore((state) => state.activeCamp);
  const setActiveCamp = useCampStore((state) => state.setActiveCamp);

  const campsQuery = useCamps();
  const campQuery = useCamp(selectedCampId);
  const inventoryQuery = useInventory(activeCamp?.id);

  useEffect(() => {
    if (!selectedCampId && campsQuery.data?.length) {
      const firstCampId = campsQuery.data[0]?.id;
      const initialId = activeCamp?.id ? String(activeCamp.id) : String(firstCampId);

      if (initialId) {
        setSelectedCampId(initialId);
      }
    }
  }, [activeCamp?.id, campsQuery.data, selectedCampId]);

  useEffect(() => {
    if (campQuery.data && String(campQuery.data.id) !== String(activeCamp?.id)) {
      setActiveCamp({
        id: String(campQuery.data.id),
        name: campQuery.data.name,
      });
    }
  }, [activeCamp?.id, campQuery.data, setActiveCamp]);

  const inventory = useMemo(() => {
    const data = inventoryQuery.data;
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray((data as any).data)) return (data as any).data;
    if (Array.isArray((data as any).items)) return (data as any).items;
    if (Array.isArray((data as any).inventory)) return (data as any).inventory;
    return [];
  }, [inventoryQuery.data]);

  const filteredInventory = useMemo(
    () =>
      inventory.filter((item) => {
        const searchTermLower = searchTerm.toLowerCase();
        const itemName = String(item.name ?? '').toLowerCase();
        const itemId = String(item.id ?? '').toLowerCase();

        const matchesSearch = itemName.includes(searchTermLower) || itemId.includes(searchTermLower);
        const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;

        return matchesSearch && matchesCategory;
      }),
    [inventory, searchTerm, categoryFilter],
  );

  const lowStockCount = useMemo(
    () => inventory.filter((item) => Number(item.quantity ?? 0) <= (item.minThreshold ?? 0)).length,
    [inventory],
  );

  const splitIndex = Math.ceil(filteredInventory.length / 2);
  const leftList = filteredInventory.slice(0, splitIndex);
  const rightList = filteredInventory.slice(splitIndex);

  const campList = campsQuery.data ?? [];
  const campError = campsQuery.error instanceof Error ? campsQuery.error.message : undefined;
  const selectedCampError = campQuery.error instanceof Error ? campQuery.error.message : undefined;

  return (
    <>
      <div className="pip-frame">
        <span className="pip-frame-title">CAMP SELECTOR</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            <div className="pip-label" style={{ marginBottom: 4 }}>
              SELECT CAMP
            </div>
            <select
              value={selectedCampId}
              onChange={(e) => setSelectedCampId(e.target.value)}
              className="pip-select"
            >
              <option value="" disabled>
                {campsQuery.isLoading ? 'LOADING CAMPS...' : 'SELECT A CAMP'}
              </option>
              {campList.map((camp) => (
                <option key={camp.id} value={String(camp.id)}>
                  {camp.name}
                </option>
              ))}
            </select>
          </div>
          {campsQuery.isError && (
            <div className="pip-label" style={{ color: '#ff6b6b' }}>
              CAMP LIST ERROR{campError ? `: ${campError}` : ''}
            </div>
          )}
          {campQuery.isLoading && selectedCampId && (
            <div className="pip-label">LOADING CAMP DETAILS...</div>
          )}
          {campQuery.isError && selectedCampId && (
            <div className="pip-label" style={{ color: '#ff6b6b' }}>
              CAMP DETAIL ERROR{selectedCampError ? `: ${selectedCampError}` : ''}
            </div>
          )}
        </div>
      </div>

      <div className="pip-frame">
        <span className="pip-frame-title">SUMMARY</span>
        <div className="pip-row">
          <span className="pip-label">ACTIVE CAMP</span>
          <span className="pip-value">{activeCamp?.name ?? 'NONE SELECTED'}</span>
        </div>
        <div style={{ height: 6 }} />
        <div className="pip-row">
          <span className="pip-label">TOTAL ITEMS</span>
          <span className="pip-value">{String(inventory.length).padStart(3, '0')}</span>
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
          {inventoryQuery.isLoading && <div className="pip-label">LOADING INVENTORY...</div>}
          {inventoryQuery.isError && (
            <div className="pip-label" style={{ color: '#ff6b6b' }}>
              ERROR LOADING INVENTORY
            </div>
          )}
          {!selectedCampId && <div className="pip-label">SELECT A CAMP TO LOAD INVENTORY.</div>}
          {!inventoryQuery.isLoading && !inventoryQuery.isError && selectedCampId && leftList.length === 0 && (
            <div className="pip-label">NO MATCHES</div>
          )}
          {leftList.map((item) => {
            const isLowStock = item.quantity <= (item.minThreshold ?? 0);
            return (
              <motion.div key={item.id} variants={itemVariants}>
                <div className="pip-row">
                  <span className="pip-label">{item.id}</span>
                  <span className={`pip-value ${isLowStock ? 'amber' : ''}`} style={{ fontSize: 16 }}>
                    {item.quantity} {item.unit}
                  </span>
                </div>
                <div className="pip-row">
                  <span className="pip-value" style={{ fontSize: 18 }}>
                    {item.name}
                  </span>
                  <span className="pip-label">{item.category ?? 'UNKNOWN'}</span>
                </div>
              </motion.div>
            );
          })}
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
          {inventoryQuery.isLoading && <div className="pip-label">LOADING INVENTORY...</div>}
          {inventoryQuery.isError && (
            <div className="pip-label" style={{ color: '#ff6b6b' }}>
              ERROR LOADING INVENTORY
            </div>
          )}
          {!selectedCampId && <div className="pip-label">SELECT A CAMP TO LOAD INVENTORY.</div>}
          {!inventoryQuery.isLoading && !inventoryQuery.isError && selectedCampId && rightList.length === 0 && (
            <div className="pip-label">NO MATCHES</div>
          )}
          {rightList.map((item) => {
            const isLowStock = item.quantity <= (item.minThreshold ?? 0);
            return (
              <motion.div key={item.id} variants={itemVariants}>
                <div className="pip-row">
                  <span className="pip-label">{item.id}</span>
                  <span className={`pip-value ${isLowStock ? 'amber' : ''}`} style={{ fontSize: 16 }}>
                    {item.quantity} {item.unit}
                  </span>
                </div>
                <div className="pip-row">
                  <span className="pip-value" style={{ fontSize: 18 }}>
                    {item.name}
                  </span>
                  <span className="pip-label">{item.category ?? 'UNKNOWN'}</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </>
  );
}
