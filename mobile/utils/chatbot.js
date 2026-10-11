import { ALLERGENS, allergenLabel } from "./allergens";
import { formatPrice } from "../theme";

// ---------- text helpers ----------
const strip = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// word match; "abc*" = prefix match, otherwise whole word (optional plural s)
const has = (t, list) =>
  list.some((w) =>
    w.endsWith("*")
      ? new RegExp(`\\b${w.slice(0, -1)}`).test(t)
      : new RegExp(`\\b${w}s?\\b`).test(t),
  );

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

const MED =
  "\n\nℹ️ Informations générales : elles ne remplacent pas l'avis d'un médecin.";

// ---------- fixed knowledge (food safety) ----------
const TEXTS = {
  urgent:
    "🚨 Difficulté à respirer, gonflement du visage, des lèvres ou de la gorge, malaise : appelez immédiatement les urgences (SAMU 190 en Tunisie) et prévenez le personnel. N'attendez pas que cela passe.",

  symptoms:
    "Une intoxication alimentaire se manifeste par des nausées, des vomissements, de la diarrhée, des crampes abdominales, parfois de la fièvre, de quelques heures à quelques jours après un repas.\n\n" +
    "Que faire :\n• buvez souvent de petites quantités (eau, solution de réhydratation)\n• reposez-vous et mangez léger quand l'appétit revient\n• évitez les médicaments contre la diarrhée sans avis médical\n\n" +
    "Consultez un médecin rapidement si : sang dans les selles, fièvre élevée (plus de 38,5 °C), signes de déshydratation (bouche sèche, urines rares, vertiges), vomissements qui empêchent de boire, symptômes de plus de 3 jours, ou si la personne est enceinte, un enfant, âgée ou fragile.\n\n" +
    "🚨 Urgence immédiate (SAMU 190) : difficultés à respirer, gonflement du visage ou de la gorge, malaise, vision trouble ou faiblesse musculaire.\n\n" +
    "Je ne peux pas poser de diagnostic. Si vous pensez que votre repas chez nous est en cause, prévenez le restaurant pour que nous puissions vérifier." +
    MED,

  risk:
    "Certaines personnes sont plus vulnérables aux infections alimentaires : femmes enceintes, jeunes enfants, personnes de plus de 65 ans, personnes immunodéprimées ou atteintes de maladies chroniques.\n\n" +
    "Pour elles, il vaut mieux éviter : viande, poisson et œufs crus ou peu cuits, fromages au lait cru, charcuterie et poisson fumé (risque de Listeria pour la femme enceinte), et préférer des plats bien cuits, servis chauds.\n\n" +
    "Signalez votre situation au personnel pour choisir un plat adapté, et en cas de doute demandez l'avis de votre médecin." +
    MED,

  raw:
    "Les aliments crus ou peu cuits sont une source fréquente de contamination :\n• volaille : toujours bien cuite à cœur\n• viande hachée : cuite jusqu'à ce qu'il n'y ait plus de rose au centre\n• œufs crus : mayonnaise, mousses et certains desserts peuvent en contenir, demandez au personnel\n• poisson et fruits de mer crus : risque plus élevé pour les personnes fragiles\n• lait et fromages au lait cru : déconseillés aux personnes à risque" +
    MED,

  leftovers:
    "Pour les restes et les plats à emporter :\n• mettez-les au réfrigérateur dans les 2 heures (1 heure en cas de forte chaleur)\n• consommez-les sous 3 à 4 jours\n• réchauffez-les jusqu'à ce qu'ils soient bien chauds à cœur, une seule fois\n• ne recongelez pas un plat décongelé\n• ne laissez jamais un plat longtemps à température ambiante" +
    MED,

  hygiene:
    "Les bons gestes d'hygiène :\n• lavez-vous les mains au savon pendant 20 secondes avant de manger et après les toilettes\n• séparez le cru du cuit (planches, couteaux, assiettes)\n• nettoyez les surfaces et ustensiles après contact avec de la viande crue\n• ne lavez pas la volaille crue : cela disperse les bactéries" +
    MED,

  germs:
    "Les infections d'origine alimentaire sont causées par des bactéries (Salmonella, Listeria, E. coli, Campylobacter), des virus (norovirus) ou des parasites présents dans un aliment contaminé. Elles se préviennent surtout par une bonne cuisson, le respect de la chaîne du froid et l'hygiène des mains et des ustensiles." +
    MED,

  general:
    "Les infections alimentaires surviennent quand on mange un aliment contaminé par des bactéries, des virus ou des parasites. Les causes principales :\n• cuisson insuffisante (volaille, viande hachée, œufs)\n• contamination croisée entre cru et cuit\n• aliments laissés trop longtemps à température ambiante\n• mains ou ustensiles mal lavés\n\n" +
    "Bons réflexes : mangez les plats chauds servis bien chauds, lavez-vous les mains avant de manger, et ne gardez pas de restes plus de 2 heures à température ambiante.\n\n" +
    "Vous pouvez me demander : « intoxication alimentaire », « œuf cru », « restes », « enceinte » ou « hygiène »." +
    MED,

  help: "Je peux :\n• vous conseiller des plats de notre menu\n• chercher selon votre budget ou un régime végétarien\n• vous aider avec les allergènes\n• répondre sur la sécurité alimentaire et l'intoxication\n\nEssayez : « Que me conseillez-vous ? », « Un plat végétarien », « Allergie au gluten ».",

  order:
    "Pour commander : ouvrez un plat, ou touchez + dans le menu, puis allez dans « Panier » pour choisir sur place ou à emporter. Pour une table : onglet Accueil, puis « Réserver ».",
};

// ---------- allergen vocabulary ----------
const ALLERGEN_WORDS = {
  gluten: ["gluten", "ble", "farine"],
  lait: ["lait", "lactose", "laitage", "laitier", "fromage"],
  oeufs: ["oeuf"],
  poisson: ["poisson"],
  crustaces: ["crustace", "crevette", "crabe", "homard", "fruits de mer"],
  arachides: ["arachide", "cacahuete"],
  "fruits-a-coque": [
    "noix",
    "amande",
    "noisette",
    "pistache",
    "fruits a coque",
    "cajou",
  ],
  soja: ["soja"],
  sesame: ["sesame"],
  celeri: ["celeri"],
  moutarde: ["moutarde"],
};

const STOP = new Set([
  "je",
  "tu",
  "un",
  "une",
  "des",
  "les",
  "le",
  "la",
  "de",
  "du",
  "et",
  "ou",
  "avec",
  "pour",
  "que",
  "qui",
  "quoi",
  "est",
  "sont",
  "vous",
  "avez",
  "quel",
  "quels",
  "quelle",
  "plat",
  "plats",
  "manger",
  "veux",
  "voudrais",
  "cherche",
  "aimerais",
  "ai",
  "il",
  "en",
  "au",
  "aux",
  "mon",
  "ma",
  "mes",
  "ce",
  "cette",
  "pas",
  "sur",
  "dans",
  "tres",
  "bien",
  "peut",
  "faire",
  "quelque",
  "chose",
  "avoir",
  "prendre",
  "donner",
  "montre",
  "moi",
  "nous",
]);

// ---------- reply builders ----------
const list = (arr, n = 4) => arr.slice(0, n);

function recommend(meals) {
  if (!meals.length)
    return {
      text: "Le menu n'est pas disponible pour le moment. Réessayez dans un instant.",
    };
  const seen = new Set();
  const picks = [];
  for (const m of shuffle(meals)) {
    if (!seen.has(m.categorie)) {
      seen.add(m.categorie);
      picks.push(m);
    }
    if (picks.length === 3) break;
  }
  for (const m of shuffle(meals)) {
    if (picks.length >= 3) break;
    if (!picks.includes(m)) picks.push(m);
  }
  return { text: "Voici 3 suggestions du moment 😋", meals: picks };
}

function allergyReply(t, meals) {
  const mentioned = ALLERGENS.map((a) => a.key).filter((k) =>
    has(t, ALLERGEN_WORDS[k] || []),
  );

  if (!mentioned.length) {
    return {
      text: "Dites-moi quel allergène vous concerne (gluten, lait, œufs, poisson, crustacés, arachides, fruits à coque, soja, sésame, céleri, moutarde) et je chercherai les plats compatibles, d'après les informations renseignées par le restaurant.\n\n⚠️ En cas d'allergie sévère, prévenez toujours le serveur.",
    };
  }

  const names = mentioned.map(allergenLabel).join(", ");
  const safe = meals.filter(
    (m) =>
      Array.isArray(m.allergenes) &&
      mentioned.every((k) => !m.allergenes.includes(k)),
  );
  const unknown = meals.filter((m) => !Array.isArray(m.allergenes));

  let text = safe.length
    ? `D'après les informations renseignées par le restaurant, ces plats ne contiennent pas : ${names}.`
    : `Aucun plat n'a pour l'instant une information confirmée « sans ${names} ».`;
  if (unknown.length) {
    text += `\n\nPour ${unknown.length} plat(s), les allergènes ne sont pas renseignés : demandez au personnel avant de commander.`;
  }
  text +=
    "\n\n⚠️ En cas d'allergie sévère, prévenez toujours le serveur : des traces peuvent exister (contamination croisée en cuisine).";
  return { text, meals: list(safe) };
}

function budgetReply(raw, meals) {
  const m = raw.match(
    /(moins de|max(?:imum)?|budget(?: de)?|jusqu['’ ]?[aà]|inf[ée]rieur [aà])\s*(\d+(?:\.\d+)?)/,
  );
  const sorted = [...meals].sort((a, b) => a.prix - b.prix);
  if (m) {
    const limit = parseFloat(m[2]);
    const ok = sorted.filter((x) => x.prix <= limit);
    return ok.length
      ? { text: `Plats à ${formatPrice(limit)} ou moins :`, meals: list(ok) }
      : {
          text: `Aucun plat à ${formatPrice(limit)} ou moins. Le moins cher est à ${formatPrice(sorted[0].prix)}.`,
          meals: sorted.slice(0, 1),
        };
  }
  return {
    text: "Voici nos plats les plus abordables 💰",
    meals: list(sorted, 3),
  };
}

function categoryMatch(t, meals) {
  const cats = [...new Set(meals.map((m) => m.categorie))];
  for (const c of cats) {
    const sc = strip(c).replace(/s$/, "");
    if (sc.length >= 3 && new RegExp(`\\b${sc}`).test(t)) {
      const inCat = meals.filter((m) => m.categorie === c);
      return {
        text: `Voici nos plats de la catégorie « ${c} » :`,
        meals: list(inCat),
      };
    }
  }
  return null;
}

function keywordSearch(t, meals) {
  const tokens = t.split(" ").filter((w) => w.length >= 3 && !STOP.has(w));
  if (!tokens.length) return null;
  const scored = meals
    .map((m) => {
      const hay = strip(`${m.nom} ${m.description} ${m.categorie}`);
      const score = tokens.filter((w) =>
        new RegExp(`\\b${w.replace(/s$/, "")}`).test(hay),
      ).length;
      return { m, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  if (!scored.length) return null;
  return {
    text: `J'ai trouvé ${scored.length} plat(s) qui correspond(ent) :`,
    meals: list(scored.map((x) => x.m)),
  };
}

// ---------- main entry ----------
export function answer(input, allMeals = []) {
  const raw = String(input || "")
    .toLowerCase()
    .replace(/,/g, ".");
  const t = strip(input);
  const meals = allMeals.filter((m) => m.disponible !== false);

  if (!t) return { text: TEXTS.help };

  // 1. urgent signs
  if (
    has(t, [
      "respir*",
      "gonfl*",
      "etouff*",
      "anaphyla*",
      "malaise",
      "gorge",
      "levres",
    ])
  ) {
    return { text: TEXTS.urgent };
  }

  // 2. symptoms / food poisoning
  if (
    has(t, [
      "intoxiqu*",
      "intoxication",
      "vomi*",
      "diarrhe*",
      "nausee*",
      "crampe*",
      "gastro*",
      "fievre",
      "malade",
    ]) ||
    /mal (au|a l) (ventre|estomac)/.test(t)
  ) {
    return { text: TEXTS.symptoms };
  }

  // 3. allergies
  const allergyContext =
    has(t, [
      "allerg*",
      "intoleran*",
      "contient",
      "contiennent",
      "ingredient*",
      "composition",
      "trace",
    ]) ||
    /sans (gluten|lactose|lait|oeuf|arachide|poisson|soja|sesame|noix|celeri|moutarde|crustace)/.test(
      t,
    );
  if (allergyContext) return allergyReply(t, meals);

  // 4. food safety topics
  if (
    has(t, [
      "enceinte",
      "grossesse",
      "bebe",
      "enfant*",
      "age",
      "agee",
      "ages",
      "immun*",
      "diabet*",
      "fragile",
      "risque*",
    ]) &&
    !has(t, ["plat", "menu"])
  ) {
    return { text: TEXTS.risk };
  }
  if (
    has(t, [
      "cru",
      "crue",
      "saignant",
      "cuisson",
      "mayonnaise",
      "tartare",
      "sushi",
    ])
  )
    return { text: TEXTS.raw };
  if (
    has(t, [
      "reste*",
      "rechauff*",
      "conserv*",
      "frigo",
      "refrigerat*",
      "emporter",
      "congel*",
    ])
  )
    return { text: TEXTS.leftovers };
  if (has(t, ["hygiene", "propre", "lavage", "laver", "main", "mains"]))
    return { text: TEXTS.hygiene };
  if (
    has(t, [
      "bacteri*",
      "salmonell*",
      "listeria",
      "coli",
      "virus",
      "parasite*",
      "norovirus",
      "germe*",
    ])
  )
    return { text: TEXTS.germs };
  if (
    has(t, [
      "securite",
      "sain*",
      "prevention",
      "precaution*",
      "alimentaire",
      "infection*",
    ])
  )
    return { text: TEXTS.general };

  // 5. greetings, thanks, help
  if (
    has(t, [
      "bonjour",
      "salut",
      "salam",
      "bonsoir",
      "hello",
      "hi",
      "coucou",
      "aslema",
    ])
  ) {
    return { text: "Bonjour ! 👋 Comment puis-je vous aider ? " + TEXTS.help };
  }
  if (has(t, ["merci", "shukran", "thanks", "parfait", "super"])) {
    return { text: "Avec plaisir ! Bon appétit 😊" };
  }
  if (has(t, ["aide", "help", "peux tu", "que sais tu", "que peux"]))
    return { text: TEXTS.help };
  if (has(t, ["commander", "commande", "panier", "reserv*", "table"]))
    return { text: TEXTS.order };

  // 6. diet and budget
  if (has(t, ["vegetarien*", "vegan*", "vegeta*", "sans viande"])) {
    const veg = meals.filter((m) => m.vegetarien === true);
    return veg.length
      ? {
          text: "Plats signalés comme végétariens par le restaurant :",
          meals: list(veg),
        }
      : {
          text: "Aucun plat n'est signalé comme végétarien pour le moment. Demandez au personnel, il pourra vous conseiller.",
        };
  }
  if (
    has(t, [
      "pas cher",
      "economique*",
      "budget",
      "abordable*",
      "petit prix",
      "prix",
      "moins de",
      "maximum",
      "max",
    ])
  ) {
    return budgetReply(raw, meals);
  }

  // 7. category, recommendation, keyword search
  const cat = categoryMatch(t, meals);
  if (cat) return cat;

  if (
    has(t, [
      "conseil*",
      "recommand*",
      "suggere*",
      "suggest*",
      "propos*",
      "faim",
      "surprend*",
      "populaire*",
      "specialite*",
      "meilleur*",
      "choisir",
      "idee*",
      "quoi manger",
      "que manger",
    ])
  ) {
    return recommend(meals);
  }

  const found = keywordSearch(t, meals);
  if (found) return found;

  return {
    text: "Je n'ai pas bien compris 🤔\n\n" + TEXTS.help,
  };
}
