import { PrismaClient } from "@prisma/client";
// import { CategoriesData } from "@ratecreator/store";
import { MongoClient } from "mongodb";

// const prisma = new PrismaClient();
const uri =
  "mongodb://admin:secret@localhost:27017/ratecreator?authSource=admin";

const CategoriesData = [
  {
    name: "arts-and-entertainment",
    subcategories: [
      {
        name: "anime",
        subcategories: [
          { name: "anime" },
          { name: "manga" },
          { name: "naruto" },
        ],
      },
      {
        name: "movies-and-tv",
        subcategories: [
          { name: "reviews" },
          { name: "trailers" },
          { name: "disney" },
          { name: "marvel-comics" },
          { name: "movie-clips" },
          { name: "tv-series-clips" },
          { name: "behind-the-scenes" },
          { name: "harry-potter" },
          { name: "steampunk" },
          { name: "horror" },
          { name: "science-fiction" },
        ],
      },
      {
        name: "performing-arts",
        subcategories: [
          {
            name: "dance-performances",
            subcategories: [{ name: "dance" }],
          },
          { name: "theater" },
          { name: "opera" },
          { name: "magic-shows" },
        ],
      },
      {
        name: "visual-arts",
        subcategories: [
          { name: "painting-and-drawing-tutorials" },
          { name: "sculpture-techniques" },
          { name: "street-art" },
          { name: "calligraphy-and-typography" },
        ],
      },
      {
        name: "creative-arts",
        subcategories: [{ name: "scrapbooking-techniques" }],
      },
      {
        name: "photography",
        subcategories: [
          {
            name: "gear",
            subcategories: [{ name: "gopro-pictures" }, { name: "polaroid" }],
          },
          { name: "lighting" },
          { name: "drone" },
          { name: "themes" },
          { name: "editing-tools" },
        ],
      },
      {
        name: "videography",
        subcategories: [
          { name: "gear" },
          { name: "lighting-setup" },
          { name: "editing-tools" },
          { name: "animation-tools" },
          { name: "motion-graphics" },
          { name: "drone-recording" },
        ],
      },
      {
        name: "others",
        subcategories: [
          { name: "makeup-tutorials" },
          { name: "voice-over" },
          {
            name: "celebrity-gossip",
            subcategories: [{ name: "paparazzi" }],
          },
          {
            name: "memes-and-comedy",
            subcategories: [
              { name: "cosplay" },
              { name: "emoji" },
              { name: "suicide-girls" },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "technology-and-gadgets",
    subcategories: [
      {
        name: "general",
        subcategories: [
          {
            name: "tech-news",
          },
          {
            name: "gadgets-and-innovation",
            subcategories: [
              { name: "apple" },
              { name: "google" },
              { name: "samsung" },
              { name: "tumblr" },
            ],
          },
          {
            name: "diy-electronics",
            subcategories: [{ name: "electronics" }],
          },
          { name: "diy-tech-projects" },
          { name: "home-automation" },
          {
            name: "audio-gear",
            subcategories: [{ name: "audio" }, { name: "headphones" }],
          },
        ],
      },
      { name: "tech-discussions" },
      { name: "tech-influencers" },
      {
        name: "virtual-reality",
        subcategories: [{ name: "virtual" }, { name: "vr" }],
      },
      {
        name: "unboxing-and-reviews",
        subcategories: [
          {
            name: "smartphones-and-tablets",
            subcategories: [{ name: "mobile-phones" }],
          },
          { name: "computers-and-peripherals" },
          { name: "home-appliances" },
        ],
      },
      {
        name: "drone",
        subcategories: [
          { name: "how-to-drone" },
          { name: "drone-video" },
          { name: "drone-fpv" },
          { name: "drone-shoot" },
          { name: "drone" },
        ],
      },
    ],
  },
  {
    name: "business-and-finance",
    subcategories: [
      { name: "business-commentary" },
      {
        name: "industry-insights",
        subcategories: [
          { name: "market-trends" },
          { name: "business-news" },
          { name: "start-up-strategies" },
          { name: "economic-theories" },
          { name: "cfo" },
        ],
      },
      {
        name: "investments-and-personal-finance",
        subcategories: [
          { name: "stock-market" },
          { name: "investing" },
          {
            name: "trading",
            subcategories: [{ name: "day-trader" }],
          },
          { name: "real-estate" },
          { name: "saving-and-budgeting" },
          {
            name: "cryptocurrency",
            subcategories: [{ name: "crypto" }],
          },
          { name: "nfts" },
          { name: "accounting" },
          { name: "insurance" },
          { name: "forex" },
          { name: "financial-advisors" },
          {
            name: "ecommerce",
            subcategories: [{ name: "etsy" }, { name: "retail" }],
          },
        ],
      },
      { name: "historical-facts" },
    ],
  },
  {
    name: "lifestyle-and-health",
    subcategories: [
      {
        name: "wellness-and-fitness",
        subcategories: [
          { name: "sauna" },
          {
            name: "exercise-routines",
            subcategories: [
              { name: "brazilian-butt-lift" },
              { name: "crossfit" },
              { name: "decathlon" },
              { name: "jump-rope" },
              { name: "kettlebells" },
              { name: "powerlifting" },
              { name: "running" },
            ],
          },
          {
            name: "yoga-and-pilates",
            subcategories: [{ name: "pilates" }],
          },
          {
            name: "nutrition-and-diet",
            subcategories: [
              { name: "fruitarian" },
              { name: "gingers" },
              { name: "keto" },
              { name: "raw-vegan" },
              { name: "salad" },
              { name: "sport-nutrition" },
            ],
          },
          {
            name: "health-and-fitness",
            subcategories: [
              { name: "bariatric-surgery" },
              { name: "biohacking" },
              { name: "cancer-survivor" },
              { name: "cardiology" },
              { name: "dentist" },
              { name: "diabetes" },
              { name: "fibromyalgia" },
              { name: "herbalife" },
              { name: "lupus" },
              { name: "naturopathy" },
              { name: "nurse" },
              { name: "nursing" },
              { name: "optician" },
              { name: "pharmacist" },
              { name: "physio" },
              { name: "radiology" },
            ],
          },
          {
            name: "mental-health",
            subcategories: [
              { name: "autism" },
              { name: "depression" },
              { name: "psychedelics" },
            ],
          },
          { name: "nature" },
        ],
      },
      {
        name: "fashion-influencers",
        subcategories: [
          {
            name: "accessories",
            subcategories: [
              {
                name: "jewellery",
                subcategories: [
                  { name: "diamond" },
                  { name: "gold" },
                  { name: "handmade-jewelry" },
                  { name: "mens-jewelry" },
                ],
              },
              { name: "bags" },
              {
                name: "watches",
                subcategories: [{ name: "mens-watches" }, { name: "rolex" }],
              },
            ],
          },
          {
            name: "shopping-retails",
            subcategories: [
              { name: "clothing-outfits" },
              { name: "hosiery" },
              { name: "hourglass" },
              { name: "lacoste" },
              { name: "nike" },
              { name: "sneakers" },
              { name: "socks" },
              { name: "tights" },
              { name: "vans" },
            ],
          },
          { name: "androgyny" },
          { name: "emo" },
          { name: "gothic" },
          { name: "grunge" },
        ],
      },
      {
        name: "personal-care-and-beauty",
        subcategories: [
          { name: "skincare-routines" },
          { name: "makeup-tutorials" },
          {
            name: "hair-styling",
            subcategories: [
              { name: "blonde-hair" },
              { name: "dreadlocks" },
              { name: "hair-care" },
              { name: "hair-extension" },
              { name: "lace-wigs" },
            ],
          },
          { name: "aromatherapy" },
          { name: "black-women" },
          { name: "botox" },
          { name: "foot-peeling" },
          { name: "massage" },
          { name: "mens-grooming" },
          { name: "perfume" },
          { name: "sephora" },
          { name: "spa" },
          { name: "teenage" },
        ],
      },
      {
        name: "general",
        subcategories: [
          { name: "wedding" },
          { name: "geek" },
          { name: "laundry" },
          { name: "nightlife" },
          {
            name: "relationship-advice",
            subcategories: [{ name: "divorce" }, { name: "couple" }],
          },
          {
            name: "parenting",
            subcategories: [
              { name: "breastfeeding" },
              { name: "diaper" },
              { name: "foster-care" },
              { name: "potty-training" },
              { name: "surrogacy" },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "food-and-cooking",
    subcategories: [
      {
        name: "general",
        subcategories: [
          {
            name: "baking",
          },
          {
            name: "international-cuisine",
            subcategories: [
              { name: "afghan" },
              { name: "albanian" },
              { name: "asian-food" },
              { name: "bangladeshi" },
              { name: "bulgarian" },
              { name: "cambodian" },
              { name: "cameroonian" },
              { name: "indian" },
              { name: "iranian" },
              { name: "iraqi" },
              { name: "irish" },
              { name: "jamaican" },
              { name: "kenyan" },
              { name: "lithuanian" },
              { name: "pakistani" },
              { name: "palestine" },
              { name: "pizza" },
              { name: "romanian" },
            ],
          },
          {
            name: "cooking-techniques",
            subcategories: [],
          },
          { name: "recipe-tutorials" },
          { name: "food-reviews" },
          {
            name: "tobacco-and-smoking",
            subcategories: [
              { name: "cigars" },
              { name: "hookah" },
              { name: "marijuana" },
            ],
          },
          {
            name: "drinks-and-beverages",
            subcategories: [
              { name: "energy-drinks" },
              { name: "tea" },
              {
                name: "alcohol",
                subcategories: [
                  { name: "bartender" },
                  { name: "beer" },
                  { name: "gin" },
                  { name: "tequila" },
                  { name: "vodka" },
                  { name: "whisky" },
                ],
              },
            ],
          },
          {
            name: "ingredients",
            subcategories: [
              { name: "avocado" },
              { name: "beef" },
              { name: "burberry" },
              { name: "butcher" },
              { name: "chocolate" },
              { name: "fruit" },
              { name: "honey" },
              { name: "hot-sauce" },
              { name: "seafood" },
              { name: "spicy-foods" },
              { name: "steak" },
            ],
          },
        ],
      },
      { name: "cooking-shows" },
      { name: "food-bloggers" },
      { name: "food-discussions" },
    ],
  },
  {
    name: "travel-and-tourism",
    subcategories: [
      {
        name: "general",
        subcategories: [
          { name: "travel-tips" },
          { name: "emirates-airline" },
          {
            name: "destination-guides",
            subcategories: [
              { name: "barranquilla" },
              { name: "europe-travel" },
              { name: "bangalore" },
              { name: "cuba" },
              { name: "dutch" },
              { name: "haitian" },
              { name: "hungarian" },
              { name: "icelandic" },
              { name: "islamabad" },
              { name: "johannesburg" },
              { name: "jordanian" },
              { name: "karachi" },
              { name: "latvian" },
              { name: "libyan" },
              { name: "lithuanian" },
              { name: "malian" },
              { name: "michigan" },
              { name: "mongolian" },
              { name: "namibian" },
              { name: "nigerian" },
              { name: "patagonia" },
              { name: "penang" },
              { name: "punjab" },
              { name: "rajasthani" },
              { name: "senegal" },
              { name: "serbian" },
              { name: "somalia" },
              { name: "south-african" },
              { name: "sri-lankan" },
              { name: "sudanese" },
              { name: "syrian" },
              { name: "taiwanese" },
              { name: "venezuelan" },
              { name: "vietnamese" },
              { name: "tunisian" },
              { name: "wales" },
              { name: "uganda" },
              { name: "zimbabwean" },
            ],
          },
          { name: "cultural-experiences" },
          { name: "city-tours" },
          { name: "walking-through" },
          {
            name: "historical-sites",
            subcategories: [{ name: "viking" }],
          },
          {
            name: "travel-vlogs",
            subcategories: [
              { name: "travel-influencers" },
              { name: "travel-discussions" },
            ],
          },
          { name: "event-coverage" },
          { name: "airbnb" },
        ],
      },
    ],
  },
  {
    name: "education-and-learning",
    subcategories: [
      {
        name: "academic-subjects",
        subcategories: [
          {
            name: "mathematics",
            subcategories: [],
          },
          {
            name: "science",
            subcategories: [
              { name: "biology" },
              { name: "physics" },
              { name: "zoology" },
              { name: "botany" },
              { name: "chemistry" },
            ],
          },
          {
            name: "humanities",
            subcategories: [],
          },
          {
            name: "high-school",
            subcategories: [{ name: "student" }],
          },
          {
            name: "social-studies",
            subcategories: [{ name: "geography" }, { name: "psychology" }],
          },
        ],
      },
      {
        name: "skill-development",
        subcategories: [
          { name: "edtech" },
          {
            name: "programming-coding-skills",
            subcategories: [
              { name: "c++" },
              { name: "css" },
              { name: "javascript" },
            ],
          },
          {
            name: "engineering",
            subcategories: [
              { name: "chemical-engineering" },
              { name: "computer-science" },
              { name: "engineering" },
              { name: "mechanical-engineering" },
            ],
          },
          {
            name: "technical-skills-software-development",
            subcategories: [
              { name: "cyber-security" },
              { name: "devops" },
              { name: "robotics" },
            ],
          },
          {
            name: "language-learning",
            subcategories: [{ name: "afrikaans" }, { name: "arabic-language" }],
          },
          {
            name: "artistic-skills",
            subcategories: [],
          },
          {
            name: "creative-writing-and-blogging",
            subcategories: [],
          },
          {
            name: "public-speaking-and-presentation-skills",
            subcategories: [],
          },
          {
            name: "blockchain-web3-development",
            subcategories: [],
          },
          {
            name: "ai",
            subcategories: [],
          },
          {
            name: "hardware",
            subcategories: [],
          },
          {
            name: "3d-printing",
            subcategories: [],
          },
        ],
      },
      {
        name: "life-skills",
        subcategories: [
          { name: "financial-literacy" },
          { name: "home-repair" },
          { name: "cooking-basics" },
          { name: "taxation" },
          { name: "personal-finance" },
        ],
      },
      {
        name: "personal-improvement",
        subcategories: [
          { name: "how-to-improve-handwriting" },
          { name: "time-management-techniques" },
          { name: "personal-productivity-hacks" },
          { name: "personal-development" },
          {
            name: "sex-education",
            subcategories: [{ name: "bisexual" }, { name: "transsexuals" }],
          },
        ],
      },
      {
        name: "digital-courses",
        subcategories: [
          { name: "free" },
          { name: "institutional" },
          { name: "how-to-create-a-course" },
        ],
      },
    ],
  },
  {
    name: "music",
    subcategories: [
      {
        name: "music-videos",
      },
      {
        name: "cover-songs",
      },
      {
        name: "lyric-videos",
      },
      {
        name: "concert-footage",
      },
      {
        name: "live-performance",
      },
      {
        name: "instrumental-music",
      },
      {
        name: "instruments",
        subcategories: [
          {
            name: "acoustic-guitar",
          },
          {
            name: "flute",
          },
          {
            name: "keyboard",
          },
          {
            name: "pianist",
          },
          {
            name: "piano",
          },
          {
            name: "saxophone",
          },
          {
            name: "violin",
          },
        ],
      },
      {
        name: "movie-soundtracks",
      },
      {
        name: "classic",
        subcategories: [
          {
            name: "classical-music",
          },
        ],
      },
      {
        name: "gaming-soundtracks",
      },
      {
        name: "country-music",
      },
      {
        name: "djs",
      },
      {
        name: "edm",
      },
      {
        name: "heavy-metal",
      },
      {
        name: "indie-music",
      },
      {
        name: "jazz",
      },
      {
        name: "rap",
      },
      {
        name: "techno",
      },
      {
        name: "underground",
      },
      {
        name: "rock-music",
        subcategories: [
          {
            name: "pop-rock",
          },
          {
            name: "punk-rock",
          },
          {
            name: "rock-music",
          },
          {
            name: "rocknroll",
          },
        ],
      },
    ],
  },
  {
    name: "gaming-and-esports",
    subcategories: [
      {
        name: "gameplay-and-reviews",
        subcategories: [
          { name: "strategy-games" },
          { name: "role-playing-games-rpgs" },
          { name: "action-and-adventure" },
          { name: "walkthroughs" },
          { name: "reviews" },
        ],
      },
      {
        name: "tutorials-and-guides",
        subcategories: [
          { name: "tips-and-tricks" },
          { name: "strategy-optimization" },
        ],
      },
      {
        name: "esports-and-competitive-gaming",
        subcategories: [
          { name: "tournaments" },
          { name: "player-interviews" },
          { name: "match-analysis" },
          { name: "pokemon" },
        ],
      },
      {
        name: "general",
        subcategories: [
          {
            name: "consoles",
            subcategories: [{ name: "nintendo" }],
          },
          { name: "speedrun" },
          { name: "gaming" },
          { name: "toy-and-collectible" },
          { name: "lego" },
          {
            name: "gambling",
            subcategories: [{ name: "poker" }],
          },
          { name: "esports" },
          { name: "retrogaming" },
          {
            name: "chess",
            subcategories: [{ name: "chess" }],
          },
          {
            name: "board-games",
            subcategories: [{ name: "board-games" }],
          },
          { name: "nft-games" },
        ],
      },
    ],
  },
  {
    name: "vlogs",
    subcategories: [
      {
        name: "daily-life",
        subcategories: [
          { name: "day-in-the-life" },
          { name: "routine-videos" },
          { name: "personal-vlogs" },
        ],
      },
      {
        name: "special-interest",
        subcategories: [
          { name: "tech-vlogs" },
          { name: "fitness-vlogs" },
          { name: "cooking-vlogs" },
          { name: "advice-and-motivation" },
        ],
      },
    ],
  },
  {
    name: "content-creators-toolbox",
    subcategories: [
      {
        name: "youtube-and-video-production",
        subcategories: [
          { name: "best-practices-for-youtube" },
          { name: "equipment-reviews-cameras-mics-etc" },
          { name: "creating-engaging-content" },
        ],
      },
      {
        name: "monetization-strategies",
        subcategories: [
          { name: "monetizing-your-youtube-channel" },
          { name: "understanding-youtube-analytics" },
          { name: "sponsorships-and-partnerships" },
        ],
      },
    ],
  },
  {
    name: "career-and-business-skills",
    subcategories: [
      {
        name: "business-operations",
        subcategories: [
          { name: "how-to-set-up-a-home-office" },
          { name: "managing-business-finances" },
          { name: "legal-considerations-for-startups" },
        ],
      },
      {
        name: "professional-growth",
        subcategories: [
          { name: "leadership-skills" },
          { name: "negotiation-and-sales-techniques" },
          { name: "strategic-thinking-and-planning" },
        ],
      },
    ],
  },
  {
    name: "professional-development-online-business",
    subcategories: [
      {
        name: "content-creation",
        subcategories: [
          { name: "how-to-start-a-youtube-channel" },
          { name: "video-editing-techniques" },
          { name: "content-planning-and-strategy" },
          { name: "grow-linkedin-followers" },
          { name: "grow-instagram-followers" },
          { name: "grow-twitter-followers" },
          { name: "newsletter" },
        ],
      },
      {
        name: "digital-marketing",
        subcategories: [
          { name: "affiliate-marketing-basics" },
          { name: "seo-for-beginners" },
          {
            name: "social-media-marketing-strategies",
            subcategories: [
              { name: "facebook" },
              { name: "reddit" },
              { name: "snapchat" },
            ],
          },
        ],
      },
      {
        name: "entrepreneurship",
        subcategories: [
          { name: "starting-an-online-business" },
          { name: "how-to-start-a-digital-agency" },
          { name: "business-networking-tips" },
          { name: "dropshipping" },
          { name: "kickstarter" },
        ],
      },
    ],
  },
  {
    name: "news-and-politics",
    subcategories: [
      {
        name: "current-events",
        subcategories: [
          { name: "global-news" },
          { name: "local-updates" },
          { name: "breaking-news" },
        ],
      },
      {
        name: "political-commentary",
        subcategories: [
          { name: "political-debates" },
          { name: "policy-analysis" },
          { name: "election-coverage" },
          { name: "conservative" },
        ],
      },
      {
        name: "investigative-journalism",
        subcategories: [
          { name: "documentaries" },
          { name: "exposes" },
          { name: "historical-analyses" },
        ],
      },
      {
        name: "conspiracies",
        subcategories: [{ name: "conspiracy-theories" }],
      },
      {
        name: "general",
        subcategories: [
          { name: "infrastructure-and-transports" },
          { name: "geopolitics" },
          { name: "feminism" },
          { name: "politics" },
          { name: "non-profits-and-activism" },
          { name: "crimes-and-scams" },
          { name: "ecology" },
          { name: "law-and-legal" },
          { name: "security" },
        ],
      },
    ],
  },
  {
    name: "science-and-nature",
    subcategories: [
      {
        name: "natural-phenomena",
        subcategories: [{ name: "astrophysics" }],
      },
      { name: "space-exploration" },
      {
        name: "wildlife",
        subcategories: [
          { name: "animal-conservation" },
          { name: "insects" },
          { name: "snakes" },
          { name: "wildlife" },
        ],
      },
      {
        name: "science-education",
        subcategories: [
          { name: "biology" },
          { name: "physics" },
          { name: "zoology" },
          { name: "botany" },
        ],
      },
      { name: "climate-change" },
      {
        name: "environmental-science",
        subcategories: [{ name: "renewable-energy" }, { name: "solar" }],
      },
      {
        name: "geology",
        subcategories: [{ name: "geography" }, { name: "geology" }],
      },
      { name: "marine-biology" },
      { name: "science-experiments" },
      {
        name: "aviation",
        subcategories: [{ name: "airplanes" }, { name: "aviation" }],
      },
      { name: "archeology" },
    ],
  },
  {
    name: "sports-and-activities",
    subcategories: [
      {
        name: "traditional-sports",
        subcategories: [
          {
            name: "soccer",
            subcategories: [{ name: "football" }, { name: "fifa" }],
          },
          { name: "basketball" },
          { name: "baseball" },
          { name: "tennis" },
          { name: "artistic-gymnastics" },
          { name: "badminton" },
          { name: "bowling" },
          { name: "boxing" },
          { name: "cheerleading" },
          { name: "golf" },
          { name: "handball" },
          { name: "kickboxing" },
          { name: "lacrosse" },
          { name: "ping-pong" },
          { name: "pool" },
          { name: "rugby" },
        ],
      },
      {
        name: "extreme-sports",
        subcategories: [
          { name: "skateboarding" },
          { name: "bmx" },
          { name: "airsoft" },
          { name: "climbing" },
          { name: "figure-skating" },
          { name: "firearms" },
          { name: "motocross" },
          { name: "parkour" },
          { name: "trampolining" },
          { name: "biathlon" },
          { name: "triathlon" },
          { name: "tutorials" },
          { name: "training" },
        ],
      },
      {
        name: "winter-sports",
        subcategories: [
          { name: "ice-hockey" },
          { name: "nhl" },
          { name: "snowboarding" },
        ],
      },
      {
        name: "water-sports",
        subcategories: [
          { name: "surfing" },
          { name: "scuba-diving" },
          { name: "kayaking" },
          { name: "kitesurfing" },
          { name: "wakeboarding" },
        ],
      },
      { name: "fitness-challenges" },
      { name: "sports-tutorials" },
      { name: "athlete-interviews" },
      { name: "match-analysis" },
      { name: "sports-news" },
    ],
  },
  {
    name: "spirituality-and-religion",
    subcategories: [
      { name: "astronomy" },
      { name: "buddhism" },
      { name: "catholic" },
      { name: "guru" },
      { name: "healing-crystals" },
      { name: "hinduism" },
      { name: "islam" },
      { name: "jewish" },
      { name: "muslim" },
      { name: "new-age" },
      { name: "spirituality" },
    ],
  },
  {
    name: "books-and-literature",
    subcategories: [
      { name: "poetry" },
      { name: "philosophy" },
      { name: "comics" },
      { name: "novel" },
      { name: "religion" },
      { name: "manga" },
      { name: "book-reviews" },
      { name: "author-interviews" },
      { name: "writing-tips" },
      { name: "literary-analysis" },
    ],
  },
  {
    name: "hobbies-and-interests",
    subcategories: [
      {
        name: "crafts",
        subcategories: [
          { name: "knitting-and-sewing" },
          { name: "paper-crafts" },
          { name: "woodworking" },
        ],
      },
      {
        name: "collectibles",
        subcategories: [
          { name: "coin-collecting" },
          { name: "trading-cards" },
          { name: "antiques" },
        ],
      },
      {
        name: "outdoors",
        subcategories: [
          { name: "fishing" },
          { name: "saltwater-fishing" },
          { name: "hiking" },
          { name: "camping" },
        ],
      },
      {
        name: "general",
        subcategories: [
          { name: "architecture" },
          { name: "drawings" },
          { name: "handcraft" },
          { name: "graphic-design" },
          { name: "photography" },
          { name: "interior-design" },
          { name: "painting" },
          { name: "3d" },
          { name: "sculpture" },
          { name: "sewing-and-knitting" },
          { name: "recycling" },
          { name: "furniture" },
          {
            name: "gardening-and-agriculture",
            subcategories: [
              { name: "bedding" },
              { name: "beekeeping" },
              { name: "chickens" },
              { name: "hydroponics" },
            ],
          },
          {
            name: "diy-home-decor-projects",
            subcategories: [
              { name: "bricklayer" },
              { name: "carpenter" },
              { name: "carpeting-and-rugs" },
              { name: "electrician" },
              { name: "tiles-and-flooring" },
              { name: "plumber" },
            ],
          },
          { name: "pets-and-animals" },
        ],
      },
    ],
  },
  {
    name: "childrens-content",
    subcategories: [
      {
        name: "educational-videos",
        subcategories: [
          { name: "alphabet-reading" },
          { name: "simple-math" },
          { name: "basic-science" },
        ],
      },
      {
        name: "entertainment",
        subcategories: [
          { name: "cartoons" },
          { name: "childrens-songs" },
          { name: "puppet-shows" },
        ],
      },
      {
        name: "activities-and-crafts",
        subcategories: [
          { name: "simple-crafts" },
          { name: "educational-games" },
          { name: "storytelling" },
        ],
      },
    ],
  },
  {
    name: "multi-topic",
    subcategories: [
      {
        name: "general-discussion",
      },
      {
        name: "interviews",
      },
      {
        name: "collaborations",
      },
      {
        name: "challenges",
      },
      {
        name: "compilation-videos",
      },
      {
        name: "variety-shows",
      },
    ],
  },
  {
    name: "automobiles-mechanics",
    subcategories: [
      {
        name: "motorcycles",
      },
      {
        name: "cars",
        subcategories: [
          { name: "audi" },
          { name: "bmw" },
          { name: "cherokee" },
          { name: "ferrari" },
          { name: "gypsy" },
          { name: "jeep" },
          { name: "mercedes-benz" },
          { name: "nissan" },
          { name: "porsche" },
          { name: "subaru" },
        ],
      },
      {
        name: "f1",
        subcategories: [{ name: "formula-1" }, { name: "red-bull-racing" }],
      },
      {
        name: "train-and-metro",
      },
      {
        name: "war-machines",
      },
      {
        name: "planes",
      },
      {
        name: "boats",
      },
      {
        name: "car-maintenance",
        subcategories: [{ name: "mechanic" }],
      },
      {
        name: "car-reviews",
      },
      {
        name: "mechanics-tutorials",
      },
      {
        name: "vehicle-unboxing",
      },
    ],
  },
  {
    name: "public-figures",
    subcategories: [
      {
        name: "government-officials",
        subcategories: [
          { name: "senators" },
          { name: "council-members" },
          { name: "ambassadors" },
          { name: "governors" },
          { name: "ministers" },
          { name: "secretaries" },
          { name: "civil-servants" },
        ],
      },
      {
        name: "world-leaders",
        subcategories: [
          { name: "presidents" },
          { name: "prime-ministers" },
          { name: "monarchs" },
          { name: "heads-of-state" },
          { name: "diplomats" },
        ],
      },
      {
        name: "celebrities",
        subcategories: [
          { name: "actors" },
          { name: "musicians" },
          { name: "models" },
          { name: "tv-hosts" },
          { name: "reality-tv-stars" },
          { name: "comedians" },
        ],
      },
      {
        name: "athletes",
        subcategories: [
          { name: "football-players" },
          { name: "basketball-players" },
          { name: "tennis-players" },
          { name: "golfers" },
          { name: "olympians" },
          { name: "esports-players" },
          { name: "cricket-players" },
          { name: "other-sports" },
        ],
      },
      {
        name: "influencers",
        subcategories: [
          { name: "social-media-influencers" },
          { name: "lifestyle-influencers" },
          { name: "fashion-influencers" },
          { name: "fitness-influencers" },
          { name: "travel-influencers" },
          { name: "food-influencers" },
          { name: "beauty-influencers" },
        ],
      },
      {
        name: "journalists-and-news-anchors",
        subcategories: [
          { name: "reporters" },
          { name: "editors" },
          { name: "columnists" },
          { name: "tv-news-anchors" },
          { name: "radio-hosts" },
          { name: "podcast-hosts" },
        ],
      },
      {
        name: "business-leaders",
        subcategories: [
          { name: "ceos" },
          { name: "entrepreneurs" },
          { name: "investors" },
          { name: "start-up-founders" },
          { name: "tech-innovators" },
        ],
      },
      {
        name: "activists",
        subcategories: [
          { name: "human-rights-activists" },
          { name: "environmental-activists" },
          { name: "social-justice-activists" },
          { name: "political-activists" },
        ],
      },
      {
        name: "scientists-and-academics",
        subcategories: [
          { name: "researchers" },
          { name: "professors" },
          { name: "experts" },
          { name: "innovators" },
        ],
      },
      {
        name: "emergency-responders",
        subcategories: [{ name: "fireman" }],
      },
      {
        name: "philanthropists",
        subcategories: [
          { name: "charity-founders" },
          { name: "donors" },
          { name: "social-entrepreneurs" },
        ],
      },
    ],
  },
  {
    name: "asmr",
  },
  {
    name: "luxury-lifestyles",
    subcategories: [
      {
        name: "yacht",
      },
      {
        name: "megayachts",
      },
      {
        name: "private-jets",
      },
      {
        name: "luxury-residencies",
      },
      {
        name: "luxury-travels",
      },
      {
        name: "billionaire-lifestyles",
      },
    ],
  },
];
async function insertCategory(
  db: any,
  category: any,
  parentId: string | null = null
): Promise<string> {
  const { name, subcategories } = category;

  try {
    const collection = db.collection("Category");

    const existingCategory = await collection.findOne({ name, parentId });

    if (existingCategory) {
      console.log(`Category "${name}" already exists. Skipping...`);
      return existingCategory._id.toString();
    }

    const result = await collection.insertOne({
      name,
      parentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const newCategoryId = result.insertedId.toString();
    console.log(`Inserted category: ${name}`);

    if (subcategories && subcategories.length > 0) {
      for (const subcategory of subcategories) {
        await insertCategory(db, subcategory, newCategoryId);
      }
    }

    return newCategoryId;
  } catch (error) {
    console.error(`Error inserting category "${name}":`, error);
    return "";
  }
}

async function insertAllCategories() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db();

    for (const category of CategoriesData) {
      await insertCategory(db, category);
    }

    console.log("All categories inserted successfully.");
  } catch (error) {
    console.error("Error inserting categories:", error);
  } finally {
    await client.close();
    console.log("Disconnected from MongoDB");
  }
}

insertAllCategories();
