import { describe, expect, it } from "vitest";
import {
  extractBonuses,
  extractContrat,
  extractOudlers,
  extractPlayerReference,
  extractPoints,
  frenchWordToNumber,
  normalizeTranscript,
  parseVoiceScore,
} from "../../services/voiceScoreParser";
import { Chelem, Contract, Poignee } from "../../types/enums";

describe("normalizeTranscript", () => {
  it("met en minuscules", () => {
    expect(normalizeTranscript("Garde SANS")).toBe("garde sans");
  });

  it("supprime la ponctuation", () => {
    expect(normalizeTranscript("garde, 56 points.")).toBe("garde 56 points");
  });

  it("supprime les filler words", () => {
    expect(normalizeTranscript("euh donc garde euh 56 points")).toBe(
      "garde 56 points",
    );
  });

  it("normalise les espaces multiples", () => {
    expect(normalizeTranscript("garde   sans   56")).toBe("garde sans 56");
  });

  it("normalise les accents courants", () => {
    expect(normalizeTranscript("poignée")).toBe("poignee");
  });

  it("trim les espaces en début et fin", () => {
    expect(normalizeTranscript("  garde  ")).toBe("garde");
  });

  it("retourne une chaîne vide pour une entrée vide", () => {
    expect(normalizeTranscript("")).toBe("");
  });

  it("remplace les apostrophes par des espaces", () => {
    expect(normalizeTranscript("l'appelé est Pierre")).toBe("l appele est pierre");
  });

  it("gère les apostrophes typographiques", () => {
    expect(normalizeTranscript("l\u2019appel\u00e9")).toBe("l appele");
  });
});

describe("frenchWordToNumber", () => {
  it.each([
    ["zero", 0],
    ["un", 1],
    ["deux", 2],
    ["trois", 3],
    ["quatre", 4],
    ["cinq", 5],
    ["six", 6],
    ["sept", 7],
    ["huit", 8],
    ["neuf", 9],
    ["dix", 10],
    ["onze", 11],
    ["douze", 12],
    ["treize", 13],
    ["quatorze", 14],
    ["quinze", 15],
    ["seize", 16],
  ])("convertit '%s' en %i", (word, expected) => {
    expect(frenchWordToNumber(word)).toBe(expected);
  });

  it.each([
    ["dix-sept", 17],
    ["dix-huit", 18],
    ["dix-neuf", 19],
  ])("convertit '%s' en %i", (word, expected) => {
    expect(frenchWordToNumber(word)).toBe(expected);
  });

  it.each([
    ["vingt", 20],
    ["vingt et un", 21],
    ["vingt-et-un", 21],
    ["vingt-deux", 22],
    ["vingt-neuf", 29],
  ])("convertit '%s' en %i", (word, expected) => {
    expect(frenchWordToNumber(word)).toBe(expected);
  });

  it.each([
    ["trente", 30],
    ["trente et un", 31],
    ["trente-cinq", 35],
    ["quarante", 40],
    ["quarante et un", 41],
    ["quarante-deux", 42],
    ["cinquante", 50],
    ["cinquante et un", 51],
    ["cinquante-six", 56],
  ])("convertit '%s' en %i", (word, expected) => {
    expect(frenchWordToNumber(word)).toBe(expected);
  });

  it.each([
    ["soixante", 60],
    ["soixante et un", 61],
    ["soixante-neuf", 69],
    ["soixante-dix", 70],
    ["soixante et onze", 71],
    ["soixante-douze", 72],
    ["soixante-dix-neuf", 79],
  ])("convertit '%s' en %i", (word, expected) => {
    expect(frenchWordToNumber(word)).toBe(expected);
  });

  it.each([
    ["quatre-vingts", 80],
    ["quatre-vingt", 80],
    ["quatre-vingt-un", 81],
    ["quatre-vingt-neuf", 89],
    ["quatre-vingt-dix", 90],
    ["quatre-vingt-onze", 91],
  ])("convertit '%s' en %i", (word, expected) => {
    expect(frenchWordToNumber(word)).toBe(expected);
  });

  it("accepte les espaces à la place des tirets", () => {
    expect(frenchWordToNumber("cinquante six")).toBe(56);
    expect(frenchWordToNumber("quatre vingts")).toBe(80);
    expect(frenchWordToNumber("quatre vingt dix")).toBe(90);
  });

  it("retourne null pour une entrée invalide", () => {
    expect(frenchWordToNumber("bonjour")).toBeNull();
    expect(frenchWordToNumber("")).toBeNull();
    expect(frenchWordToNumber("cent")).toBeNull();
  });
});

describe("extractContrat", () => {
  it("détecte petite", () => {
    expect(extractContrat("petite 56 points")).toBe(Contract.Petite);
  });

  it("détecte garde", () => {
    expect(extractContrat("garde 56 points")).toBe(Contract.Garde);
  });

  it("détecte garde sans", () => {
    expect(extractContrat("garde sans 56 points")).toBe(Contract.GardeSans);
  });

  it("détecte garde contre", () => {
    expect(extractContrat("garde contre 56 points")).toBe(
      Contract.GardeContre,
    );
  });

  it("priorise garde sans sur garde seule", () => {
    expect(extractContrat("garde sans le chien")).toBe(Contract.GardeSans);
  });

  it("priorise garde contre sur garde seule", () => {
    expect(extractContrat("garde contre le chien")).toBe(Contract.GardeContre);
  });

  it("retourne null si aucun contrat détecté", () => {
    expect(extractContrat("56 points appele pierre")).toBeNull();
  });
});

describe("extractPoints", () => {
  it("extrait les points en chiffres", () => {
    expect(extractPoints("garde 56 points")).toBe(56);
  });

  it("extrait les points en mots français", () => {
    expect(extractPoints("garde cinquante-six points")).toBe(56);
  });

  it("extrait les points sans le mot 'points'", () => {
    expect(extractPoints("garde 56")).toBe(56);
  });

  it("rejette les points hors limites (>91)", () => {
    expect(extractPoints("garde 92 points")).toBeNull();
  });

  it("rejette les points négatifs", () => {
    expect(extractPoints("garde -5 points")).toBeNull();
  });

  it("extrait 0 points", () => {
    expect(extractPoints("garde zero points")).toBe(0);
    expect(extractPoints("garde 0 points")).toBe(0);
  });

  it("retourne null si pas de points trouvés", () => {
    expect(extractPoints("garde appele pierre")).toBeNull();
  });

  it("ne capture pas '0 bout' comme points", () => {
    expect(extractPoints("garde 0 bout")).toBeNull();
  });

  it("ne capture pas '2 bouts' comme points", () => {
    expect(extractPoints("garde 2 bouts")).toBeNull();
  });
});

describe("extractPlayerReference", () => {
  const players = ["Pierre", "Jean", "Marie", "Paul"];

  it("trouve un match exact (insensible à la casse)", () => {
    expect(extractPlayerReference("appele pierre", players)).toBe("Pierre");
  });

  it("trouve via 'avec' comme mot-clé", () => {
    expect(extractPlayerReference("avec marie", players)).toBe("Marie");
  });

  it("trouve via 'appele' sans accent", () => {
    expect(extractPlayerReference("appele jean", players)).toBe("Jean");
  });

  it("trouve un match starts-with", () => {
    expect(extractPlayerReference("appele pier", ["Pierre", "Jean"])).toBe(
      "Pierre",
    );
  });

  it("retourne null si aucun joueur trouvé", () => {
    expect(extractPlayerReference("appele luc", players)).toBeNull();
  });

  it("retourne null si ambiguïté (plusieurs matchs starts-with)", () => {
    expect(
      extractPlayerReference("appele pa", ["Paul", "Pascal", "Marie"]),
    ).toBeNull();
  });

  it("préfère un match exact à un starts-with", () => {
    expect(extractPlayerReference("appele paul", ["Paul", "Pauline"])).toBe(
      "Paul",
    );
  });

  it("détecte 'seul' comme appel seul", () => {
    expect(extractPlayerReference("garde seul", players)).toBe("__self__");
  });

  it("reconnaît 'la plaie' comme misrecognition de 'l'appelé'", () => {
    expect(extractPlayerReference("la plaie pierre", players)).toBe("Pierre");
  });

  it("reconnaît 'la plait' comme misrecognition de 'l'appelé'", () => {
    expect(extractPlayerReference("la plait jean", players)).toBe("Jean");
  });

  it("reconnaît 'appeler' comme variante de 'appelé'", () => {
    expect(extractPlayerReference("appeler marie", players)).toBe("Marie");
  });

  it("trouve un match fuzzy (distance ≤ 2)", () => {
    expect(extractPlayerReference("appele sony", ["Sonny", "Jean"])).toBe("Sonny");
  });

  it("trouve un match fuzzy pour un nom mal reconnu", () => {
    expect(extractPlayerReference("avec mari", ["Marie", "Jean"])).toBe("Marie");
  });

  it("retourne null si le match fuzzy est ambiguë", () => {
    expect(extractPlayerReference("appele sony", ["Sonny", "Sonia"])).toBeNull();
  });

  it("normalise les accents des noms de joueurs pour la comparaison", () => {
    expect(extractPlayerReference("appele rene", ["René", "Paul"])).toBe("René");
  });

  it("trouve un match fuzzy pour 'mutchi' reconnu comme 'moutchi'", () => {
    expect(extractPlayerReference("appele moutchi", ["Mutchi", "Jean"])).toBe("Mutchi");
  });

  it("trouve un match fuzzy pour 'mutchi' reconnu comme 'mouchi'", () => {
    expect(extractPlayerReference("appele mouchi", ["Mutchi", "Jean"])).toBe("Mutchi");
  });
});

describe("extractOudlers", () => {
  it("extrait 'un bout' → 1", () => {
    expect(extractOudlers("un bout")).toBe(1);
  });

  it("extrait 'deux bouts' → 2", () => {
    expect(extractOudlers("deux bouts")).toBe(2);
  });

  it("extrait 'trois bouts' → 3", () => {
    expect(extractOudlers("trois bouts")).toBe(3);
  });

  it("extrait 'debout' comme misrecognition de 'deux bouts' → 2", () => {
    expect(extractOudlers("debout")).toBe(2);
  });

  it("extrait '3 bouts' (chiffre) → 3", () => {
    expect(extractOudlers("3 bouts")).toBe(3);
  });

  it("extrait '2 bouts' (chiffre) → 2", () => {
    expect(extractOudlers("2 bouts")).toBe(2);
  });

  it("extrait '3b' comme misrecognition de '3 bouts' → 3", () => {
    expect(extractOudlers("3b")).toBe(3);
  });

  it("extrait '2b' → 2", () => {
    expect(extractOudlers("2b")).toBe(2);
  });

  it("retourne null si pas d'oudlers", () => {
    expect(extractOudlers("garde 56 points")).toBeNull();
  });

  it("extrait 'zero bout' → 0", () => {
    expect(extractOudlers("zero bout")).toBe(0);
  });

  it("extrait '0 bout' → 0", () => {
    expect(extractOudlers("0 bout")).toBe(0);
  });

  it("extrait 'aucun bout' → 0", () => {
    expect(extractOudlers("aucun bout")).toBe(0);
  });

  it("extrait 'sans bout' → 0", () => {
    expect(extractOudlers("sans bout")).toBe(0);
  });

  it("extrait 'pas de bout' → 0", () => {
    expect(extractOudlers("pas de bout")).toBe(0);
  });

  it("rejette les valeurs hors limites", () => {
    expect(extractOudlers("4 bouts")).toBeNull();
  });
});

describe("extractBonuses", () => {
  it("détecte petit au bout", () => {
    const result = extractBonuses("petit au bout");
    expect(result.petitAuBout).toBe(true);
  });

  it("détecte poignée simple", () => {
    expect(extractBonuses("poignee simple").poignee).toBe(Poignee.Simple);
  });

  it("détecte poignée double", () => {
    expect(extractBonuses("double poignee").poignee).toBe(Poignee.Double);
  });

  it("détecte poignée triple", () => {
    expect(extractBonuses("triple poignee").poignee).toBe(Poignee.Triple);
  });

  it("'poignée' seul → simple par défaut", () => {
    expect(extractBonuses("poignee").poignee).toBe(Poignee.Simple);
  });

  it("détecte chelem annoncé", () => {
    expect(extractBonuses("chelem annonce").chelem).toBe(Chelem.AnnouncedWon);
  });

  it("détecte chelem non annoncé", () => {
    expect(extractBonuses("chelem non annonce").chelem).toBe(
      Chelem.NotAnnouncedWon,
    );
  });

  it("'chelem' seul → non annoncé gagné", () => {
    expect(extractBonuses("chelem").chelem).toBe(Chelem.NotAnnouncedWon);
  });

  it("détecte chelem annoncé perdu", () => {
    expect(extractBonuses("chelem annonce perdu").chelem).toBe(
      Chelem.AnnouncedLost,
    );
  });

  it("retourne des valeurs par défaut si aucun bonus", () => {
    const result = extractBonuses("garde 56 points");
    expect(result.petitAuBout).toBe(false);
    expect(result.poignee).toBe(Poignee.None);
    expect(result.chelem).toBe(Chelem.None);
  });

  it("détecte plusieurs bonus combinés", () => {
    const result = extractBonuses("petit au bout poignee double chelem");
    expect(result.petitAuBout).toBe(true);
    expect(result.poignee).toBe(Poignee.Double);
    expect(result.chelem).toBe(Chelem.NotAnnouncedWon);
  });
});

describe("parseVoiceScore", () => {
  const players = ["Pierre", "Jean", "Marie", "Paul"];

  it("parse une phrase complète", () => {
    const result = parseVoiceScore(
      "Garde, cinquante-six points, appelé Pierre, petit au bout",
      players,
    );
    expect(result.contract).toBe(Contract.Garde);
    expect(result.points).toBe(56);
    expect(result.playerName).toBe("Pierre");
    expect(result.petitAuBout).toBe(true);
  });

  it("parse avec des chiffres", () => {
    const result = parseVoiceScore("Petite 40 points avec Jean", players);
    expect(result.contract).toBe(Contract.Petite);
    expect(result.points).toBe(40);
    expect(result.playerName).toBe("Jean");
  });

  it("parse garde sans avec bonuses", () => {
    const result = parseVoiceScore(
      "Garde sans, 91 points, seul, chelem annoncé",
      players,
    );
    expect(result.contract).toBe(Contract.GardeSans);
    expect(result.points).toBe(91);
    expect(result.playerName).toBe("__self__");
    expect(result.chelem).toBe(Chelem.AnnouncedWon);
  });

  it("retourne un résultat partiel si reconnaissance incomplète", () => {
    const result = parseVoiceScore("Garde 56 points", players);
    expect(result.contract).toBe(Contract.Garde);
    expect(result.points).toBe(56);
    expect(result.playerName).toBeUndefined();
  });

  it("retourne un objet vide pour du garbage", () => {
    const result = parseVoiceScore("blah blah blah", players);
    expect(result.contract).toBeUndefined();
    expect(result.points).toBeUndefined();
    expect(result.playerName).toBeUndefined();
  });

  it("ne throw jamais", () => {
    expect(() => parseVoiceScore("", [])).not.toThrow();
    expect(() => parseVoiceScore("  ", [])).not.toThrow();
  });

  it("parse une phrase réaliste naturelle", () => {
    const result = parseVoiceScore(
      "euh donc garde contre, soixante-douze points, appelé Marie, poignée double",
      players,
    );
    expect(result.contract).toBe(Contract.GardeContre);
    expect(result.points).toBe(72);
    expect(result.playerName).toBe("Marie");
    expect(result.poignee).toBe(Poignee.Double);
  });

  it("parse avec tous les bonus", () => {
    const result = parseVoiceScore(
      "garde 56 points appele pierre petit au bout poignee triple chelem non annonce",
      players,
    );
    expect(result.contract).toBe(Contract.Garde);
    expect(result.points).toBe(56);
    expect(result.playerName).toBe("Pierre");
    expect(result.petitAuBout).toBe(true);
    expect(result.poignee).toBe(Poignee.Triple);
    expect(result.chelem).toBe(Chelem.NotAnnouncedWon);
  });

  it("n'inclut pas les bonus par défaut dans le résultat", () => {
    const result = parseVoiceScore("garde 56 points", players);
    expect(result.petitAuBout).toBeUndefined();
    expect(result.poignee).toBeUndefined();
    expect(result.chelem).toBeUndefined();
  });

  it("parse avec oudlers en mots", () => {
    const result = parseVoiceScore("garde 56 points deux bouts appelé Pierre", players);
    expect(result.points).toBe(56);
    expect(result.oudlers).toBe(2);
    expect(result.playerName).toBe("Pierre");
  });

  it("parse 'debout' comme deux bouts (misrecognition)", () => {
    const result = parseVoiceScore("garde 56 points debout appelé Pierre", players);
    expect(result.oudlers).toBe(2);
  });

  it("parse '3b' comme 3 bouts (misrecognition)", () => {
    const result = parseVoiceScore("garde 56 points 3b", players);
    expect(result.oudlers).toBe(3);
  });

  it("parse 'la plaie est' comme 'l'appelé est' (misrecognition)", () => {
    const result = parseVoiceScore("garde 56 points la plaie Pierre", players);
    expect(result.playerName).toBe("Pierre");
  });

  it("parse avec apostrophe dans l'appelé", () => {
    const result = parseVoiceScore("garde 56 points l'appelé Pierre", players);
    expect(result.playerName).toBe("Pierre");
  });

  it("parse '0 bout' comme oudlers sans confondre avec les points", () => {
    const result = parseVoiceScore("garde 56 points 0 bout appelé Pierre", players);
    expect(result.points).toBe(56);
    expect(result.oudlers).toBe(0);
  });

  it("parse 'zéro bout' comme 0 oudlers", () => {
    const result = parseVoiceScore("garde 56 points zéro bout appelé Pierre", players);
    expect(result.points).toBe(56);
    expect(result.oudlers).toBe(0);
  });
});
