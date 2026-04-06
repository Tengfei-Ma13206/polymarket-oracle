/**
 * Deterministic keyword extraction + synonym expansion.
 * No AI call required — pure heuristics over a curated domain map.
 */

const STOPWORDS = new Set([
  "will","the","a","an","is","are","be","to","in","of","and","or","for","on",
  "at","by","with","from","what","how","should","i","my","me","we","our","do",
  "does","did","can","could","would","there","it","this","that","they","now",
  "get","go","going","think","about","right","wrong","worried","curious","do",
  "about","safe","okay","fine","really","very","much","more","less","any","if",
  "when","where","who","which","has","have","had","been","being","am","was",
  "were","not","no","yes","just","then","than","so","but","up","out","over",
  "time","year","years","next","last","first","second","new","old","high","low",
  "big","small","good","bad","best","worst","likely","unlikely","possible",
  "chance","risk","danger","happen","happened","happening","soon","today",
  "tomorrow","week","month","quarter","half","percent","percent","impact",
  "effect","affect","mean","think","believe","feel","want","need","make",
  "take","give","keep","let","seem","look","turn","come","know","see","use",
  "try","ask","tell","show","put","set","hold","include","consider","start",
  "end","help","plan","work","change","move","place","point","number","large",
  "world","people","government","country","market","markets","price","prices",
  "situation","things","thing","something","nothing","everything","everyone",
  "someone","anyone","question","answer","reason","way","lot","bit","kind",
  "type","case","part","problem","issue","result","deal","major","current",
]);

// keyword → [search terms to use against Polymarket questions]
const SYNONYM_MAP: Record<string, string[]> = {
  // ── Geography ──
  japan:          ["japan", "japanese", "tokyo", "osaka", "yen", "jpy"],
  china:          ["china", "chinese", "beijing", "xi jinping", "ccp"],
  taiwan:         ["taiwan", "taiwanese", "strait"],
  russia:         ["russia", "russian", "moscow", "putin"],
  ukraine:        ["ukraine", "ukrainian", "kyiv", "zelensky"],
  iran:           ["iran", "iranian", "tehran", "irgc"],
  israel:         ["israel", "israeli", "netanyahu", "idf", "gaza"],
  gaza:           ["gaza", "hamas", "israel", "idf", "west bank", "palestin"],
  india:          ["india", "indian", "modi", "rupee", "inr"],
  korea:          ["korea", "korean", "seoul", "north korea", "dprk", "kim jong"],
  europe:         ["europe", "european", "eu", "nato", "ecb"],
  germany:        ["germany", "german", "berlin", "scholz", "bundestag"],
  france:         ["france", "french", "paris", "macron"],
  uk:             ["uk", "britain", "british", "london", "sunak", "labour"],
  canada:         ["canada", "canadian", "trudeau", "cad"],
  mexico:         ["mexico", "mexican", "peso", "mxn"],
  brazil:         ["brazil", "brazilian", "lula", "real"],
  australia:      ["australia", "australian", "aud", "reserve bank australia"],
  // ── US Politics ──
  trump:          ["trump", "donald trump", "maga", "republican", "gop"],
  election:       ["election", "vote", "voting", "ballot", "candidate", "midterm"],
  president:      ["president", "white house", "oval office", "administration"],
  congress:       ["congress", "senate", "house", "democrat", "republican"],
  biden:          ["biden", "joe biden"],
  harris:         ["harris", "kamala"],
  supreme:        ["supreme court", "scotus", "justice"],
  impeach:        ["impeach", "impeachment", "resign"],
  // ── Economics & Finance ──
  recession:      ["recession", "economic downturn", "gdp", "contraction"],
  inflation:      ["inflation", "cpi", "interest rate", "fed rate", "price"],
  fed:            ["federal reserve", "fed", "fomc", "interest rate", "jerome powell"],
  stocks:         ["stock market", "s&p", "nasdaq", "dow jones", "equity", "wall street"],
  crypto:         ["bitcoin", "btc", "ethereum", "eth", "crypto", "solana", "sol", "defi"],
  bitcoin:        ["bitcoin", "btc", "crypto", "satoshi", "lightning"],
  ethereum:       ["ethereum", "eth", "defi", "nft", "smart contract"],
  dollar:         ["dollar", "usd", "dxy", "federal reserve"],
  oil:            ["oil", "crude", "opec", "petroleum", "energy", "brent"],
  gold:           ["gold", "xau", "precious metal"],
  tariff:         ["tariff", "trade war", "trade deal", "import", "sanction"],
  debt:           ["debt", "deficit", "borrowing", "treasury", "fiscal"],
  ipo:            ["ipo", "listing", "public offering"],
  // ── Technology ──
  ai:             ["artificial intelligence", "ai", "llm", "openai", "chatgpt", "deepmind"],
  openai:         ["openai", "chatgpt", "gpt", "sam altman"],
  tech:           ["tech", "technology", "silicon valley", "startup", "big tech"],
  spacex:         ["spacex", "elon musk", "starship", "rocket", "nasa"],
  // ── Wars / Conflicts ──
  war:            ["war", "conflict", "military", "invasion", "attack", "strike", "troops"],
  nuclear:        ["nuclear", "nuke", "missile", "warhead", "bomb", "radiation"],
  nato:           ["nato", "alliance", "troops", "article 5"],
  ceasefire:      ["ceasefire", "peace", "truce", "negotiation", "agreement"],
  // ── Natural Disasters / Climate ──
  earthquake:     ["earthquake", "seismic", "tsunami", "richter", "magnitude"],
  hurricane:      ["hurricane", "typhoon", "cyclone", "tropical storm"],
  climate:        ["climate", "global warming", "carbon", "emissions", "temperature"],
  flood:          ["flood", "flooding", "rainfall", "disaster"],
  wildfire:       ["wildfire", "fire", "drought"],
  // ── Sports ──
  worldcup:       ["world cup", "fifa", "soccer", "football"],
  olympics:       ["olympics", "olympic games", "medal"],
  nfl:            ["nfl", "super bowl", "football", "quarterback"],
  nba:            ["nba", "basketball", "finals"],
  sports:         ["sports", "championship", "title", "league"],
  // ── Health / Medicine ──
  pandemic:       ["pandemic", "epidemic", "virus", "outbreak", "covid", "vaccine"],
  covid:          ["covid", "coronavirus", "pandemic", "variant", "vaccine"],
  cancer:         ["cancer", "tumor", "treatment", "fda"],
  drug:           ["drug", "fda approval", "pharmaceutical", "medicine", "clinical trial"],
  // ── Entertainment / Culture ──
  oscars:         ["oscars", "academy awards", "film", "movie"],
  grammy:         ["grammy", "music", "album", "artist"],
  celebrity:      ["celebrity", "taylor swift", "beyonce", "rapper"],
  // ── Travel ──
  travel:         ["travel", "tourism", "visa", "flight", "airline", "border"],
  airline:        ["airline", "flight", "aviation", "airport"],
};

export function extractKeywords(question: string): string[] {
  const tokens = question
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));

  // Also try bigrams
  const words = question.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/);
  const bigrams: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    bigrams.push(`${words[i]} ${words[i + 1]}`);
  }

  return [...new Set([...tokens, ...bigrams])];
}

export function expandKeywords(keywords: string[]): Map<string, number> {
  const expanded = new Map<string, number>();

  for (const kw of keywords) {
    // Direct match: high weight
    expanded.set(kw, (expanded.get(kw) ?? 0) + 2.0);

    // Synonym expansion
    for (const [canonical, synonyms] of Object.entries(SYNONYM_MAP)) {
      if (kw === canonical || synonyms.some((s) => s.includes(kw) || kw.includes(s))) {
        for (const syn of synonyms) {
          expanded.set(syn, (expanded.get(syn) ?? 0) + 1.0);
        }
        break;
      }
    }
  }

  return expanded;
}

export function scoreMarket(
  question: string,
  description: string,
  expandedTerms: Map<string, number>
): number {
  const text = `${question} ${description}`.toLowerCase();
  let score = 0;
  for (const [term, weight] of expandedTerms) {
    if (text.includes(term)) score += weight;
  }
  return score;
}
