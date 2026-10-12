# Dental Clinic Receptionist

A chat-based virtual receptionist for a dental clinic. Patients can ask about opening hours, services, location and payment, and request an appointment. Appointment requests are saved to a Supabase database for the clinic's staff to confirm.

> The clinic in this repo ("Bright Smile Dental Clinic") is fictional sample data. Replace it with real details in `lib/clinic.ts` before using this with real patients.

## What it does

- Answers questions using only the clinic details in `lib/clinic.ts`, and says so when it doesn't know something.
- Declines unrelated topics, never diagnoses or recommends medication, and tells patients with an emergency to call the clinic.
- Collects name, phone, date, time and reason for an appointment, reads them back, and saves the request only after the patient confirms.
- Rejects bookings on closed days, outside opening hours, in the past, for services the clinic doesn't offer, or for a slot that is already taken. These rules are enforced on the server, not just in the prompt.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, TypeScript, Tailwind CSS 4)
- [AI SDK](https://ai-sdk.dev) v7 with the [Groq](https://groq.com) provider
- [Supabase](https://supabase.com) (Postgres) for appointments
- `react-markdown` to render the assistant's replies

## Setup

You need Node.js 22 or newer, a Groq API key and a Supabase project.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create the database table. In the Supabase dashboard open **SQL Editor**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and run it.

3. Create a `.env.local` file in the project root:

   ```env
   GROQ_API_KEY=gsk_...
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SECRET_KEY=sb_secret_...
   ```

   `SUPABASE_SECRET_KEY` must be the **secret** key (`sb_secret_...`, or the legacy `service_role` key), not the publishable one. It is only used on the server. Never expose it in browser code.

4. Start the dev server:

   ```bash
   npm run dev
   ```

   Open <http://localhost:3000>.

## Customising

Everything about the clinic lives in [`lib/clinic.ts`](lib/clinic.ts):

| Setting | What it controls |
|---|---|
| `name`, `address`, `phone`, `email`, `dentist`, `payment`, `parking` | Facts the receptionist can share |
| `receptionistName` | The assistant's name in the greeting |
| `openingHours` | One entry per weekday (index 0 is Sunday), 24-hour `HH:MM`, `null` for closed. Used for both answers and booking validation |
| `services` | The only reasons an appointment can be booked for |
| `receptionistPrompt()` | The assistant's behaviour rules |

The model is set in [`app/api/chat/route.ts`](app/api/chat/route.ts) (`openai/gpt-oss-120b`). Available models depend on your Groq account.

## Booking rules

- Appointments start on the hour or half hour, and the last slot is 30 minutes before closing.
- One appointment per slot for the whole clinic (it has a single dentist).
- New requests are saved with `status = 'pending'`. Setting a row's status to `cancelled` frees the slot.
- The receptionist tells patients the clinic will contact them to confirm; it does not promise the appointment.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Before going live

- Replace the sample clinic details.
- Add rate limiting or authentication to `/api/chat`. It is currently open, so anyone who can reach it can use your Groq quota.
- Dates and "today" use the server's clock. Host in the clinic's timezone or add explicit timezone handling.
- Appointment rows contain patient names and phone numbers. Handle them according to the privacy rules that apply to you.

## More detail

[`PROJECT_CONTEXT.md`](PROJECT_CONTEXT.md) describes the architecture, request flow and design decisions in depth.
