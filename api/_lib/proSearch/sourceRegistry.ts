export type ProSearchCategory =
  | "math"
  | "code"
  | "news"
  | "facts"
  | "local_bd"
  | "weather"
  | "health"
  | "education"
  | "howto";

export type ProSearchTier = "primary" | "secondary" | "tertiary";

export interface ProSearchSource {
  domain: string;
  label: string;
  note: string;
}

export interface ProSearchCategorySources {
  primary: ProSearchSource[];
  secondary: ProSearchSource[];
  tertiary: ProSearchSource[];
  pureModelFallback: string[];
}

export const PRO_SEARCH_SOURCE_REGISTRY: Record<
  ProSearchCategory,
  ProSearchCategorySources
> = {
  math: {
    primary: [
      { domain: "rgmia.org", label: "RGMIA", note: "PDF proofs" },
      {
        domain: "math.cmu.edu",
        label: "CMU Math",
        note: "Olympiad inequalities",
      },
      {
        domain: "artofproblemsolving.com",
        label: "AoPS",
        note: "Forum solutions",
      },
      {
        domain: "proofwiki.org",
        label: "ProofWiki",
        note: "Formal theorem statements",
      },
      {
        domain: "physicsforums.com",
        label: "Physics Forums",
        note: "Step-by-step discussions",
      },
    ],
    secondary: [
      {
        domain: "math.stackexchange.com",
        label: "Math StackExchange",
        note: "Accepted answers and comments",
      },
      {
        domain: "mathoverflow.net",
        label: "MathOverflow",
        note: "Research-level discussion",
      },
      {
        domain: "cut-the-knot.org",
        label: "Cut the Knot",
        note: "Classic inequalities",
      },
      {
        domain: "planetmath.org",
        label: "PlanetMath",
        note: "Theorem database",
      },
      {
        domain: "mathlinks.ro",
        label: "MathLinks",
        note: "Archived forum threads",
      },
    ],
    tertiary: [
      {
        domain: "scholar.google.com",
        label: "Google Scholar",
        note: "Academic paper search",
      },
      { domain: "arxiv.org", label: "arXiv", note: "Research PDFs" },
      {
        domain: "brilliant.org",
        label: "Brilliant",
        note: "Explained proofs",
      },
      {
        domain: "intmath.com",
        label: "IntMath",
        note: "Interactive explanations",
      },
      {
        domain: "youtube.com",
        label: "YouTube",
        note: "Transcript fallback",
      },
    ],
    pureModelFallback: [
      "abc=1 -> use substitution like bc=1/a where useful",
      "cyclic sum -> try Cauchy-Schwarz or Titu's lemma",
      "constant lower bound -> try AM-GM, Jensen, Holder, uvw",
      "always test equality at a=b=c",
      "do a quick numerical sanity check before final answer",
    ],
  },

  code: {
    primary: [
      {
        domain: "docs.python.org",
        label: "Python Docs",
        note: "Official Python documentation",
      },
      {
        domain: "stackoverflow.com",
        label: "Stack Overflow",
        note: "Top voted answers",
      },
      { domain: "github.com", label: "GitHub", note: "Working repositories" },
    ],
    secondary: [
      {
        domain: "geeksforgeeks.org",
        label: "GeeksforGeeks",
        note: "Algorithms and implementations",
      },
      { domain: "leetcode.com", label: "LeetCode", note: "Problem patterns" },
      {
        domain: "w3schools.com",
        label: "W3Schools",
        note: "Beginner-friendly docs",
      },
    ],
    tertiary: [
      { domain: "medium.com", label: "Medium", note: "Blog implementations" },
      { domain: "dev.to", label: "dev.to", note: "Community posts" },
      {
        domain: "reddit.com",
        label: "Reddit",
        note: "Developer discussions",
      },
    ],
    pureModelFallback: [
      "prefer standard library first",
      "prefer official syntax and minimal code",
      "explain complexity only if needed",
      "give working example and edge-case note",
    ],
  },

  news: {
    primary: [
      { domain: "bbc.com", label: "BBC", note: "Global coverage" },
      { domain: "reuters.com", label: "Reuters", note: "Breaking news" },
      { domain: "aljazeera.com", label: "Al Jazeera", note: "Asia focus" },
    ],
    secondary: [
      { domain: "apnews.com", label: "AP News", note: "Fast wire coverage" },
      { domain: "theguardian.com", label: "The Guardian", note: "Analysis" },
      { domain: "nytimes.com", label: "NYTimes", note: "In-depth reporting" },
    ],
    tertiary: [
      { domain: "x.com", label: "X", note: "Real-time updates" },
      {
        domain: "facebook.com",
        label: "Facebook",
        note: "Local/community signal",
      },
      { domain: "reddit.com", label: "Reddit", note: "Community discussion" },
    ],
    pureModelFallback: [
      "never invent current news",
      "if no strong source, say current verification not available",
      "prefer timeline summary over speculation",
    ],
  },

  facts: {
    primary: [
      { domain: "wikipedia.org", label: "Wikipedia", note: "Overview" },
      { domain: "worldbank.org", label: "World Bank", note: "Official stats" },
      { domain: ".gov", label: "Gov sites", note: "Government data" },
    ],
    secondary: [
      { domain: "statista.com", label: "Statista", note: "Charts and estimates" },
      { domain: "britannica.com", label: "Britannica", note: "Encyclopedia" },
      { domain: "un.org", label: "United Nations", note: "Global reports" },
    ],
    tertiary: [
      { domain: "census.gov", label: "Census", note: "Raw population data" },
      { domain: "pewresearch.org", label: "Pew Research", note: "Surveys" },
      { domain: "gapminder.org", label: "Gapminder", note: "Visualizations" },
    ],
    pureModelFallback: [
      "separate stable facts from changing facts",
      "for changing facts, avoid certainty without source",
      "cross-check number ranges before final answer",
    ],
  },

  local_bd: {
    primary: [
      {
        domain: "thedailystar.net",
        label: "The Daily Star",
        note: "English news",
      },
      {
        domain: "prothomalo.com",
        label: "Prothom Alo",
        note: "Bangla news",
      },
      { domain: "bmd.gov.bd", label: "BMD", note: "Weather and govt data" },
    ],
    secondary: [
      { domain: "bbs.gov.bd", label: "BBS", note: "Statistics" },
      { domain: "buet.ac.bd", label: "BUET", note: "University info" },
      { domain: "dhaka.gov.bd", label: "Dhaka Gov", note: "Local govt info" },
    ],
    tertiary: [
      {
        domain: "facebook.com",
        label: "Facebook Groups",
        note: "Community updates",
      },
      {
        domain: "banglanews24.com",
        label: "BanglaNews24",
        note: "Regional coverage",
      },
      { domain: "somoynews.tv", label: "Somoy", note: "Live updates" },
    ],
    pureModelFallback: [
      "prefer official Bangladesh sources",
      "for local changing info, avoid guessing",
      "if uncertain, ask for district/city only when necessary",
    ],
  },

  weather: {
    primary: [
      {
        domain: "accuweather.com",
        label: "AccuWeather",
        note: "Current and forecast",
      },
      {
        domain: "bmd.gov.bd",
        label: "BMD",
        note: "Bangladesh official weather",
      },
      {
        domain: "weather.com",
        label: "Weather.com",
        note: "Detailed forecast",
      },
    ],
    secondary: [
      {
        domain: "openweathermap.org",
        label: "OpenWeatherMap",
        note: "API weather data",
      },
    ],
    tertiary: [],
    pureModelFallback: [
      "never invent current weather",
      "if live data missing, clearly say unable to verify current forecast",
    ],
  },

  health: {
    primary: [
      {
        domain: "mayoclinic.org",
        label: "Mayo Clinic",
        note: "Verified medical guidance",
      },
      {
        domain: "nih.gov",
        label: "NIH",
        note: "Research and public health",
      },
      { domain: "webmd.com", label: "WebMD", note: "Symptoms overview" },
    ],
    secondary: [
      {
        domain: "healthline.com",
        label: "Healthline",
        note: "Readable explanations",
      },
    ],
    tertiary: [],
    pureModelFallback: [
      "be conservative",
      "do not diagnose",
      "prefer symptom overview and when to seek professional help",
    ],
  },

  education: {
    primary: [
      {
        domain: "buet.ac.bd",
        label: "BUET",
        note: "Official admission info",
      },
      {
        domain: "prothomalo.com",
        label: "Prothom Alo",
        note: "Education coverage",
      },
      {
        domain: "thedailystar.net",
        label: "The Daily Star",
        note: "Education analysis",
      },
    ],
    secondary: [
      {
        domain: "facebook.com",
        label: "Student Groups",
        note: "Community updates",
      },
    ],
    tertiary: [],
    pureModelFallback: [
      "prefer official admission circulars",
      "do not state deadlines unless verified",
    ],
  },

  howto: {
    primary: [
      {
        domain: "support.microsoft.com",
        label: "Microsoft Support",
        note: "Official guides",
      },
      {
        domain: "support.apple.com",
        label: "Apple Support",
        note: "Official guides",
      },
      {
        domain: "support.google.com",
        label: "Google Support",
        note: "Official guides",
      },
    ],
    secondary: [
      {
        domain: "reddit.com",
        label: "Reddit Tech Support",
        note: "Community fixes",
      },
      {
        domain: "tomshardware.com",
        label: "Tom's Hardware",
        note: "Hardware advice",
      },
      {
        domain: "wikihow.com",
        label: "wikiHow",
        note: "Step-by-step guides",
      },
    ],
    tertiary: [
      { domain: "youtube.com", label: "YouTube", note: "Visual walkthroughs" },
    ],
    pureModelFallback: [
      "start with safest fix first",
      "prefer reversible steps",
      "avoid risky system-level steps unless necessary",
    ],
  },
};

export const PRO_SEARCH_TIER_ORDER: ProSearchTier[] = [
  "primary",
  "secondary",
  "tertiary",
];

export const PRO_SEARCH_EARLY_EXIT_TARGETS = {
  primary: 0.9,
  secondary: 0.98,
  tertiary: 1,
} as const;

export const PRO_SEARCH_TOKEN_BUDGET = {
  totalTpm: 140_000,
  tierPromptMax: 400,
  maxTiersPerRun: 3,
  averageTotalPerSearch: 1_200,
} as const;

export const getSourcesForCategory = (
  category: ProSearchCategory
): ProSearchCategorySources => {
  return PRO_SEARCH_SOURCE_REGISTRY[category];
};
