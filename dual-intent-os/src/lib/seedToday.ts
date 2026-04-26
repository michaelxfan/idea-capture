import type { Capture } from "@/types";

/**
 * Seed data for "today" — eight scenarios across a realistic low-sleep day.
 * Timestamps are anchored to today at fixed hours so the timeline is legible.
 */
export function buildTodaySeed(): Omit<Capture, "id" | "user_id">[] {
  const today = new Date();
  const at = (h: number, m = 0) => {
    const d = new Date(today);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };

  return [
    {
      created_at: at(7, 45),
      situation_text:
        "Trying to plan the day but I can't tell what the highest leverage thing actually is. I have five options and none of them feel obviously right.",
      domain: "work",
      time_available_minutes: 30,
      energy_level: "medium",
      emotional_tone: "unclear",
      stakes: "medium",
      ai_status: "ready",
      a_intention: "Pick the one move that actually advances the week and start it.",
      b_intention: "Make a longer list to feel like I'm thinking, and pick later.",
      threshold_type: "ambiguity",
      threshold_description:
        "Switch happens when the options feel comparable and no single one feels obviously right.",
      current_mode: "mixed",
      evidence:
        "'None of them feel obviously right' is the tell — you're listing instead of committing.",
      b_classification: "mixed",
      recommendation:
        "Pick the option you'd feel worst about not doing by Friday. Start it for 25 minutes. Re-evaluate.",
      minimum_viable_a: "One 25-minute block on the leading option. Not a plan.",
      outcome_status: null,
      reflection_note: null,
    },
    {
      created_at: at(9, 15),
      situation_text:
        "Slept 5h40. I still want to run the Advance playbook — ship the draft — but every time I open the doc I stall. Feels like gravity is wrong today.",
      domain: "work",
      time_available_minutes: 90,
      energy_level: "low",
      emotional_tone: "tired",
      stakes: "high",
      ai_status: "ready",
      a_intention: "Ship a full draft of the strategic memo.",
      b_intention: "Reduce scope — outline plus the two sections that already exist in my head.",
      threshold_type: "energy",
      threshold_description:
        "Switch happens when sleep debt makes generative work feel like pushing uphill.",
      current_mode: "mixed",
      evidence: "'Every time I open the doc I stall' — the fatigue is doing the scoping for you.",
      b_classification: "strategic",
      recommendation:
        "Write the two sections you already see clearly. Skip the rest. That's today's version of shipped.",
      minimum_viable_a: "Two sections, no polish. Close the doc at 11:00 whether or not they're done.",
      outcome_status: null,
      reflection_note: null,
    },
    {
      created_at: at(13, 10),
      situation_text:
        "Post-lunch slump just hit. I want to push through but my attention is gone. Keep re-reading the same paragraph.",
      domain: "work",
      time_available_minutes: 30,
      energy_level: "low",
      emotional_tone: "tired",
      stakes: "medium",
      ai_status: "ready",
      a_intention: "Push through and finish the analysis block before the afternoon.",
      b_intention: "Accept the dip and do something low-cognitive until energy returns.",
      threshold_type: "energy",
      threshold_description:
        "Switch happens when post-meal glucose crash makes focused reading unreliable.",
      current_mode: "B",
      evidence: "'Re-reading the same paragraph' — the system already paused, you just haven't noticed.",
      b_classification: "healthy",
      recommendation:
        "Stop analyzing. Queue admin or email triage for 20 minutes. Return to the analysis at 2:00.",
      minimum_viable_a: "Mark where you stopped. That's the A you can still execute.",
      outcome_status: null,
      reflection_note: null,
    },
    {
      created_at: at(13, 40),
      situation_text:
        "Deciding between a 20-min walk and lying down. Walk is 'better' but lying down is what the body actually wants.",
      domain: "health",
      time_available_minutes: 25,
      energy_level: "low",
      emotional_tone: "tired",
      stakes: "low",
      ai_status: "ready",
      a_intention: "Walk — get circulation and light, reset the afternoon.",
      b_intention: "Lie down for twenty minutes. Actual nap, not scrolling.",
      threshold_type: "energy",
      threshold_description:
        "Switch happens when fatigue tips from 'low' to 'sleep-needing' — different intervention required.",
      current_mode: "mixed",
      evidence: "The body signal is already the decision. The question is whether you honor it.",
      b_classification: "healthy",
      recommendation:
        "Lie down for 20 min with a timer. Walk after. You get both — in the right order.",
      minimum_viable_a: "20 minutes horizontal, phone face-down, no scrolling.",
      outcome_status: null,
      reflection_note: null,
    },
    {
      created_at: at(14, 30),
      situation_text:
        "Cleaning up small tasks because it feels productive, but it's been 45 minutes and I haven't touched the real thing.",
      domain: "work",
      time_available_minutes: 60,
      energy_level: "medium",
      emotional_tone: "anxious",
      stakes: "high",
      ai_status: "ready",
      a_intention: "Make progress on the strategic memo.",
      b_intention: "Inbox-zero the small tasks so my head feels clear.",
      threshold_type: "friction",
      threshold_description:
        "Switch happens once cleanup crosses ~30 minutes — past that, it's avoidance dressed as prep.",
      current_mode: "B",
      evidence: "'45 minutes and I haven't touched the real thing' is the direct quote on drift.",
      b_classification: "avoidant",
      recommendation:
        "Close email. Open the memo. Write one bad paragraph on the hardest section. Timer: 25 min.",
      minimum_viable_a: "One paragraph. Bad is fine. Bad is the point.",
      outcome_status: null,
      reflection_note: null,
    },
    {
      created_at: at(15, 45),
      situation_text:
        "Just woke up from the nap. Feel groggy, not restored. Not sure whether to push straight back into work or do something physical to reset.",
      domain: "health",
      time_available_minutes: 20,
      energy_level: "low",
      emotional_tone: "unclear",
      stakes: "low",
      ai_status: "ready",
      a_intention: "Return to the strategic memo sharp and focused.",
      b_intention: "Move the body first — shower or walk — to flip the state before re-entering work.",
      threshold_type: "mixed",
      threshold_description:
        "Switch happens in state transitions where pushing A before the body has reset produces worse output.",
      current_mode: "mixed",
      evidence: "'Groggy, not restored' — the nap didn't complete the reset, something else has to.",
      b_classification: "strategic",
      recommendation:
        "Cold water on the face, 5-minute walk outside. Then re-enter the memo. Don't shortcut this.",
      minimum_viable_a: "Physical reset first. Work second. The order matters more than the duration.",
      outcome_status: null,
      reflection_note: null,
    },
    {
      created_at: at(18, 20),
      situation_text:
        "Deciding what to eat for dinner. I want to cook something real but the effort tax feels huge. Keep eyeing the delivery app.",
      domain: "personal",
      time_available_minutes: 45,
      energy_level: "low",
      emotional_tone: "tired",
      stakes: "low",
      ai_status: "ready",
      a_intention: "Cook something simple — protein, vegetable, done.",
      b_intention: "Order delivery and preserve the remaining energy for the evening.",
      threshold_type: "friction",
      threshold_description:
        "Switch happens when the multi-step nature of cooking exceeds current executive function.",
      current_mode: "B",
      evidence: "'Effort tax feels huge' names the exact friction point.",
      b_classification: "protective",
      recommendation:
        "Order. Don't moralize it. Use the saved energy for one real conversation tonight, not more work.",
      minimum_viable_a: "Order. Eat at the table, not in front of a screen. That's the real discipline.",
      outcome_status: null,
      reflection_note: null,
    },
    {
      created_at: at(19, 30),
      situation_text:
        "Should I go to the 8pm Equinox class? I said I would this morning but now I'm dreading the re-entry — leaving the apartment, the commute, the getting changed.",
      domain: "health",
      time_available_minutes: 90,
      energy_level: "low",
      emotional_tone: "resistant",
      stakes: "medium",
      ai_status: "ready",
      a_intention: "Go to the Equinox class as planned.",
      b_intention: "Skip it, do a 15-minute mobility session at home, preserve the streak emotionally.",
      threshold_type: "friction",
      threshold_description:
        "Switch happens when the activation cost (leaving + transit + change) exceeds the workout cost itself.",
      current_mode: "B",
      evidence: "'Dreading the re-entry' — the friction is in the transition, not the work.",
      b_classification: "mixed",
      recommendation:
        "Go. Commit to 30 minutes of the class only. If it's bad after 30, leave. You'll almost never leave.",
      minimum_viable_a: "Put shoes on. Walk out the door. Everything after that is momentum.",
      outcome_status: null,
      reflection_note: null,
    },
  ];
}
