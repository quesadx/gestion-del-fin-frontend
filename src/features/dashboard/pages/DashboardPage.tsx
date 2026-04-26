import { IdentityPanel, TimePanel, LocationPanel, ResourcesPanel } from '@/shared/ui/pipboy';

export function DashboardPage() {
  return (
    <>
      <IdentityPanel />
      <TimePanel />
      <LocationPanel />
      <ResourcesPanel />
    </>
  );
}
