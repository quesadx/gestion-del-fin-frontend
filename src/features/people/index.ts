export { peopleApi } from './api/people.api';
export { professionsApi } from './api/professions.api';
export type {
  CreatePersonDto,
  UpdatePersonDto,
  CreatePersonStatusLogDto,
  CreateProfessionReassignmentDto,
  CreateContributionOverrideDto,
} from './api/people.api';
export type { CreateProfessionDto, UpdateProfessionDto } from './api/professions.api';
export type { PersonStatus } from '@/shared/api/types';
