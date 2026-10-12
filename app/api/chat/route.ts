import {
  streamText,
  UIMessage,
  convertToModelMessages,
  tool,
  isStepCount,
  createUIMessageStreamResponse,
  toUIMessageStream,
} from "ai";
import { groq } from "@ai-sdk/groq";
import { z } from "zod";
import {
  clinic,
  receptionistPrompt,
  slotProblem,
  weekdayOf,
} from "@/lib/clinic";
import { supabaseAdmin } from "@/lib/supabase";

const appointmentSchema = z.object({
  patientName: z.string().describe("The patient's full name"),
  phone: z.string().describe("The patient's phone number"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe("Preferred date in YYYY-MM-DD format"),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):(00|30)$/)
    .describe("Preferred time in 24-hour HH:MM format, on the hour or half hour"),
  reason: z
    .enum(clinic.services)
    .describe("The clinic service the patient asked for, exactly as listed"),
});

// Postgres error code for a unique constraint violation.
const UNIQUE_VIOLATION = "23505";

async function saveAppointment(
  appointment: z.infer<typeof appointmentSchema>,
): Promise<"saved" | "slotTaken"> {
  const db = supabaseAdmin();

  const { data: taken, error: checkError } = await db
    .from("appointments")
    .select("id")
    .eq("date", appointment.date)
    .eq("time", appointment.time)
    .neq("status", "cancelled")
    .limit(1);
  if (checkError) throw new Error(checkError.message);
  if (taken.length > 0) return "slotTaken";

  const { error } = await db.from("appointments").insert({
    patient_name: appointment.patientName,
    phone: appointment.phone,
    date: appointment.date,
    time: appointment.time,
    reason: appointment.reason,
  });
  // The unique index catches two patients grabbing the same slot at the same moment.
  if (error?.code === UNIQUE_VIOLATION) return "slotTaken";
  if (error) throw new Error(error.message);
  return "saved";
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.messages)) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  const messages: UIMessage[] = body.messages;

  const result = streamText({
    model: groq("openai/gpt-oss-120b"),
    system: receptionistPrompt(),
    messages: await convertToModelMessages(messages),
    stopWhen: isStepCount(5),
    tools: {
      requestAppointment: tool({
        description:
          "Save an appointment request after the patient has confirmed all the details.",
        inputSchema: appointmentSchema,
        execute: async (appointment) => {
          // The model is told the opening hours, but it can still get them wrong, so enforce them here.
          const problem = slotProblem(appointment.date, appointment.time);
          if (problem) return { saved: false, problem };

          try {
            const outcome = await saveAppointment(appointment);
            return outcome === "saved"
              ? { saved: true, weekday: weekdayOf(appointment.date) }
              : { saved: false, problem: "slotTaken" };
          } catch (error) {
            console.error("Failed to save appointment:", error);
            return { saved: false, problem: "error" };
          }
        },
      }),
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
