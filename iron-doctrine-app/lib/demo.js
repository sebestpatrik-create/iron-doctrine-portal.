// Sample data so the portal looks alive on first deploy, before you connect Notion.
// Once your NOTION_TOKEN is set, real client data replaces this automatically.

export const DEMO = {
  lang: "en",
  name: "Petra",
  goal: "Build muscle",
  weekLabel: "5-Day Hypertrophy Split · Week 1 of 4",
  todayNote: "Today is Push day. Five hard sessions this week, then we log the numbers and let the work show.",
  programName: "5-Day Hypertrophy Split",
  programBlocks: [
    { type: "h2", text: "Day 1 — Push" },
    { type: "table", header: ["Exercise", "Sets", "Reps"], rows: [
      ["Bench Press", "4", "6–10"],
      ["Overhead Press", "3", "8–10"],
      ["Incline Dumbbell Press", "3", "10–12"],
      ["Lateral Raise", "4", "12–20"],
      ["Triceps Pushdown", "3", "12–15"],
    ] },
    { type: "h2", text: "Day 2 — Pull" },
    { type: "table", header: ["Exercise", "Sets", "Reps"], rows: [
      ["Pull-up / Lat Pulldown", "4", "8–12"],
      ["Bent-Over Row", "4", "8–10"],
      ["Chest-Supported Row", "3", "10–12"],
      ["Face Pull", "3", "15–20"],
      ["Incline Curl", "3", "10–12"],
    ] },
    { type: "h2", text: "Day 3 — Legs" },
    { type: "table", header: ["Exercise", "Sets", "Reps"], rows: [
      ["Back Squat", "4", "6–10"],
      ["Romanian Deadlift", "3", "8–10"],
      ["Leg Press", "3", "12–15"],
      ["Seated Leg Curl", "3", "12–15"],
      ["Calf Raise", "4", "12–20"],
    ] },
    { type: "h2", text: "Day 4 — Upper" },
    { type: "table", header: ["Exercise", "Sets", "Reps"], rows: [
      ["Incline Dumbbell Press", "4", "8–12"],
      ["Lat Pulldown", "4", "10–12"],
      ["Cable Fly", "3", "12–15"],
      ["Lateral Raise", "4", "12–20"],
      ["Hammer Curl", "3", "10–12"],
    ] },
    { type: "h2", text: "Day 5 — Lower" },
    { type: "table", header: ["Exercise", "Sets", "Reps"], rows: [
      ["Hip Thrust", "4", "8–12"],
      ["Hack / Goblet Squat", "4", "10–12"],
      ["Walking Lunge", "3", "12/leg"],
      ["Leg Extension", "3", "15–20"],
      ["Seated Calf Raise", "4", "15–20"],
    ] },
  ],
  macros: { kcal: 2500, protein: 150, carbs: 300, fat: 75 },
  mealBlocks: [
    { type: "h2", text: "Breakfast" },
    { type: "table", header: ["Food", "Amount", "Kcal", "P", "C", "F"], rows: [
      ["Oats", "80 g", "300", "10", "54", "6"],
      ["Whey protein", "1 scoop", "120", "24", "3", "2"],
      ["Blueberries", "100 g", "60", "1", "14", "0"],
    ] },
    { type: "h2", text: "Lunch" },
    { type: "table", header: ["Food", "Amount", "Kcal", "P", "C", "F"], rows: [
      ["Chicken breast", "180 g", "300", "56", "0", "7"],
      ["White rice (cooked)", "250 g", "320", "6", "70", "1"],
      ["Olive oil", "1 tbsp", "120", "0", "0", "14"],
      ["Mixed veg", "150 g", "50", "3", "9", "0"],
    ] },
    { type: "h2", text: "Dinner" },
    { type: "table", header: ["Food", "Amount", "Kcal", "P", "C", "F"], rows: [
      ["Salmon fillet", "150 g", "280", "34", "0", "16"],
      ["Potatoes", "300 g", "260", "6", "58", "0"],
      ["Side salad", "1 bowl", "40", "2", "6", "1"],
    ] },
  ],
  supplements: [
    "Creatine · 5g daily",
    "Whey · to hit 150g protein",
    "Vitamin D3 · 1–2k IU",
    "Omega-3 · 1–2g",
    "Caffeine · pre-workout (optional)",
  ],
  measurements: [
    { date: "2026-06-22", weight: 71.0 },
  ],
  weeklyTarget: "+0.25 kg",
};
