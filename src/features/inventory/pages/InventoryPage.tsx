import { Panel } from '@/components/cyber/Panel';

export function InventoryPage() {
  return (
    <div className="space-y-6">
      <Panel title="INVENTORY_SNAPSHOT" tag="INV.01" status="AWAITING" accent="cyan">
        <p className="text-sm text-muted-foreground font-mono-data">Inventory snapshot coming soon.</p>
      </Panel>
    </div>
  );
}
