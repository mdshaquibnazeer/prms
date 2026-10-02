# Setup Guide (beginner friendly)

You need: **Node.js 18+** (check with `node -v`) and **PostgreSQL 14+** (check with `psql --version`). No Docker needed.

## Step 1 - Get the project
Open the project folder (the one that contains `backend`, `frontend` and `database`) in a terminal.

## Step 2 - Create the PostgreSQL database
Open the PostgreSQL shell (`psql -U postgres`) and run:
```sql
CREATE DATABASE patient_records;
\q
```
(The setup script in Step 4 also creates the database for you if it does not exist, as long as your PostgreSQL user is allowed to create databases.)

## Step 3 - Create the `.env` file
In the **project root** (same folder as `.env.example`):
```bash
cp .env.example .env          # Windows PowerShell: copy .env.example .env
```
Open `.env` and set:
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/patient_records
JWT_SECRET=<a long random string>
```
Generate a secret with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
Never commit `.env` (it is already in `.gitignore`).

## Step 4 - Install and create the tables + demo data
```bash
cd backend
npm install
npm run db:setup        # runs database/schema.sql, then database/seed.sql
```
You should see `Done. Rows: { patients: '5', doctors: '3', ... }`.
*(Manual alternative: `psql -U postgres -d patient_records -f ../database/schema.sql` then `-f ../database/seed.sql`.)*

## Step 5 - Start the backend
```bash
npm run dev             # inside /backend, API at http://localhost:5000/api
```
Expected: `PostgreSQL connection OK`, `Hash Map index built from PostgreSQL: 5 patient(s)`. Check `http://localhost:5000/api/health`.

## Step 6 - Start the frontend (new terminal)
```bash
cd frontend
npm install
npm run dev             # http://localhost:5173
```
Open http://localhost:5173 and log in with a demo account.

## Demo accounts (college project only)
| Role | Email | Password |
|---|---|---|
| Admin | admin@hospital.com | Admin@123 |
| Doctor | doctor@hospital.com | Doctor@123 |
| Receptionist | reception@hospital.com | Reception@123 |

## Step 7 - Test it
- DSA unit tests: `cd backend && npm test`
- API end-to-end test (backend must be running): `cd backend && npm run test:api`. It processes the demo emergency queue, so run `npm run db:setup` afterwards to restore the demo data.
- Postman: import `postman/PRMS.postman_collection.json`, run **Auth > Login** first (it saves the token), then the other requests.
- Manual checklist: see the README.

## Troubleshooting
| Problem | Fix |
|---|---|
| `Missing environment variables` | You have not created `.env` in the project root. |
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL is not running. Start the PostgreSQL service. |
| `password authentication failed` | Wrong password in `DATABASE_URL`. |
| Login says "Cannot reach the server" | Backend is not running or not on port 5000. |
| Port already in use | Change `PORT` in `.env` and the proxy target in `frontend/vite.config.js`. |
| Special characters in the DB password | URL-encode them in `DATABASE_URL` (`@` becomes `%40`). |
