# Endpoint Implementation Workflow

This document is the working checklist for implementing the backend contract in the frontend.

Rule:
- Implement exactly one endpoint at a time.
- Review it.
- Test it.
- Commit it.
- Only then move to the next endpoint.

## Recommended order

1. `POST /auth/login` D
2. `GET /system/time` D
3. `GET /camps` D
4. `GET /camps/{id}` D
5. `GET /camps/{campId}/people` D
6. `GET /resources`
7. `GET /inventory/{campId}` D
8. `GET /professions`
9. `GET /expeditions`
10. `GET /admission/camps/{campId}`
11. `GET /users`

Then implement the corresponding create, update, delete, review, and status endpoints for the same feature before moving to another domain.

## Per-endpoint checklist

1. Confirm the exact route, method, and request body in [docs/Endpoints.json](docs/Endpoints.json).
2. Inspect the current view or page that still uses dummy data.
3. Update or create the plain API function in the correct `api/` file.
4. Add or update the TanStack Query hook if the endpoint is read or mutates cache.
5. Replace the dummy data in the view with the hook data.
6. Add or update loading, error, empty, and success states.
7. Run the smallest useful validation set for the touched files.
8. Review the diff before committing.
9. Commit only that endpoint change.

## Prompt to use for each implementation pass

Use this prompt when you want me to implement the next endpoint:

```text
Implement only this endpoint: <METHOD> <PATH>.

Constraints:
- Do not touch any other endpoint.
- Replace dummy data only in the view that uses this endpoint.
- Update the plain API function, the hook if needed, and the page wiring.
- Keep existing patterns and folder structure.
- After changes, review the diff, run the relevant tests/lint, and stop.
- If the implementation is correct, prepare it for commit but do not move to another endpoint.
```

## Suggested prompt with acceptance criteria

```text
Implement only this endpoint: GET /camps/{campId}/people.

Acceptance criteria:
- The page loads real data from the API.
- Dummy data is removed from that view.
- Query keys include campId.
- Errors and loading states are handled.
- The endpoint is reviewed and tested before any other endpoint is started.
```

## Commit discipline

- One endpoint per commit.
- If a change spans multiple files, keep them in the same endpoint commit.
- Do not batch unrelated endpoints together.
- If the API contract is unclear, stop and resolve the contract before coding.
