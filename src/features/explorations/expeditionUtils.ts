import { Expedition, ExplorationMember, Person, ResourceAllocation } from '../../types';

export type ResourceRow = { resource_type_id: number; amount: number };
export type MemberOutcome = { person_id: number; status: Person['status'] };

export const EXPEDITION_MEMBER_STATUS_OPTIONS: Person['status'][] = [
  'HEALTHY',
  'SICK',
  'INJURED',
  'AWAY',
  'DEAD',
];

type ExpeditionRelations = Expedition & {
  expedition_members?: ExplorationMember[];
  expedition_allocated_resources?: ResourceAllocation[];
  expedition_returned_resources?: ResourceAllocation[];
  expedition_found_resources?: ResourceAllocation[];
  returned_resources?: ResourceAllocation[];
};

export function normalizeResourceRows(rows: ResourceRow[]) {
  return rows
    .map((row) => ({
      resource_type_id: Number(row.resource_type_id),
      amount: Number(row.amount),
    }))
    .filter((row) => row.resource_type_id > 0 && row.amount > 0);
}

export function hasDuplicateResourceRows(rows: ResourceRow[]) {
  const selectedIds = rows
    .map((row) => row.resource_type_id)
    .filter((resourceTypeId) => resourceTypeId > 0);
  return new Set(selectedIds).size !== selectedIds.length;
}

export function getExpeditionMembers(
  expedition: Expedition | null | undefined,
): ExplorationMember[] {
  const withRelations = expedition as ExpeditionRelations | null | undefined;
  return withRelations?.expedition_members ?? withRelations?.members ?? [];
}

export function getExpeditionMemberCount(expedition: Expedition) {
  return getExpeditionMembers(expedition).length;
}

export function getExpeditionAllocatedResources(
  expedition: Expedition | null | undefined,
): ResourceAllocation[] {
  const withRelations = expedition as ExpeditionRelations | null | undefined;
  return withRelations?.expedition_allocated_resources ?? withRelations?.allocated_resources ?? [];
}

export function getExpeditionReturnedResources(
  expedition: Expedition | null | undefined,
): ResourceAllocation[] {
  const withRelations = expedition as ExpeditionRelations | null | undefined;
  return withRelations?.expedition_returned_resources ?? withRelations?.returned_resources ?? [];
}

export function getExpeditionFoundResources(
  expedition: Expedition | null | undefined,
): ResourceAllocation[] {
  const withRelations = expedition as ExpeditionRelations | null | undefined;
  return withRelations?.expedition_found_resources ?? withRelations?.found_resources ?? [];
}

export function buildDefaultReturnedAllocatedRows(expedition: Expedition | null | undefined) {
  return getExpeditionAllocatedResources(expedition)
    .map((resource) => ({
      resource_type_id: Number(resource.resource_type_id),
      amount: Number(resource.amount),
    }))
    .filter((resource) => resource.resource_type_id > 0 && resource.amount > 0);
}

export function buildDefaultMemberOutcomes(
  expedition: Expedition | null | undefined,
  status: Person['status'],
): MemberOutcome[] {
  return getExpeditionMembers(expedition)
    .map((member) => Number(member.person_id))
    .filter((personId) => personId > 0)
    .map((personId) => ({ person_id: personId, status }));
}

export function getConsumedAllocatedResources(
  allocatedResources: ResourceAllocation[],
  returnedResources: ResourceAllocation[],
): ResourceRow[] {
  const returnedByResource = new Map<number, number>();

  returnedResources.forEach((resource) => {
    const resourceId = Number(resource.resource_type_id);
    if (!resourceId) return;
    returnedByResource.set(
      resourceId,
      (returnedByResource.get(resourceId) ?? 0) + Number(resource.amount ?? 0),
    );
  });

  return allocatedResources
    .map((resource) => {
      const resourceId = Number(resource.resource_type_id);
      const allocatedAmount = Number(resource.amount ?? 0);
      const returnedAmount = returnedByResource.get(resourceId) ?? 0;
      return {
        resource_type_id: resourceId,
        amount: Math.max(0, allocatedAmount - returnedAmount),
      };
    })
    .filter((resource) => resource.resource_type_id > 0 && resource.amount > 0);
}
