# Slash Pay

Slash Pay is a secure full-stack cross-border payments platform for managing multi-currency wallets, FX conversion, deposits, withdrawals, transfers, and transaction history.

The platform is built around ledger-backed financial operations, transactional consistency, idempotency, and concurrency-safe money movement.

## Tech Stack

### Backend
- Java 21
- Spring Boot
- Spring Security
- Spring Data JPA
- PostgreSQL
- Flyway
- Maven
- Testcontainers
- Spring Boot Actuator
- OpenAPI / Swagger

### Frontend
- React.js
- TypeScript
- Vite
- Tailwind CSS
- TanStack Query / Router

### Infrastructure
- Docker
- GitHub Actions
- Render
- Vercel
- PostgreSQL

---

## Architecture

Slash Pay follows a frontend/API/database architecture:

```text
User
  │
  ▼
Vercel
Slash Pay Frontend
  │
  │ HTTPS / REST API
  ▼
Render
Spring Boot Backend
  │
  ▼
Managed PostgreSQL
```

The backend owns financial business logic and remains the source of truth for wallet balances, transactions, FX quotes, and money movement.

---

## Core Features

Slash Pay currently supports:

- User registration and authentication
- JWT-based authorization
- Multi-currency wallets
- Ledger-backed wallet balances
- Deposits
- Withdrawals
- Cross-currency transfers
- FX rates and quotes
- FX quote lifecycle management
- Transaction history
- Idempotent financial operations
- Concurrency-safe transaction processing
- OpenAPI / Swagger documentation
- Health and readiness monitoring
- Request correlation and structured logging

---

## Transaction Safety

Financial operations are executed transactionally.

### Deposits and Withdrawals

Transaction creation, ledger mutation, and transaction completion occur atomically.

### Transfers

Transfers atomically coordinate:

- Transaction creation
- Source wallet debit
- Destination wallet credit
- FX quote consumption
- Ledger entries
- Transaction completion

Failures during processing roll back preceding transaction, ledger, wallet, and quote mutations.

Slash Pay additionally uses:

- Idempotency keys
- Database transactions
- Pessimistic locking
- Deterministic account-lock ordering
- Database uniqueness constraints
- Foreign-key constraints
- Positive-amount constraints

These mechanisms protect against duplicate requests, concurrent updates, race conditions, and inconsistent financial state.

---

## Testing

The backend contains **96+ automated tests** covering unit, integration, security, API documentation, transaction, and concurrency behavior.

PostgreSQL 17 Testcontainers are used for integration tests so database behavior is tested against a real PostgreSQL instance rather than an in-memory substitute.

Coverage includes:

- Authentication
- Wallet operations
- Deposits
- Withdrawals
- Transfers
- FX quotes
- Transaction history
- Idempotency races
- Conflicting idempotency keys
- Concurrent financial operations
- Reverse-direction transfers
- FX quote consumption races
- Ledger invariants
- Transaction rollback behavior
- Security behavior
- OpenAPI documentation
- Application context startup

Run the complete backend test suite:

```sh
cd backend
./mvnw clean test
```

Package the application:

```sh
./mvnw package
```

---

## CI/CD

GitHub Actions runs on pull requests and pushes to `main`.

The CI pipeline:

1. Checks out the repository
2. Configures Temurin Java 21
3. Enables Maven dependency caching
4. Verifies the Maven Wrapper
5. Runs the complete automated test suite
6. Runs PostgreSQL Testcontainers integration/concurrency tests
7. Packages the Spring Boot application
8. Builds the production Docker image

Docker images built during CI are currently validated but are not pushed to a container registry.

Important checks can be reproduced locally:

```sh
cd backend

./mvnw clean test
./mvnw package
docker build -t slashpay-backend:ci-test .
```

---

## Docker Development

### Prerequisites

- Docker
- Docker Compose

Copy the environment template:

```sh
cp .env.example .env
```

Replace development values such as:

```text
DB_PASSWORD
JWT_SECRET
```

with secure local values.

`.env` is ignored by Git and must never be committed.

Start the complete local stack from the repository root:

```sh
docker compose up --build
```

By default:

```text
Backend
http://localhost:8080

PostgreSQL
localhost:5432

Swagger UI
http://localhost:8080/swagger-ui.html

Health
http://localhost:8080/actuator/health
```

Inside Docker Compose, the backend communicates with PostgreSQL through:

```text
postgres:5432
```

Flyway applies database migrations before the application begins serving requests.

Stop the stack with:

```sh
docker compose down
```

PostgreSQL development data persists in the `crosspay_postgres_data` named volume.

Use:

```sh
docker compose down -v
```

only when you intentionally want to delete local database data.

---

## Production Deployment

Slash Pay uses separate frontend and backend deployments.

### Frontend

The React/Vite frontend is deployed on **Vercel**.

The production frontend communicates with the backend using:

```text
VITE_API_BASE_URL
```

Only public frontend configuration should use `VITE_*` variables.

Database credentials, JWT secrets, and other backend secrets must never be exposed through frontend environment variables.

### Backend

The Spring Boot backend is deployed as a Docker Web Service on **Render**.

Production architecture:

```text
Browser
   │
   │ HTTPS
   ▼
Vercel
Slash Pay Frontend
   │
   │ HTTPS REST API
   ▼
Render
Spring Boot API
   │
   │ JDBC
   ▼
Managed PostgreSQL
```

Render terminates HTTPS at its proxy and forwards requests to the application container.

The backend runs with:

```text
SPRING_PROFILES_ACTIVE=prod
```

Required production environment variables include:

```text
DB_URL
DB_USERNAME
DB_PASSWORD
JWT_SECRET
JWT_EXPIRATION
CORS_ALLOWED_ORIGINS
```

Render supplies `PORT` for the application server. `SERVER_PORT` remains available as an explicit override.

The production profile:

- Runs Flyway migrations
- Uses Hibernate schema validation
- Requires environment-driven secrets
- Restricts CORS
- Restricts Actuator exposure
- Runs inside a non-root Docker container

The Render health-check path is:

```text
/actuator/health
```

---

## API Documentation

When running locally:

**Swagger UI**

```text
http://localhost:8080/swagger-ui.html
```

**OpenAPI specification**

```text
http://localhost:8080/v3/api-docs
```

Public authentication endpoints allow users to register and log in.

After authentication, protected endpoints require:

```http
Authorization: Bearer <token>
```

Swagger's **Authorize** functionality can be used to provide the JWT.

API groups include:

- Authentication
- Users
- Wallets
- FX Rates
- FX Conversion
- FX Quotes
- Transfers
- Deposits
- Withdrawals
- Transactions

Deposits, withdrawals, and transfers additionally require:

```http
Idempotency-Key: <unique-key>
```

This allows requests to be retried safely without duplicating financial operations.

---

## Observability

Slash Pay includes application-level observability without exposing sensitive financial information.

### Health

Public health endpoints:

```text
GET /actuator/health
GET /actuator/health/liveness
GET /actuator/health/readiness
```

Database connectivity contributes to readiness while connection details remain hidden.

### Metrics

```text
GET /actuator/metrics
```

is restricted to authenticated callers.

Metrics include:

- HTTP request metrics
- JVM metrics
- HikariCP connection-pool metrics
- Deposit operation counters
- Withdrawal operation counters
- Transfer operation counters
- FX quote lifecycle counters

### Request Correlation

Clients may provide:

```http
X-Request-Id
```

Valid request IDs are returned in the response.

If a request ID is absent or invalid, Slash Pay generates a UUID.

This enables individual requests to be correlated across application logs.

### Logging

Logs may contain:

- Request IDs
- HTTP metadata
- Response status
- Request duration
- Financial operation outcomes

Logs intentionally exclude:

- Passwords
- Password hashes
- JWTs
- Authorization headers
- JWT secrets
- Database credentials
- Idempotency keys
- Request/response bodies
- Raw monetary amounts

---

## Security

Slash Pay uses stateless JWT bearer authentication.

Security controls include:

- HS256 JWT signing
- Minimum 32-byte JWT secret
- JWT expiration validation
- Signature validation
- UUID subject validation
- Argon2 password hashing
- Ownership-scoped resource access
- Idempotent financial operations
- Database transactions
- Pessimistic locking
- Deterministic account-lock ordering
- Explicit CORS configuration
- HTTP security headers
- 16 KB HTTP header limit
- Non-root Docker execution
- Restricted Actuator exposure
- Environment-driven secrets

Browser cross-origin access is denied by default.

Trusted frontend origins must be explicitly configured through:

```text
CORS_ALLOWED_ORIGINS
```

CSRF protection remains disabled because authentication is stateless and sent through an explicit bearer token rather than a browser session cookie.

Distributed login rate limiting, token revocation, and refresh-token support are intentionally deferred because they require shared security state suitable for multi-instance deployment.

---

## Repository Structure

```text
SlashPay/
├── backend/
│   ├── src/
│   │   ├── main/
│   │   └── test/
│   ├── Dockerfile
│   ├── pom.xml
│   └── mvnw
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Local Development

### Backend

```sh
cd backend
./mvnw spring-boot:run
```

### Frontend

```sh
cd frontend
npm install
npm run dev
```

The Vite development server will display the local frontend URL in the terminal.

Configure the frontend API endpoint through:

```env
VITE_API_BASE_URL=http://localhost:8080
```

For production, set this variable to the deployed Render backend URL.

---

## Project Status

Slash Pay currently includes:

- Full-stack frontend and backend
- Multi-currency wallet infrastructure
- Ledger-backed financial operations
- FX quote and conversion workflows
- Deposits and withdrawals
- Cross-currency transfers
- Transaction history
- JWT authentication
- Idempotency protection
- Concurrency-safe financial processing
- PostgreSQL integration
- Flyway migrations
- 96+ automated tests
- PostgreSQL Testcontainers
- OpenAPI documentation
- Application observability
- Docker containerization
- GitHub Actions CI/CD
- Render backend deployment
- Vercel frontend deployment

The next phase focuses on integrating and refining the production frontend-to-backend workflow and continuing product-level improvements.
