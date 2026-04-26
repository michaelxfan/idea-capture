import { NextResponse } from "next/server";
import { upsertGoals, upsertReverse, upsertStakeholder } from "@/lib/db";

const SEEDS = [
  {
    name: "Rachel Kim",
    title: "Chief Revenue Officer",
    team: "Revenue",
    influenceScore: 5,
    relationshipStrength: "aligned" as const,
    impactAreas: ["Amazon", "Revenue", "Budget"],
    notes: "Owns quarterly revenue commit. Decisive once she has numbers.",
    isInOffice: true,
    officeDays: ["monday", "tuesday", "wednesday"],
    influencesNames: ["CEO / CFO", "VP of Operations"],
    goal1m: "Decision on Amazon FBA vs GoDirect model for core SKUs.",
    goal3m: "Alignment on Amazon + TikTok Shop revenue split for H2 plan.",
    goal12m: "Locked annual marketplace strategy with staffing to match.",
    whyItMattersToMe: "Can't hit H2 marketplace targets without a clear fulfillment path.",
    whyItMattersToThem: "Margin compression on GoDirect is eating her net revenue.",
    blockers: "Ops has not quantified the switching cost.",
    priorityLevel: 5,
    status: "in_progress" as const,
    decisionDeadline: "2026-05-15",
    compoundingRiskDays: 14,
    howIHelpThem: "Feeds her clean marketplace P&L views weekly.",
    whatIOffer: "Joint FBA pilot on 5 SKUs with a 30-day readout.",
    offerPriority: "high" as const,
  },
  {
    name: "CEO / CFO",
    title: "CEO & CFO (joint decision)",
    team: "Executive",
    influenceScore: 5,
    relationshipStrength: "neutral" as const,
    impactAreas: ["Budget", "Strategy", "Investment"],
    notes: "$500K paid + creative investment pending. Will scrutinize payback.",
    isInOffice: false,
    officeDays: ["thursday", "friday"],
    influencesNames: ["Rachel Kim", "Behnoush", "Lindsey", "VP of Operations"],
    goal1m: "Approval on $500K H2 paid + creative investment.",
    goal3m: "Agreement to reinvest 25% of Q3 overperformance into creative.",
    goal12m: "Standing budget line for marketplace-specific creative.",
    whyItMattersToMe: "Without investment, creative fatigue caps Amazon/TikTok ROAS.",
    whyItMattersToThem: "ROI defensibility in the board deck; risk-adjusted payback.",
    blockers: "No confirmed payback model in their preferred format.",
    priorityLevel: 5,
    status: "blocked" as const,
    decisionDeadline: "2026-05-01",
    compoundingRiskDays: 7,
    howIHelpThem: "Gives them board-ready ecommerce narratives.",
    whatIOffer: "A 1-page payback memo in their FP&A template, pre-vetted.",
    offerPriority: "high" as const,
  },
  {
    name: "Behnoush",
    title: "Senior Director, R&D / Food Safety / Innovation",
    team: "R&D",
    managerName: "CEO",
    influenceScore: 4,
    relationshipStrength: "neutral" as const,
    impactAreas: ["Product", "Shelf Life", "Launches"],
    notes: "Gatekeeper on formula readiness and shelf-life validation.",
    isInOffice: true,
    officeDays: ["monday", "wednesday", "friday"],
    influencesNames: [],
    goal1m: "Commitment to accelerated detox shelf-life testing path.",
    goal3m: "Glow launch pulled in by 30 days with provisional data.",
    goal12m: "Joint launch-readiness scorecard between R&D and ecom.",
    whyItMattersToMe: "Detox & Glow drive Q3/Q4 marketplace momentum.",
    whyItMattersToThem: "Avoiding customer complaints and rework post-launch.",
    blockers: "Stability lab queue prioritized other SKUs.",
    priorityLevel: 5,
    status: "in_progress" as const,
    decisionDeadline: "2026-06-01",
    compoundingRiskDays: 30,
    howIHelpThem: "Catches post-launch issues before they hit reviews.",
    whatIOffer: "Dedicated CS feedback loop flagged to her team weekly.",
    offerPriority: "medium" as const,
  },
  {
    name: "Lindsey",
    title: "VP of Marketing",
    team: "Marketing",
    influenceScore: 4,
    relationshipStrength: "aligned" as const,
    impactAreas: ["Creative", "Brand", "Marketplace Assets"],
    notes: "Peer. Shares revenue target. Easy ally if framing is right.",
    isInOffice: true,
    officeDays: ["tuesday", "wednesday", "thursday"],
    influencesNames: ["CEO / CFO"],
    goal1m: "Committed creative refresh for Amazon + TikTok Shop top 20 SKUs.",
    goal3m: "Shared creative testing pipeline between brand and performance.",
    goal12m: "Quarterly creative scorecard by channel owned jointly.",
    whyItMattersToMe: "Creative is the #1 variable controlling marketplace ROAS.",
    whyItMattersToThem: "Marketplace assets are dragging brand perception metrics.",
    blockers: "Creative team capacity consumed by DTC refresh.",
    priorityLevel: 4,
    status: "open" as const,
    howIHelpThem: "Performance data that tells her which brand bets are working.",
    whatIOffer: "Co-owned creative testing budget + weekly scorecard.",
    offerPriority: "medium" as const,
  },
  {
    name: "VP of Operations",
    title: "VP of Operations",
    team: "Operations",
    influenceScore: 4,
    relationshipStrength: "cold" as const,
    impactAreas: ["Inventory", "CX", "Fulfillment"],
    notes: "Owns inventory + CS routing. Historically siloed from ecom.",
    isInOffice: false,
    officeDays: ["monday", "thursday"],
    influencesNames: ["Rachel Kim"],
    goal1m: "Dedicated inventory buffer for TikTok Shop + Amazon velocity SKUs.",
    goal3m: "CS routing rules changed so ecom-tagged tickets don't route to me.",
    goal12m: "Quarterly ops readiness review tied to ecom launch calendar.",
    whyItMattersToMe: "Stockouts and misrouted CS are eating my time and revenue.",
    whyItMattersToThem: "Inventory costs and CS SLA pressure from the board.",
    blockers: "No shared inventory forecast; different DR tools.",
    priorityLevel: 5,
    status: "blocked" as const,
    decisionDeadline: "2026-05-10",
    compoundingRiskDays: 5,
    howIHelpThem: "Early-warning demand signal from paid media before velocity spikes.",
    whatIOffer: "A 2-week leading demand forecast for top 20 SKUs.",
    offerPriority: "high" as const,
  },
];

export async function POST() {
  // First pass: create all stakeholders, capture name → id map
  const nameToId: Record<string, string> = {};
  for (const seed of SEEDS) {
    const s = await upsertStakeholder({
      name: seed.name,
      title: seed.title,
      team: seed.team,
      managerName: seed.managerName,
      influenceScore: seed.influenceScore,
      relationshipStrength: seed.relationshipStrength,
      impactAreas: seed.impactAreas,
      notes: seed.notes,
      isInOffice: seed.isInOffice,
      officeDays: seed.officeDays,
      influences: [], // filled in second pass
    });
    if (s) nameToId[seed.name] = s.id;
  }

  // Second pass: set influence connections + goals + reverse
  const created = [];
  for (const seed of SEEDS) {
    const id = nameToId[seed.name];
    if (!id) continue;
    const influences = (seed.influencesNames ?? [])
      .map((n) => nameToId[n])
      .filter(Boolean) as string[];

    const s = await upsertStakeholder({
      id,
      name: seed.name,
      title: seed.title,
      team: seed.team,
      managerName: seed.managerName,
      influenceScore: seed.influenceScore,
      relationshipStrength: seed.relationshipStrength,
      impactAreas: seed.impactAreas,
      notes: seed.notes,
      isInOffice: seed.isInOffice,
      officeDays: seed.officeDays,
      influences,
    });
    if (!s) continue;

    await upsertGoals({
      stakeholderId: id,
      goal1m: seed.goal1m,
      goal3m: seed.goal3m,
      goal12m: seed.goal12m,
      whyItMattersToMe: seed.whyItMattersToMe,
      whyItMattersToThem: seed.whyItMattersToThem,
      blockers: seed.blockers,
      priorityLevel: seed.priorityLevel,
      status: seed.status,
      decisionDeadline: seed.decisionDeadline,
      compoundingRiskDays: seed.compoundingRiskDays,
      milestones: [],
    });
    await upsertReverse({
      stakeholderId: id,
      howIHelpThem: seed.howIHelpThem,
      whatIOffer: seed.whatIOffer,
      offerPriority: seed.offerPriority,
    });
    created.push(s);
  }
  return NextResponse.json({ created: created.length, stakeholders: created });
}
