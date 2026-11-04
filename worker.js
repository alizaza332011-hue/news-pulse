
const FEEDS = [
  {
    key: "egypt",
    label: "مصر",
    url: "https://alikhbariya.net/feeds/countries/eg.xml"
  },
  {
    key: "world",
    label: "العالم",
    url: "https://alikhbariya.net/feeds/countries/xw.xml"
  },
  {
    key: "local",
    label: "محليات",
    url: "https://alikhbariya.net/feeds/countries/eg.xml",
    localOnly: true
  }
];

const LOCAL_WORDS = [
  "كفر الشيخ", "برج البرلس", "بلطيم",
  "مطوبس", "دسوق", "فوه", "الحامول",
  "بيلا", "قلين", "سيدي سالم", "الرياض"
];

function clean(value = "") {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function getTag(xml, name) {
  const match = xml.match(
    new RegExp(
      `<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`,
      "i"
    )
  );
  return match ? clean(match[1]) : "";
}

function parseFeed(xml, feed) {
  const entries = [...xml.matchAll(
    /<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi
  )];

  return entries.map(match => {
    const item = match[1];

    return {
      title: getTag(item, "title"),
      link: getTag(item, "link"),
      source: getTag(item, "source") || "الإخبارية",
      description: getTag(item, "description"),
      publishedAt: getTag(item, "pubDate"),
      category: feed.key,
      categoryLabel: feed.label
    };
  }).filter(item =>
    item.title && /^https?:\/\//i.test(item.link)
  );
}

async function getFeed(feed) {
  const response = await fetch(feed.url, {
    headers: {
      "User-Agent": "NewsPulse/1.0",
      "Accept": "application/rss+xml, application/xml, text/xml"
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const xml = await response.text();
  let items = parseFeed(xml, feed);

  if (feed.localOnly) {
    items = items.filter(item => {
      const text = `${item.title} ${item.description}`;
      return LOCAL_WORDS.some(word => text.includes(word));
    });
  }

  if (!items.length) {
    throw new Error("لم تصل أخبار من هذه الخلاصة");
  }

  return items;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/news") {
      const results = await Promise.allSettled(
        FEEDS.map(getFeed)
      );

      let items = [];
      const errors = [];

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          items.push(...result.value);
        } else {
          errors.push({
            category: FEEDS[index].key,
            message: String(
              result.reason?.message || result.reason
            )
          });
        }
      });

      const seen = new Set();

      items = items.filter(item => {
        if (seen.has(item.link)) return false;
        seen.add(item.link);
        return true;
      });

      items.sort((a, b) =>
        new Date(b.publishedAt || 0) -
        new Date(a.publishedAt || 0)
      );

      return Response.json({
        items: items.slice(0, 40),
        updatedAt: new Date().toISOString(),
        errors
      }, {
        headers: {
          "Cache-Control": "no-store"
        }
      });
    }

    return env.ASSETS.fetch(request);
  }
};
