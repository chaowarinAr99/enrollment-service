## Shared Context
We are splitting an existing learning project into two real microservice repos:
1) enrollment-service
2) certificate-service
## Goal:
- Make the system feel like real microservices.
- Use realistic testing practices.
## Testing strategy:
- unit tests: mock everything
- component tests: use real MongoDB
- integration tests: real HTTP flow / Docker Compose if needed
- Mountebank can be used to simulate external certificate API
## General conventions:
- Enrollment IDs look like ENR001, ENR002, ...
- Keep test data deterministic.
- Avoid stale Bruno env vars.
- Do not use in-memory repositories for component tests anymore.
## Enrollment Service Context
Service: enrollment-service
## Responsibilities:
- POST /enrollments
- PATCH /enrollments/:id/approve
- PATCH /enrollments/:id/reject
## Business rules:
- course must be OPEN
- course must have remaining seats
- duplicate active enrollment must be blocked
- approve/reject only works for PENDING_APPROVAL
## Testing:
- unit tests can mock repositories
- component tests must use real MongoDB and seeded data
- integration tests should verify real HTTP + DB behavior