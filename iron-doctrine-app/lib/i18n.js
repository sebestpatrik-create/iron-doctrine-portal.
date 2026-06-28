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
    signOut: "Sign out",
    privacyLink: "Privacy",
    consentEyebrow: "Privacy & consent",
    consentTitle: "Before we begin",
    consentIntro: "To coach you, Iron Doctrine processes your training data and your progress photos. Progress photos count as health data, so we need your explicit consent first.",
    consentCheckbox: "I explicitly consent to Iron Doctrine processing my training data and progress photos (health data) for the purpose of personal coaching, as described in the privacy notice.",
    consentReadPolicy: "Read the privacy notice",
    consentAgree: "Agree & continue",
    consentSaving: "Saving…",
    consentRequired: "Please tick the box to continue.",
    consentError: "Couldn't save — please try again.",
    consentWithdraw: "You can withdraw your consent at any time by contacting your coach.",
    checkinConsent: "I consent to uploading and processing these progress photos (health data) for coaching.",
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
    signOut: "Odhlásit se",
    privacyLink: "Ochrana údajů",
    consentEyebrow: "Soukromí a souhlas",
    consentTitle: "Než začneme",
    consentIntro: "Abychom tě mohli vést, Iron Doctrine zpracovává tvá tréninková data a fotografie progresu. Fotografie progresu jsou údaje o zdraví, proto nejdříve potřebujeme tvůj výslovný souhlas.",
    consentCheckbox: "Výslovně souhlasím se zpracováním svých tréninkových dat a fotografií progresu (údaje o zdraví) společností Iron Doctrine za účelem osobního coachingu, jak je popsáno v zásadách ochrany osobních údajů.",
    consentReadPolicy: "Přečíst zásady ochrany osobních údajů",
    consentAgree: "Souhlasím a pokračovat",
    consentSaving: "Ukládám…",
    consentRequired: "Pro pokračování prosím zaškrtni políčko.",
    consentError: "Uložení se nezdařilo — zkus to prosím znovu.",
    consentWithdraw: "Svůj souhlas můžeš kdykoli odvolat kontaktováním svého trenéra.",
    checkinConsent: "Souhlasím s nahráním a zpracováním těchto fotografií progresu (údaje o zdraví) pro účely coachingu.",
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
