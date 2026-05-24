# System Architecture: Gestion del Fin

## 1. Backend Capability Summary
The API provides a comprehensive suite for survival camp management:
- **Authentication & Security**: JWT-based login with session versioning (logouts increment a version, preventing old token reuse) and inactivity tracking.
- **Multi-Tenancy**: Centralized camp management allowing the system to scale across multiple refuges.
- **Human Resources**: Complete lifecycle for survivors including intake (admission), health tracking (status logs), and professional specialization.
- **Logistics**: Inventory management with manual adjustments, automated rationing logic (implied), and audit trails.
- **Operations**: Exploration/Expedition lifecycle management for resource gathering.
- **Intelligence**: AI-assisted admission decisions with explainability triggers in the camp prompts.

## 2. Inferred Entity Relationships
- **Camp**: The root container.
- **Survivor (Person)**: Belongs to a Camp. Linked to Status Logs and Profession Reassignments.
- **Inventory Item**: A mapping of Resource + Camp. Has quantity and audit history.
- **Admission Request**: A pending resident for a Camp. Processes through AI Analysis -> Review -> Enrollment.
- **Expedition**: Scoped to a Camp. Consumes resources and participants (implied by requirements, though the contract schema is sparse on the detail).

## 3. CONTRACT GAP DETECTED
- **Role Permissions Mapping**: The `LoginResponse` doesn't explicitly return the user's role or assigned permissions. I will assume the `user` object will contain a `role` field (e.g., `system_admin`, `resource_manager`, `travel_coordinator`, `resident`).
- **Admission Content**: The `createAdmissionSchema` is not detailed. I will assume fields: `full_name`, `age`, `medical_conditions`, `skills_summary`, `context_narrative`, and `image_urls`.
- **Expedition Payload**: `createExplorationSchema` lacks fields. I will assume: `title`, `destination`, `expected_duration_days`, `participant_ids`, and `resource_requirements`.
- **Metrics Schema**: The dashboard endpoints (e.g., `/api/metrics/dashboard`) lack specific response schemas. I will define types based on standard survival metrics (Population count, Resource health, Active threats/alerts).

## 4. Risk Areas
- **Session Sync**: 20-minute inactivity lock requires robust client-side timers synchronized with the backend's "last activity" tracking.
- **Race Conditions**: Parallel inventory adjustments might occur; the frontend needs optimistic updates or clear error handling.
- **AI Token Leakage**: The `ai_context_prompt` in Camp config is high value.

---

## Technical Strategy
- **Style**: Industrial/Brutalist aesthetic. Dark mode by default. High contrast typography.
- **State**: Zustand for global session/camp context. TanStack Query for caching and auto-refreshing metrics.
- **Validation**: Strict Zod schemas mirroring the inferred contract.
