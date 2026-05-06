import { useMemo } from 'react';
import { useCampStore } from '@/features/camps/store/camp.store';
import { useInventory } from '@/features/inventory/hooks/useInventory';
import { SegmentBar } from '../SegmentBar';

export function ResourcesPanel() {
  const activeCamp = useCampStore((state) => state.activeCamp);
  const inventoryQuery = useInventory(activeCamp?.id);

  const inventory = inventoryQuery.data ?? [];
  const maxQuantity = useMemo(() => {
    if (inventory.length === 0) return 1;
    return Math.max(...inventory.map((item) => Number(item.quantity ?? 0), 0), 1);
  }, [inventory]);

  return (
    <div className="pip-frame">
      <span className="pip-frame-title">RESOURCES</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {!activeCamp && <div className="pip-label">SELECT A CAMP TO LOAD RESOURCES.</div>}
        {activeCamp && inventoryQuery.isLoading && (
          <div className="pip-label">LOADING RESOURCES...</div>
        )}
        {activeCamp && inventoryQuery.isError && (
          <div className="pip-label red">ERROR LOADING RESOURCES</div>
        )}
        {activeCamp && !inventoryQuery.isLoading && !inventoryQuery.isError && inventory.length === 0 && (
          <div className="pip-label">NO RESOURCES FOUND</div>
        )}
        {activeCamp && inventory.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {inventory
              .slice()
              .sort((a, b) => Number(b.quantity ?? 0) - Number(a.quantity ?? 0))
              .slice(0, 6)
              .map((item) => {
                const quantity = Number(item.quantity ?? 0);
                const fill = maxQuantity ? Math.min(1, quantity / maxQuantity) : 0;
                const tone = quantity <= (item.minThreshold ?? 0) ? 'warn' : 'normal';
                return (
                  <div key={item.id}>
                    <div
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}
                    >
                      <span className="pip-label">{item.name}</span>
                      <span
                        className={`pip-value ${tone === 'warn' ? 'amber' : ''}`}
                        style={{ fontSize: 16 }}
                      >
                        {quantity} {item.unit}
                      </span>
                    </div>
                    <SegmentBar fill={fill} tone={tone === 'warn' ? 'amber' : undefined} segments={20} />
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
