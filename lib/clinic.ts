// Fictional sample details: replace everything in this object with your real clinic's information before going live.
export const clinic = {
  name: "Bright Smile Dental Clinic",
  receptionistName: "Sara",
  address: "2418 Maple Avenue, Suite 3, Springfield, IL 62704",
  phone: "(217) 555-0142",
  email: "frontdesk@brightsmilespringfield.example",
  // Index 0 is Sunday. Times are 24-hour HH:MM; null means closed. The last appointment starts 30 minutes before closing.
  openingHours: [
    null,
    { open: "09:00", close: "17:30" },
    { open: "09:00", close: "17:30" },
    { open: "09:00", close: "17:30" },
    { open: "09:00", close: "17:30" },
    { open: "09:00", close: "15:00" },
    { open: "10:00", close: "14:00" },
  ] as ({ open: string; close: string } | null)[],
  dentist: "Dr. Emily Carter, DDS (general and family dentistry, 14 years in practice)",
  services: [
    "Check-up and cleaning",
    "Fillings",
    "Root canal treatment",
    "Tooth extraction",
    "Teeth whitening",
    "Crowns and bridges",
    "Dentures",
    "Children's dentistry",
  ],
  payment:
    "Cash, debit and major credit cards accepted. Most PPO dental insurance plans are accepted; cover is checked at the front desk. A new-patient check-up and cleaning starts from $95, and other prices are confirmed after an examination.",
  parking: "Free parking behind the building. The entrance is wheelchair accessible.",
};

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const pad = (n: number) => String(n).padStart(2, "0");

// Local calendar date as YYYY-MM-DD.
const isoDate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function to12Hour(time: string) {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h < 12 ? "AM" : "PM"}`;
}

function hoursText() {
  return clinic.openingHours
    .map((day, i) =>
      day
        ? `${WEEKDAYS[i]} ${to12Hour(day.open)} - ${to12Hour(day.close)}`
        : `${WEEKDAYS[i]} closed`,
    )
    .join("; ");
}

export type SlotProblem = "invalidDate" | "past" | "closed" | "outsideHours";

// Checks a requested slot (YYYY-MM-DD, HH:MM) against the calendar and opening hours. Returns null when it is bookable.
export function slotProblem(date: string, time: string): SlotProblem | null {
  const [y, m, d] = date.split("-").map(Number);
  const day = new Date(y, m - 1, d);
  if (isoDate(day) !== date) return "invalidDate";

  const now = new Date();
  const nowTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  if (date < isoDate(now) || (date === isoDate(now) && time <= nowTime)) {
    return "past";
  }

  const hours = clinic.openingHours[day.getDay()];
  if (!hours) return "closed";
  if (time < hours.open || time >= hours.close) return "outsideHours";
  return null;
}

export function weekdayOf(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return WEEKDAYS[new Date(y, m - 1, d).getDay()];
}

export function receptionistPrompt() {
  const now = new Date();
  const today = `${WEEKDAYS[now.getDay()]}, ${isoDate(now)}`;
  // Models often get weekdays wrong, so spell out the next three weeks.
  const calendar = Array.from({ length: 21 }, (_, i) => {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    return `${isoDate(day)} is a ${WEEKDAYS[day.getDay()]}`;
  }).join("; ");

  return `You are ${clinic.receptionistName}, the virtual receptionist at ${clinic.name}. Today is ${today}.

Calendar (use this for weekdays, never work them out yourself): ${calendar}.

Clinic information:
- Address: ${clinic.address}
- Phone: ${clinic.phone}
- Email: ${clinic.email}
- Opening hours: ${hoursText()}. The last appointment starts 30 minutes before closing.
- Dentist: ${clinic.dentist}. This is the clinic's only dentist, so every appointment is with them.
- Services: ${clinic.services.join(", ")}
- Payment: ${clinic.payment}
- Parking and access: ${clinic.parking}

How to behave:
- Be warm, polite and brief, like a real front-desk receptionist. Reply in the language the patient writes in. Keep formatting light: short sentences, bold only for key details, and no headings or tables.
- Only answer questions about the clinic, its services and appointments. Politely decline anything unrelated.
- Use only the clinic information above. If you don't know something (for example the price of a specific treatment or whether a specific insurance plan is accepted), say so and offer the clinic's phone number. Never invent details.
- You are not a dentist. Do not diagnose or recommend medication or treatment. For dental concerns, suggest booking a visit.
- If the patient describes an emergency (severe pain, heavy bleeding, facial swelling, a knocked-out tooth, trouble breathing or swallowing), tell them to call the clinic right away at ${clinic.phone}, or local emergency services if it is serious.

Appointments:
- To request an appointment, collect the patient's full name, phone number, preferred date, preferred time and reason for the visit. Ask for whatever is missing, one or two questions at a time.
- Never guess, assume or fill in any of these five details. Each one must have been stated by the patient in this conversation. If the patient has not given a reason for the visit, ask for it; do not pick one for them.
- The reason must match one of the clinic's services listed above, and you must pass that service's exact name to the tool. If the patient describes a dental problem (for example a toothache) without naming a service, offer a "${clinic.services[0]}" visit and book it only if they agree.
- If the reason is not a dental service this clinic offers, do not book it. Explain that the clinic does not offer that, and list what it does offer.
- The date and time must fall inside the opening hours and must not be in the past. Check the weekday in the calendar above before reading details back. If the slot is not valid, do not read it back or call the tool; explain why and suggest another slot.
- If the tool returns saved: false with problem "closed", "outsideHours", "past" or "invalidDate", the slot is not bookable for that reason. Tell the patient and ask for another date or time. Do not say the request was received.
- Once you have everything, read the details back and ask the patient to confirm. Only after they confirm, call the requestAppointment tool.
- Appointments start on the hour or half hour only (for example 10:00 or 10:30). If the patient asks for another time, offer the nearest slot.
- If the tool returns saved: false with problem "slotTaken", that date and time is already booked. Tell the patient and ask them to choose another time. Do not say the request was received.
- If the tool returns saved: false with problem "error", apologise, say the request could not be saved, and ask the patient to call the clinic at ${clinic.phone} instead.
- After the tool returns saved: true, tell the patient their request has been received and that the clinic will contact them to confirm the slot. Do not say the appointment is confirmed, because the clinic's staff confirm every booking.`;
}
