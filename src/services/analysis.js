const STOPWORDS = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with','by',
  'from','is','it','this','that','was','are','be','have','has','had','do','does',
  'did','will','would','could','should','my','your','his','her','its','our',
  'their','what','which','who','when','where','why','how','all','each','both',
  'few','more','most','other','some','such','than','then','there','these','they',
  'im','ive','its','were','been','also','very','really','so','if','not','no',
  'yes','up','out','about','into','through','before','after','any','me','him',
  'we','you','i','he','she','us','them','one','two','new','old','long','own',
  'right','big','high','low','next','now','here','ever','still','well','back',
  'even','much','only','since','going','come','look','know','make','see','use',
  'try','get','got','put','feel','feels','want','need','day','time','year',
  'week','ago','today','bought','buy','buying','purchase','sample','full',
  'bottle','bottles','ml','oz','spray','decant','blind','just','pretty',
  'really','like','love','great','good','nice','amazing','best','think','bit',
  'lot','way','thing','things','first','last','over','under','again','same',
  'can','would','been','has','had','dont','doesnt','wont','cant','isnt',
  'wasnt','arent','havent','didnt','couldnt','wouldnt','shouldnt',
  'anyone','someone','everyone','something','anything','everything','nothing',
  'always','never','often','sometimes','usually','already','probably',
  'different','similar','another','others','here','there','however','actually',
  'basically','literally','especially','definitely','probably','personally',
  // common Reddit filler
  'too','ask','tell','post','posts','comment','comments','question','questions',
  'anyone','people','person','guys','everyone','somebody','nobody',
  'yeah','yea','yep','nah','nope','hey','ok','okay','sure','maybe','kinda',
  'sorta','gonna','gotta','wanna','imo','tbh','afaik','fwiw','iirc','lol',
  'lmao','omg','wtf','imo','ngl','idk','etc','tho','tho','though','cause',
  'because','since','while','when','where','just','also','even','still',
  'already','always','never','often','sometimes','usually','let','know',
  'think','say','said','says','told','ask','asked','want','wanted','needs',
  'needed','make','made','made','take','took','give','gave','see','seen','saw',
  'come','came','coming','going','went','gone','getting','got','get','put',
  'set','find','found','found','keep','kept','start','started','stop','stopped',
  'help','helped','show','showed','shown','try','tried','trying','seem','seems',
  'feel','felt','feeling','looks','looking','looked','sounds','sounding',
  'work','worked','working','works','use','used','using','used',
  // html/url artifacts from RSS content
  'https','http','www','com','reddit','submitted','link','comments','span',
  'strong','div','href','class','html','off','sc_off','sc_on','p','br','ul','li',
  'html32','amp','quot','nbsp',
]);

export const BRANDS = [
  { name: 'Chanel', terms: ['chanel','no5','no 5','bleu de chanel','chance','coco mademoiselle','allure','gabrielle'] },
  { name: 'Dior', terms: ['dior','sauvage','fahrenheit','jadore','j\'adore','miss dior','homme','poison'] },
  { name: 'Tom Ford', terms: ['tom ford','tobacco vanille','oud wood','lost cherry','black orchid','fucking fabulous','rose prick','soleil blanc','café rose','neroli portofino'] },
  { name: 'Creed', terms: ['creed','aventus','green irish','silver mountain','viking','millesime imperial','royal oud','bois du portugal'] },
  { name: 'Amouage', terms: ['amouage','interlude','jubilation','reflection','epic','memoir','lyric','guidance','dia','honour'] },
  { name: 'Parfums de Marly', terms: ['parfums de marly','marly','pegasus','layton','herod','percival','sedley','habdan','oriana','delina'] },
  { name: 'MFK / Kurkdjian', terms: ['maison francis kurkdjian','mfk','kurkdjian','baccarat rouge','br540','oud satin mood','aqua universalis','grand soir','gentle fluidity'] },
  { name: 'Byredo', terms: ['byredo','bal d\'afrique','gypsy water','mojave ghost','super cedar','bibliothèque','bibliothek','rose of no man'] },
  { name: 'Diptyque', terms: ['diptyque','do son','eau rose','philosykos','tam dao','tempo','orpheon','l\'ombre dans l\'eau'] },
  { name: 'Xerjoff', terms: ['xerjoff','naxos','alexandria','casamorati','oud stars','muse','lira'] },
  { name: 'Initio', terms: ['initio','oud for greatness','rehab','addictive vibration','atomic rose','side effect','psychedelic love'] },
  { name: 'Roja Dove', terms: ['roja dove','roja','elysium','enigma','aoud','scandal','amber aoud','haute luxe'] },
  { name: 'Maison Margiela', terms: ['maison margiela','replica','jazz club','beach walk','by the fireplace','at the barber','lazy sunday','flower market'] },
  { name: 'Jo Malone', terms: ['jo malone','peony blush','wood sage','lime basil','myrrh tonka','velvet rose','english pear','blackberry bay'] },
  { name: 'Acqua di Parma', terms: ['acqua di parma','colonia','blu mediterraneo','barbiere','magnolia nobile'] },
  { name: 'Guerlain', terms: ['guerlain','shalimar','la petite robe','mon guerlain','bee bottle','l\'homme ideal','habit rouge'] },
  { name: 'YSL / Saint Laurent', terms: ['ysl','saint laurent','black opium','libre edp','myslf','la nuit de l\'homme','kouros','yves saint'] },
  { name: 'Armani', terms: ['armani','acqua di gio','si','stronger with you','code','emporio','prive','my way'] },
  { name: 'Prada', terms: ['prada','la femme','l\'homme','infusion','candy','amber pour homme','iris'] },
  { name: 'Versace', terms: ['versace','eros','bright crystal','dylan blue','pour homme','crystal noir'] },
  { name: 'Lattafa', terms: ['lattafa','bade\'e al oud','khamrah','asad','oud mood','fakhar','raghba','ana abiyedh'] },
  { name: 'Mancera', terms: ['mancera','cedrat boise','red tobacco','instant crush','aoud lime','roses and chocolate','wild fruits'] },
  { name: 'Montale', terms: ['montale','black aoud','roses musk','intense cafe','honey aoud','aoud forest','dark vanilla'] },
  { name: 'Nishane', terms: ['nishane','hacivat','wulong cha','ambra calabria','unutamam','fan your flames'] },
  { name: 'Hugo Boss', terms: ['hugo boss','boss bottled','boss the scent','boss alive','hugo boss deep red'] },
  { name: 'Davidoff', terms: ['davidoff','cool water','zino','good life','champion'] },
  { name: 'Azzaro', terms: ['azzaro','chrome','wanted','pour homme'] },
  { name: 'Mont Blanc', terms: ['mont blanc','montblanc','legend','explorer','individuel','emblem'] },
  { name: 'Bvlgari', terms: ['bvlgari','bulgari','man in black bvlgari','aqva pour homme','omnia crystalline','serpenti bvlgari'] },
];

const FRAGRANCE_TERMS = [
  'sillage','longevity','projection','reformulation','reformulated','EdP','EdT','EdC','parfum',
  'niche','designer','blind buy','decant','sample','split','sotd','wdyt','haul',
  'citrus','woody','floral','oriental','gourmand','fresh','aquatic','chypre','fougere',
  'oud','musk','amber','vanilla','sandalwood','vetiver','patchouli','bergamot',
  'rose','jasmine','iris','neroli','tuberose','ylang','cedarwood','incense','leather',
  'tobacco','coffee','chocolate','smoke','spicy','pepper','cardamom','cumin',
  'sweet','dry','powdery','green','earthy','animalic','synthetic','natural',
  'warm','cool','summer','winter','spring','fall','seasons','office','date night','casual',
  'compliments','versatile','unique','clone','dupe','similar','alternative',
  'opening','heart','base','notes','dry down','skin chemistry','longevity',
];

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/'/g, '')          // strip apostrophes so it's→its, i'm→im, don't→dont
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map(w => w.replace(/^-+|-+$/g, ''))
    .filter(w => w.length > 2 && !STOPWORDS.has(w));
}

function itemText(item) {
  return `${item.title || ''} ${item.selftext || ''}`;
}

export function extractKeywords(posts, topN = 25) {
  const freq = {};
  for (const post of posts) {
    for (const token of tokenize(itemText(post))) {
      freq[token] = (freq[token] || 0) + 1;
    }
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word, count]) => ({ word, count }));
}

export function extractBrandMentions(posts) {
  const counts = {};
  for (const brand of BRANDS) counts[brand.name] = 0;

  for (const post of posts) {
    const text = `${post.title} ${post.selftext || ''} ${post.link_flair_text || ''}`.toLowerCase();
    for (const brand of BRANDS) {
      if (brand.terms.some(t => text.includes(t))) {
        counts[brand.name]++;
      }
    }
  }

  return Object.entries(counts)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([brand, count]) => ({ brand, count }));
}

export function extractFragranceTerms(posts, topN = 20) {
  const termSet = new Set(FRAGRANCE_TERMS.map(t => t.toLowerCase()));
  const freq = {};

  for (const post of posts) {
    const text = `${post.title} ${post.selftext || ''}`.toLowerCase();
    for (const term of termSet) {
      if (text.includes(term)) {
        freq[term] = (freq[term] || 0) + 1;
      }
    }
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([term, count]) => ({ term, count }));
}

export function extractBigrams(posts, topN = 15) {
  const freq = {};
  for (const post of posts) {
    const tokens = tokenize(`${post.title} ${post.selftext || ''}`);
    for (let i = 0; i < tokens.length - 1; i++) {
      const [a, b] = [tokens[i], tokens[i + 1]];
      if (a.length < 3 || b.length < 3) continue;
      const bigram = `${a} ${b}`;
      freq[bigram] = (freq[bigram] || 0) + 1;
    }
  }
  return Object.entries(freq)
    .filter(([, v]) => v > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([phrase, count]) => ({ phrase, count }));
}

const NOTE_FAMILIES = {
  'Gourmand': ['vanilla','chocolate','coffee','caramel','honey','almond','biscuit','sweet cream'],
  'Woody / Oud': ['sandalwood','cedar','vetiver','oud','woody','patchouli','birch','agarwood'],
  'Floral': ['rose','jasmine','iris','tuberose','neroli','violet','lily','peony','gardenia'],
  'Fresh / Citrus': ['bergamot','citrus','lemon','grapefruit','orange','aquatic','marine','clean','green'],
  'Oriental / Spicy': ['amber','incense','spice','spicy','pepper','cardamom','cinnamon','tobacco','myrrh'],
  'Musk / Skin': ['musk','ambroxan','skin','warm skin','sensual','powdery','musky'],
  'Leather / Dark': ['leather','smoke','smoky','dark','animalic','tar','earthy','rubber'],
};

export function extractDescriptors(posts) {
  const counts = Object.fromEntries(Object.keys(NOTE_FAMILIES).map(k => [k, 0]));
  for (const post of posts) {
    const text = `${post.title} ${post.selftext || ''}`.toLowerCase();
    for (const [family, terms] of Object.entries(NOTE_FAMILIES)) {
      if (terms.some(t => text.includes(t))) counts[family]++;
    }
  }
  return Object.entries(counts)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([family, count]) => ({ family, count }));
}

export function extractVolumeByDay(posts) {
  const now = Date.now() / 1000;
  const buckets = Array.from({ length: 7 }, (_, i) => ({
    label: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : `${i}d ago`,
    daysAgo: i,
    posts: 0,
  }));
  for (const post of posts) {
    const daysAgo = Math.floor((now - post.created_utc) / 86400);
    if (daysAgo >= 0 && daysAgo < 7) buckets[daysAgo].posts++;
  }
  return buckets.reverse();
}

const POSITIVE_WORDS = [
  'love','amazing','beautiful','best','incredible','stunning','perfect','wonderful',
  'obsessed','excellent','masterpiece','addictive','unique','compliments','favorite',
  'recommend','elegant','luxurious','worth','underrated','hidden gem','blind buy',
];
const NEGATIVE_WORDS = [
  'reformulated','reformulation','weak','disappointing','overhyped','synthetic','regret',
  'hate','awful','terrible','overpriced','fake','harsh','headache','cloying','scrubber',
  'avoid','generic','boring','cheap','watered down','discontinued',
];

export function extractSentiment(posts) {
  let positive = 0, negative = 0;
  for (const post of posts) {
    const text = `${post.title} ${post.selftext || ''}`.toLowerCase();
    for (const w of POSITIVE_WORDS) if (text.includes(w)) positive++;
    for (const w of NEGATIVE_WORDS) if (text.includes(w)) negative++;
  }
  const total = positive + negative || 1;
  return {
    positive,
    negative,
    positivePercent: Math.round((positive / total) * 100),
    negativePercent: Math.round((negative / total) * 100),
  };
}

export const FRAGRANCES = [
  // Creed
  { name: 'Aventus', terms: ['aventus'] },
  { name: 'Green Irish Tweed', terms: ['green irish tweed'] },
  { name: 'Silver Mountain Water', terms: ['silver mountain water'] },
  { name: 'Viking (Creed)', terms: ['creed viking', 'viking creed'] },
  { name: 'Millesime Imperial', terms: ['millesime imperial'] },
  // Tom Ford
  { name: 'Tobacco Vanille', terms: ['tobacco vanille'] },
  { name: 'Oud Wood', terms: ['oud wood'] },
  { name: 'Lost Cherry', terms: ['lost cherry'] },
  { name: 'Black Orchid', terms: ['black orchid'] },
  { name: 'Fucking Fabulous', terms: ['fucking fabulous'] },
  { name: 'Soleil Blanc', terms: ['soleil blanc'] },
  { name: 'Neroli Portofino', terms: ['neroli portofino'] },
  { name: 'Rose Prick', terms: ['rose prick'] },
  // MFK / Kurkdjian
  { name: 'Baccarat Rouge 540', terms: ['baccarat rouge', 'br540', 'br 540'] },
  { name: 'Oud Satin Mood', terms: ['oud satin mood'] },
  { name: 'Grand Soir', terms: ['grand soir'] },
  { name: 'Gentle Fluidity', terms: ['gentle fluidity'] },
  { name: 'Aqua Universalis', terms: ['aqua universalis'] },
  // Chanel
  { name: 'Bleu de Chanel', terms: ['bleu de chanel'] },
  { name: 'Chanel No. 5', terms: ['chanel no 5', 'chanel no5'] },
  { name: 'Coco Mademoiselle', terms: ['coco mademoiselle'] },
  { name: 'Chance (Chanel)', terms: ['chanel chance', 'chance eau tendre', 'chance eau fraiche'] },
  { name: 'Gabrielle (Chanel)', terms: ['gabrielle chanel', 'chanel gabrielle'] },
  // Dior
  { name: 'Sauvage', terms: ['sauvage'] },
  { name: "J'adore", terms: ['jadore', "j'adore"] },
  { name: 'Miss Dior', terms: ['miss dior'] },
  { name: 'Fahrenheit', terms: ['fahrenheit dior', 'dior fahrenheit'] },
  { name: 'Dior Homme', terms: ['dior homme'] },
  // YSL
  { name: 'Black Opium', terms: ['black opium'] },
  { name: 'Libre (YSL)', terms: ['ysl libre', 'libre edp', 'libre ysl', 'libre parfum'] },
  { name: 'MYSLF', terms: ['myslf'] },
  { name: "La Nuit de L'Homme", terms: ["la nuit de l'homme", 'la nuit de lhomme'] },
  // Armani
  { name: 'Acqua di Giò', terms: ['acqua di gio', 'acqua di giò'] },
  { name: 'Stronger With You', terms: ['stronger with you'] },
  { name: 'My Way (Armani)', terms: ['my way armani', 'armani my way'] },
  { name: 'Armani Code', terms: ['armani code', 'code absolu'] },
  // Parfums de Marly
  { name: 'Layton', terms: ['layton'] },
  { name: 'Pegasus', terms: ['pegasus'] },
  { name: 'Herod', terms: ['herod'] },
  { name: 'Delina', terms: ['delina'] },
  { name: 'Percival', terms: ['percival'] },
  { name: 'Oriana', terms: ['oriana marly', 'marly oriana'] },
  // Maison Margiela Replica
  { name: 'Jazz Club', terms: ['jazz club'] },
  { name: 'Beach Walk', terms: ['beach walk'] },
  { name: 'By the Fireplace', terms: ['by the fireplace'] },
  { name: 'Lazy Sunday Morning', terms: ['lazy sunday morning', 'lazy sunday'] },
  { name: 'Flower Market', terms: ['flower market replica'] },
  // Byredo
  { name: "Bal d'Afrique", terms: ["bal d'afrique", 'bal dafrique'] },
  { name: 'Mojave Ghost', terms: ['mojave ghost'] },
  { name: 'Gypsy Water', terms: ['gypsy water'] },
  // Jo Malone
  { name: 'Wood Sage & Sea Salt', terms: ['wood sage sea salt', 'wood sage'] },
  { name: 'Peony & Blush Suede', terms: ['peony blush', 'peony suede'] },
  // Amouage
  { name: 'Interlude (Amouage)', terms: ['interlude man', 'amouage interlude'] },
  { name: 'Reflection (Amouage)', terms: ['amouage reflection'] },
  { name: 'Jubilation (Amouage)', terms: ['amouage jubilation'] },
  // Nishane
  { name: 'Hacivat', terms: ['hacivat'] },
  { name: 'Wulong Cha', terms: ['wulong cha'] },
  { name: 'Fan Your Flames', terms: ['fan your flames'] },
  // Initio
  { name: 'Oud for Greatness', terms: ['oud for greatness'] },
  { name: 'Side Effect (Initio)', terms: ['initio side effect', 'side effect initio'] },
  // Xerjoff
  { name: 'Naxos', terms: ['naxos'] },
  { name: 'Alexandria II', terms: ['alexandria ii', 'xerjoff alexandria'] },
  // Lattafa
  { name: 'Khamrah', terms: ['khamrah'] },
  { name: 'Badee Al Oud', terms: ['badee al oud', "bade'e al oud"] },
  // Armaf
  { name: 'Club de Nuit Intense', terms: ['club de nuit intense', 'cdni', 'cdn intense'] },
  // Paco Rabanne
  { name: '1 Million', terms: ['1 million paco', 'paco 1 million', 'un million'] },
  { name: 'Invictus', terms: ['invictus'] },
  // Viktor & Rolf
  { name: 'Flowerbomb', terms: ['flowerbomb'] },
  // Mugler
  { name: 'Angel (Mugler)', terms: ['mugler angel', 'angel mugler'] },
  { name: 'Alien (Mugler)', terms: ['mugler alien', 'alien mugler'] },
  // Versace
  { name: 'Eros (Versace)', terms: ['versace eros', 'eros versace', 'eros edt', 'eros edp'] },
  { name: 'Dylan Blue', terms: ['dylan blue'] },
  // Davidoff
  { name: 'Cool Water', terms: ['cool water'] },
  // Mancera
  { name: 'Cedrat Boisé', terms: ['cedrat boise'] },
  { name: 'Red Tobacco', terms: ['red tobacco'] },
  // Montale
  { name: 'Intense Café', terms: ['intense cafe', 'intense café'] },
  // Mont Blanc
  { name: 'Explorer (Mont Blanc)', terms: ['mont blanc explorer', 'montblanc explorer'] },
  { name: 'Legend (Mont Blanc)', terms: ['mont blanc legend', 'montblanc legend'] },
  // Guerlain
  { name: 'Shalimar', terms: ['shalimar'] },
  // Dolce & Gabbana
  { name: 'Light Blue (D&G)', terms: ['light blue dolce', 'd&g light blue', 'dolce light blue'] },
  { name: 'The One (D&G)', terms: ['the one dolce', 'd&g the one', 'dolce the one'] },
  // Diptyque
  { name: 'Philosykos', terms: ['philosykos'] },
  { name: 'Do Son', terms: ['do son diptyque'] },
]

export function extractFragranceMentions(posts, topN = 20) {
  const counts = {}
  for (const post of posts) {
    const text = `${post.title} ${post.selftext || ''}`.toLowerCase()
    for (const frag of FRAGRANCES) {
      if (frag.terms.some(t => text.includes(t))) {
        counts[frag.name] = (counts[frag.name] || 0) + 1
      }
    }
  }
  return Object.entries(counts)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([fragrance, count]) => ({ fragrance, count }))
}

export function getStats(posts) {
  if (!posts.length) return { total: 0, avgScore: 0, topPost: null, topSubreddit: null, hasScores: false };

  const hasScores = posts.some(p => p.score > 0);
  const avgScore = hasScores ? Math.round(posts.reduce((s, p) => s + p.score, 0) / posts.length) : 0;
  const topPost = hasScores ? posts.reduce((a, b) => (b.score > a.score ? b : a)) : posts[0];
  const subCounts = {};
  for (const p of posts) subCounts[p.subreddit] = (subCounts[p.subreddit] || 0) + 1;
  const topSubreddit = Object.entries(subCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  return { total: posts.length, avgScore, topPost, topSubreddit, hasScores };
}

// Combine posts + comments for richer analysis
export function mergeTexts(posts, comments) {
  return [...posts, ...comments.map(c => ({ title: c.selftext || c.title, selftext: '' }))];
}

export const DUPE_BRANDS = [
  { name: 'Armaf', terms: ['armaf', 'club de nuit', 'cdn intense', 'tres nuit'] },
  { name: 'Alt. Fragrances', terms: ['alt fragrances', 'alt fragrance', 'alt.'] },
  { name: 'Dua Fragrances', terms: ['dua fragrances', 'dua fragrance'] },
  { name: 'Fragrance One', terms: ['fragrance one', 'office for men by fragrance'] },
  { name: 'Rasasi', terms: ['rasasi', 'la yuqawam', 'hawas'] },
  { name: 'Alexandria Fragrances', terms: ['alexandria fragrances'] },
  { name: 'Afnan', terms: ['afnan', '9pm afnan', '9 pm afnan'] },
  { name: 'Al Haramain', terms: ['al haramain', 'amber oud al haramain'] },
  { name: 'Pendora', terms: ['pendora', 'paris corner'] },
  { name: 'Aldi / Lidl', terms: ['aldi fragrance', 'lidl fragrance', 'aldor', 'clique'] },
]

const DUPE_KEYWORDS = ['dupe', ' clone ', 'inspired by', 'alternative to', 'knockoff', 'knock off', 'budget version', 'cheaper alternative', 'smells like', 'similar to', 'copy of']

export function extractDupePosts(posts) {
  return posts.filter(p => {
    const text = ` ${p.title} ${p.selftext || ''} `.toLowerCase()
    return DUPE_KEYWORDS.some(k => text.includes(k))
  })
}

export function getMostDupedBrands(dupePosts) {
  const counts = {}
  for (const post of dupePosts) {
    const text = `${post.title} ${post.selftext || ''}`.toLowerCase()
    for (const brand of BRANDS) {
      if (brand.terms.some(t => text.includes(t))) {
        counts[brand.name] = (counts[brand.name] || 0) + 1
      }
    }
  }
  return Object.entries(counts)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([brand, count]) => ({ brand, count }))
}

export function getTopDupeBrands(dupePosts) {
  const counts = {}
  for (const post of dupePosts) {
    const text = `${post.title} ${post.selftext || ''}`.toLowerCase()
    for (const brand of DUPE_BRANDS) {
      if (brand.terms.some(t => text.includes(t))) {
        counts[brand.name] = (counts[brand.name] || 0) + 1
      }
    }
  }
  return Object.entries(counts)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([brand, count]) => ({ brand, count }))
}

export function extractBrandMentionsFromComments(comments) {
  const counts = {};
  for (const brand of BRANDS) counts[brand.name] = 0;
  for (const c of comments) {
    const text = `${c.title || ''} ${c.selftext || ''}`.toLowerCase();
    for (const brand of BRANDS) {
      if (brand.terms.some(t => text.includes(t))) counts[brand.name]++;
    }
  }
  return Object.entries(counts)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([brand, count]) => ({ brand, count }));
}

// Extract clean "wearing today" snippets from SOTD comments
export function extractWearingToday(comments, max = 30) {
  return comments
    .filter(c => (c.selftext || c.title || '').length > 10)
    .slice(0, max)
    .map(c => ({
      text: (c.selftext || c.title || '').replace(/\s+/g, ' ').trim().substring(0, 200),
      author: c.author,
      permalink: c.permalink,
    }));
}
