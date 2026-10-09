# Smart Parking — Attendant Console (React + Vite)

Frontend for the Spring Boot backend in `../parking-management/parking-management`.

## Run

1. Start MySQL and the Spring Boot app (port 8080).
2. In this folder:

   ```bash
   npm install
   npm run dev
   ```

3. Open http://localhost:5173

The Vite dev server proxies `/api` to `http://localhost:8080`, so no CORS setup is needed.
To point at a different backend: `API_TARGET=http://host:port npm run dev`.

## Screens

| Screen | Backend calls |
| --- | --- |
| Lot · entry (issue ticket) | `GET /api/slots`, `GET /api/tickets/active`, `POST /api/parking/entry` |
| Lot · exit (fee + payment) | `POST /api/payments` |
| Active sessions, Find vehicle, Overstay alerts | `GET /api/tickets/active` |
| Lot configuration (rates & rules) | `GET/PUT /api/parking-lots/{id}` |
| Payments & receipts | `GET /api/payments` *(not in backend yet — falls back to receipts taken on this console)* |
| Void ticket | `POST /api/tickets/{ticketNumber}/void` *(not in backend yet — shows an error)* |

The fee shown at exit mirrors `PaymentService.calculateFee`; the server's amount is the one charged.
