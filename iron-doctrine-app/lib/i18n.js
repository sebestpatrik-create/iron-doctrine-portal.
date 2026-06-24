// UI chrome translations. Content (workouts, meals) is authored per client's language;
// this only covers the fixed labels the app itself renders.

export const STRINGS = {
  en: {
    member: "Member",
    welcomeBack: "Welcome back,",
    todayDefault: "Your plan is ready. Five quality sessions beat fifty half-hearted ones.",
    program: "Your program",
    progress: "Progress",
    theClimb: "The Climb",
    bodyweight: "Bodyweight over time",
    startingWeight: "Starting weight",
    latest: "Latest",
    goal: "Goal",
    fuel: "Fuel",
    yourPlate: "Your Plate",
    yourMeals: "Your meals",
    kcalDay: "kcal / day",
    proteinG: "protein (g)",
    carbsG: "carbs (g)",
    fatG: "fat (g)",
    stack: "Stack",
    dailySupplements: "Daily Supplements",
    weeklyCheckin: "Weekly check-in",
    sendNumbers: "Send your numbers",
    checkinBlurb: "Weigh in first thing, log your measurements, and watch the climb. One minute a week is the whole job.",
    logSession: "Log today's session →",
    thisWeeksPlan: "This week's plan",
    submitCheckin: "Submit check-in →",
    coachedBy: "Coached by Bc. Patrik Šebest · Praha",
    chartEmpty: "Your weight chart appears after your first check-in.",
    programEmpty: "Your program will appear here once it's assigned.",
    demoFlag: "Demo data — connect Notion to show live client data",
  },
  cz: {
    member: "Klient",
    welcomeBack: "Vítej zpět,",
    todayDefault: "Tvůj plán je připravený. Pět kvalitních tréninků je víc než padesát odbytých.",
    program: "Tvůj plán",
    progress: "Pokrok",
    theClimb: "Cesta vzhůru",
    bodyweight: "Váha v čase",
    startingWeight: "Výchozí váha",
    latest: "Aktuální",
    goal: "Cíl",
    fuel: "Palivo",
    yourPlate: "Tvůj talíř",
    yourMeals: "Tvá jídla",
    kcalDay: "kcal / den",
    proteinG: "bílkoviny (g)",
    carbsG: "sacharidy (g)",
    fatG: "tuky (g)",
    stack: "Doplňky",
    dailySupplements: "Denní doplňky",
    weeklyCheckin: "Týdenní check-in",
    sendNumbers: "Pošli svá čísla",
    checkinBlurb: "Zvaž se hned ráno, zapiš si míry a sleduj svůj pokrok. Minuta týdně je celá práce.",
    logSession: "Zapsat dnešní trénink →",
    thisWeeksPlan: "Plán na tento týden",
    submitCheckin: "Odeslat check-in →",
    coachedBy: "Trenér Bc. Patrik Šebest · Praha",
    chartEmpty: "Graf váhy se zobrazí po prvním check-inu.",
    programEmpty: "Tvůj plán se zde zobrazí po přiřazení.",
    demoFlag: "Demo data — připoj Notion pro živá data klienta",
  },
};

// Translations for the Primary Goal select values used in Notion.
const GOALS = {
  "Build muscle": { cz: "Nabrat svaly" },
  "Fat loss": { cz: "Hubnutí" },
  "Lose weight": { cz: "Zhubnout" },
  "Maintenance": { cz: "Udržování" },
  "Get stronger": { cz: "Zesílit" },
  "General fitness": { cz: "Celková kondice" },
};

export function t(lang, key) {
  const L = STRINGS[lang] ? lang : "en";
  return STRINGS[L][key] ?? STRINGS.en[key] ?? key;
}

export function translateGoal(lang, goal) {
  if (!goal) return "";
  if (lang === "cz" && GOALS[goal]) return GOALS[goal].cz;
  return goal;
}

// Normalise whatever is stored in Notion's Language field to "en" or "cz".
export function normalizeLang(value) {
  if (!value) return "en";
  return /cz|czech|česky|čeština|cesky/i.test(value) ? "cz" : "en";
}
