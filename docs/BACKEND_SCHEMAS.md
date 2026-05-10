# Backend Zod Schemas (Gestion Del Fin API)

Source: /home/quesadx/github/gestion-del-fin-api
Generated: 2026-05-08

## src/shared/schemas/http.schema.ts

```ts
import { z } from 'zod';

export const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});
```

## src/modules/auth/auth.schema.ts

```ts
import { z } from 'zod';

export const LoginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .max(60, 'Username must be at most 60 characters'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof LoginSchema>;
```

## src/modules/camps/camps.schema.ts

```ts
import { z } from 'zod';

export const campStatusEnum = z.enum(['ACTIVE', 'ABANDONED']);

export const createCampSchema = z.object({
  name: z
    .string({ message: 'name is required' })
    .min(1, 'name cannot be empty')
    .max(100, 'name cannot exceed 100 characters'),
  location: z.string().max(100, 'location cannot exceed 100 characters').optional(),
  status: campStatusEnum.optional(),
  ai_context_prompt: z.string().optional(),
});

export const updateCampSchema = createCampSchema.partial();

export type CreateCampDto = z.infer<typeof createCampSchema>;
export type UpdateCampDto = z.infer<typeof updateCampSchema>;
```

## src/modules/admission/admission.schema.ts

```ts
import { z } from 'zod';

export const finalDecisionEnum = z.enum(['ACCEPTED', 'REJECTED']);
export const aiDecisionEnum = z.enum(['ACCEPTED', 'REJECTED']);

export const admissionAIResultSchema = z.object({
  ai_decision: aiDecisionEnum,
  ai_reasoning: z.string().describe('Detailed explanation step by step about the decision'),
  ai_suggested_profession: z.string().max(80).describe('Suggested profession within the camp'),
});

export type AdmissionAIResult = z.infer<typeof admissionAIResultSchema>;

export const createAdmissionSchema = z.object({
  applicant_name: z.string().min(1).max(150),
  applicant_age: z.number().int().min(0).max(255).optional(),
  applicant_skills: z.string().optional(),
  health_notes: z.string().optional(),
  background_notes: z.string().optional(),
  photo_url: z.url().max(255).optional(),
  id_card_url: z.url().max(500).optional(),
});

export type CreateAdmissionDTO = z.infer<typeof createAdmissionSchema>;

export const reviewAdmissionSchema = z.object({
  final_decision: finalDecisionEnum,
});

export type ReviewAdmissionDTO = z.infer<typeof reviewAdmissionSchema>;
```

## src/modules/explorations/explorations.schema.ts

```ts
import { z } from 'zod';

export const expeditionStatusEnum = z.enum(['PLANNED', 'ONGOING', 'RETURNED', 'CANCELLED']);
const personStatusEnum = z.enum(['SICK', 'HEALTHY', 'INJURED', 'AWAY', 'DEAD']);

const dateStringSchema = z.iso.date({ message: 'must be a valid ISO date (YYYY-MM-DD)' });

const resourceAllocationSchema = z.object({
  resource_type_id: z.number().int().positive(),
  amount: z.number().positive(),
});

const explorationMemberSchema = z.object({
  person_id: z.number().int().positive(),
});

const explorationBaseSchema = z.object({
  camp_id: z.number({ message: 'camp_id is required' }).int().positive(),
  created_by: z.number({ message: 'created_by is required' }).int().positive(),
  destination: z
    .string({ message: 'destination is required' })
    .min(1, 'destination cannot be empty')
    .max(255, 'destination cannot exceed 255 characters'),
  departure_date: dateStringSchema,
  expected_return_date: dateStringSchema,
  max_return_date: dateStringSchema,
  actual_return_date: dateStringSchema.optional(),
  status: expeditionStatusEnum.optional(),
  notes: z.string().optional(),
  members: z.array(explorationMemberSchema).default([]),

  allocated_resources: z.array(resourceAllocationSchema).default([]),
});

export const createExplorationSchema = explorationBaseSchema.superRefine((data, ctx) => {
  const departure = new Date(data.departure_date).getTime();
  const expected = new Date(data.expected_return_date).getTime();
  const max = new Date(data.max_return_date).getTime();

  if (departure > expected || expected > max) {
    ctx.addIssue({
      code: 'custom',
      path: ['expected_return_date'],
      message: 'departure_date <= expected_return_date <= max_return_date is required',
    });
  }

  const seenResourceTypes = new Set<number>();
  data.allocated_resources.forEach((resource, index) => {
    if (seenResourceTypes.has(resource.resource_type_id)) {
      ctx.addIssue({
        code: 'custom',
        path: ['allocated_resources', index, 'resource_type_id'],
        message: 'duplicate resource_type_id values are not allowed',
      });
    }
    seenResourceTypes.add(resource.resource_type_id);
  });
});

export const updateExplorationSchema = explorationBaseSchema
  .omit({ status: true })
  .partial()
  .strict();

export const updateExplorationStatusSchema = z
  .object({
    status: expeditionStatusEnum,
    actual_return_date: dateStringSchema.optional(),
    notes: z.string().optional(),
    changed_by: z.number().int().positive(),
    resources_to_return: z.array(resourceAllocationSchema).optional(),
    members: z.array(explorationMemberSchema).optional(),
    return_member_status: personStatusEnum.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === 'RETURNED' && !data.actual_return_date) {
      ctx.addIssue({
        code: 'custom',
        path: ['actual_return_date'],
        message: 'actual_return_date is required when status is RETURNED',
      });
    }
  });

export const deleteExplorationSchema = z.object({
  changed_by: z.number({ message: 'changed_by is required' }).int().positive(),
  return_member_status: personStatusEnum.optional(),
});

export type CreateExplorationDto = z.infer<typeof createExplorationSchema>;
export type UpdateExplorationDto = z.infer<typeof updateExplorationSchema>;
export type UpdateExplorationStatusDto = z.infer<typeof updateExplorationStatusSchema>;
export type DeleteExplorationDto = z.infer<typeof deleteExplorationSchema>;
```

## src/modules/inventory/inventory.schema.ts

```ts
import { z } from 'zod';

export const inventoryByCampParamsSchema = z.object({
  campId: z.coerce.number().int().positive(),
});

export const manualAdjustmentTypeSchema = z.enum(['MANUAL_IN', 'MANUAL_OUT']);

export const manualAdjustmentSchema = z.object({
  camp_id: z.number({ message: 'camp_id is required' }).int().positive(),
  resource_type_id: z.number({ message: 'resource_type_id is required' }).int().positive(),
  type: manualAdjustmentTypeSchema,
  quantity: z
    .number({ message: 'quantity is required' })
    .positive('quantity must be greater than zero')
    .max(9999999999.99, 'quantity exceeds DECIMAL(12,2) range'),
  description: z.string().max(255).optional(),
});

export type ManualAdjustmentDto = z.infer<typeof manualAdjustmentSchema>;
```

## src/modules/people/people.schema.ts

```ts
import { z } from 'zod';

export const campIdParamsSchema = z.object({
  campId: z.coerce.number().int().positive(),
});

export const campIdAndPersonIdParamsSchema = z.object({
  campId: z.coerce.number().int().positive(),
  id: z.coerce.number().int().positive(),
});

export const personStatusEnum = z.enum(['SICK', 'HEALTHY', 'INJURED', 'AWAY', 'DEAD']);

export const createPersonSchema = z.object({
  full_name: z
    .string({ message: 'full_name is required' })
    .min(1, 'full_name cannot be empty')
    .max(150, 'full_name cannot exceed 150 characters'),
  camp_id: z.number({ message: 'camp_id is required' }).int().positive(),
  profession_id: z.number({ message: 'profession_id is required' }).int().positive(),
  admitted_at: z.iso.datetime({ message: 'admitted_at must be a valid ISO datetime' }),
  status: personStatusEnum.optional(),
  age: z.number().int().min(0).max(255).optional(),
  identification_code: z.string().max(20).optional(),
  blood_type: z.string().max(5).optional(),
  skills_summary: z.string().optional(),
  photo_url: z.url().max(500).optional(),
});

export const updatePersonSchema = createPersonSchema.partial();

export const createPersonStatusLogSchema = z.object({
  person_id: z.number({ message: 'person_id is required' }).int().positive(),
  new_status: personStatusEnum,
  reason: z.string().optional(),
});

export const createProfessionReassignmentSchema = z
  .object({
    person_id: z.number({ message: 'person_id is required' }).int().positive(),
    from_profession_id: z.number({ message: 'from_profession_id is required' }).int().positive(),
    to_profession_id: z.number({ message: 'to_profession_id is required' }).int().positive(),
    reason: z.string().optional(),
    start_date: z.iso

      .date({ message: 'start_date must be a valid ISO date (YYYY-MM-DD)' })
      .optional(),
    end_date: z.iso.date({ message: 'end_date must be a valid ISO date (YYYY-MM-DD)' }).optional(),
  })
  .refine((data) => data.from_profession_id !== data.to_profession_id, {
    message: 'from_profession_id and to_profession_id must be different',
    path: ['to_profession_id'],
  })
  .refine(
    (data) => {
      if (!data.start_date || !data.end_date) return true;
      return new Date(data.end_date) >= new Date(data.start_date);
    },
    {
      message: 'end_date cannot be earlier than start_date',
      path: ['end_date'],
    },
  );

export const createContributionOverrideSchema = z
  .object({
    person_id: z.number({ message: 'person_id is required' }).int().positive(),
    resource_type_id: z.number({ message: 'resource_type_id is required' }).int().positive(),
    reason: z
      .string({ message: 'reason is required' })
      .trim()
      .min(1, 'reason cannot be empty')
      .max(255, 'reason cannot exceed 255 characters'),
    amount: z
      .number({ message: 'amount is required' })
      .max(999999.99, 'amount exceeds DECIMAL(8,2) range')

      .min(-999999.99, 'amount exceeds DECIMAL(8,2) range'),
    start_date: z.iso
      .date({ message: 'start_date must be a valid ISO date (YYYY-MM-DD)' })
      .optional(),
    end_date: z.iso.date({ message: 'end_date must be a valid ISO date (YYYY-MM-DD)' }).optional(),
  })
  .refine(
    (data) => {
      if (!data.start_date || !data.end_date) return true;
      return new Date(data.end_date) >= new Date(data.start_date);
    },
    {
      message: 'end_date cannot be earlier than start_date',
      path: ['end_date'],
    },
  );

export type CreatePersonDto = z.infer<typeof createPersonSchema>;
export type UpdatePersonDto = z.infer<typeof updatePersonSchema>;
export type CreatePersonStatusLogDto = z.infer<typeof createPersonStatusLogSchema>;
export type CreateProfessionReassignmentDto = z.infer<typeof createProfessionReassignmentSchema>;
export type CreateContributionOverrideDto = z.infer<typeof createContributionOverrideSchema>;
```

## src/modules/professions/professions.schema.ts

```ts
import { z } from 'zod';

export const createProfessionSchema = z.object({
  name: z
    .string('name is required')
    .min(1, 'name cannot be empty')
    .max(80, 'name cannot exceed 80 characters'),
  description: z.string().optional(),
});

export const updateProfessionSchema = createProfessionSchema.partial();

export type CreateProfessionDto = z.infer<typeof createProfessionSchema>;
export type UpdateProfessionDto = z.infer<typeof updateProfessionSchema>;
```

## src/modules/resources/resources.schema.ts

```ts
import { z } from 'zod';

export const createResourceSchema = z.object({
  name: z
    .string({ message: 'name is required' })
    .min(1, 'name cannot be empty')
    .max(80, 'name cannot exceed 80 characters'),
  unit: z
    .string({ message: 'unit is required' })
    .min(1, 'unit cannot be empty')
    .max(20, 'unit cannot exceed 20 characters'),
  daily_ration: z
    .number({ message: 'daily_ration is required' })
    .nonnegative('daily_ration must be zero or greater')
    .max(999999.99, 'daily_ration exceeds DECIMAL(8,2) range'),
  minimum_stock: z
    .number({ message: 'minimum_stock is required' })
    .nonnegative('minimum_stock must be zero or greater')
    .max(99999999.99, 'minimum_stock exceeds DECIMAL(10,2) range'),
  auto_daily: z.boolean().optional(),
});

export const updateResourceSchema = createResourceSchema.partial();

export type CreateResourceDto = z.infer<typeof createResourceSchema>;
export type UpdateResourceDto = z.infer<typeof updateResourceSchema>;
```

## src/modules/transfers/transfers.schema.ts

```ts
import { z } from 'zod';

export const transferStatusEnum = z.enum([
  'PENDING',
  'APPROVED_SOURCE',
  'APPROVED_TARGET',
  'COMPLETED',
  'REJECTED',
]);

export const transferTypeEnum = z.enum(['RESOURCE', 'PERSON', 'MIXED']);
export const transferItemTypeEnum = z.enum(['RESOURCE', 'PERSON']);
export const personStatusEnum = z.enum(['SICK', 'HEALTHY', 'INJURED', 'AWAY', 'DEAD']);

const dateTimeSchema = z.iso.datetime({ message: 'must be a valid ISO datetime' });

export const transferItemSchema = z
  .object({
    item_type: transferItemTypeEnum,
    resource_type_id: z.number().int().positive().optional(),
    person_id: z.number().int().positive().optional(),
    quantity: z.number().positive().optional(),
  })
  .superRefine((item, ctx) => {
    if (item.item_type === 'RESOURCE') {
      if (item.resource_type_id == null) {
        ctx.addIssue({
          code: 'custom',
          path: ['resource_type_id'],
          message: 'resource_type_id is required for RESOURCE items',
        });
      }

      if (item.quantity == null) {
        ctx.addIssue({
          code: 'custom',
          path: ['quantity'],
          message: 'quantity is required for RESOURCE items',
        });
      }

      if (item.person_id != null) {
        ctx.addIssue({
          code: 'custom',
          path: ['person_id'],
          message: 'person_id must not be provided for RESOURCE items',
        });
      }
    }

    if (item.item_type === 'PERSON') {
      if (item.person_id == null) {
        ctx.addIssue({
          code: 'custom',
          path: ['person_id'],
          message: 'person_id is required for PERSON items',
        });
      }

      if (item.resource_type_id != null) {
        ctx.addIssue({
          code: 'custom',
          path: ['resource_type_id'],
          message: 'resource_type_id must not be provided for PERSON items',
        });
      }

      if (item.quantity != null) {
        ctx.addIssue({
          code: 'custom',
          path: ['quantity'],
          message: 'quantity must not be provided for PERSON items',
        });
      }
    }
  });

export const createTransferSchema = z
  .object({
    requesting_camp: z.number().int().positive(),
    target_camp: z.number().int().positive(),
    type: transferTypeEnum,
    notes: z.string().optional(),
    requested_by: z.number().int().positive(),
    leader_person_id: z.number().int().positive().optional(),
    scheduled_delivery_date: dateTimeSchema.optional(),
    items: z.array(transferItemSchema).min(1),
  })
  .superRefine((data, ctx) => {
    if (data.requesting_camp === data.target_camp) {
      ctx.addIssue({
        code: 'custom',
        path: ['target_camp'],
        message: 'target_camp must be different from requesting_camp',
      });
    }

    const resourceItems = data.items.filter((item) => item.item_type === 'RESOURCE');
    const personItems = data.items.filter((item) => item.item_type === 'PERSON');

    if (data.type === 'RESOURCE' && personItems.length > 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['items'],
        message: 'RESOURCE transfer cannot include PERSON items',
      });
    }

    if (data.type === 'PERSON' && resourceItems.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['items'],
        message: 'PERSON transfer requires RESOURCE items for travel rations',
      });
    }

    if (data.type === 'PERSON' && personItems.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['items'],
        message: 'PERSON transfer must include at least one PERSON item',
      });
    }

    if (data.type === 'MIXED' && (resourceItems.length === 0 || personItems.length === 0)) {
      ctx.addIssue({
        code: 'custom',
        path: ['items'],
        message: 'MIXED transfer must include both RESOURCE and PERSON items',
      });
    }

    const seenResourceTypeIds = new Set<number>();
    const seenPersonIds = new Set<number>();

    data.items.forEach((item, index) => {
      if (item.item_type === 'RESOURCE' && item.resource_type_id) {
        if (seenResourceTypeIds.has(item.resource_type_id)) {
          ctx.addIssue({
            code: 'custom',
            path: ['items', index, 'resource_type_id'],
            message: 'duplicate resource_type_id values are not allowed',
          });
        }
        seenResourceTypeIds.add(item.resource_type_id);
      }

      if (item.item_type === 'PERSON' && item.person_id) {
        if (seenPersonIds.has(item.person_id)) {
          ctx.addIssue({
            code: 'custom',
            path: ['items', index, 'person_id'],
            message: 'duplicate person_id values are not allowed',
          });
        }
        seenPersonIds.add(item.person_id);
      }
    });
  });

export const scheduleTransferDeliverySchema = z.object({
  scheduled_delivery_date: dateTimeSchema,
});

export const approveTransferSourceSchema = z.object({
  notes: z.string().optional(),
  scheduled_delivery_date: dateTimeSchema.optional(),
});

export const approveTransferTargetSchema = z.object({
  notes: z.string().optional(),
});

export const completeTransferSchema = z.object({
  notes: z.string().optional(),
  person_status: personStatusEnum.optional(),
});

export const rejectTransferSchema = z.object({
  reason: z.string().trim().min(1, 'reason is required').max(500),
});

export type CreateTransferDto = z.infer<typeof createTransferSchema>;
export type ScheduleTransferDeliveryDto = z.infer<typeof scheduleTransferDeliverySchema>;
export type ApproveTransferSourceDto = z.infer<typeof approveTransferSourceSchema>;
export type ApproveTransferTargetDto = z.infer<typeof approveTransferTargetSchema>;
export type CompleteTransferDto = z.infer<typeof completeTransferSchema>;
export type RejectTransferDto = z.infer<typeof rejectTransferSchema>;
```

## src/modules/users/users.schema.ts

```ts
import { z } from 'zod';

export const CreateUserSchema = z.object({
  username: z.string().trim().min(1).max(60),
  password: z.string().min(1).max(255),
  camp_id: z.number().int().positive(),
  role_id: z.number().int().positive(),
  is_active: z.boolean().optional(),
  last_activity: z.iso.datetime().optional(),
  created_at: z.iso.datetime().optional(),
});

export const UpdateUserSchema = CreateUserSchema.partial();

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
```
