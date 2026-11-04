const FEEDS = [
  { key: "local", label: "محليات", q: '"كفر الشيخ" OR بلطيم OR "برج البرلس"' },
  { key: "egypt", label: "مصر", q: "أخبار مصر" },
  { key: "world", label: "العالم", q: "أخبار العالم" }
];

function decodeXml(s = "") {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tag(xml, name) {
  const m = xml.match(new RegExp(
    `<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"
  ));
  return m ? decodeXml(m[1]) : "";
}

function parseFeed(xml, feed) {
  return [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)]
    .map(m => {
      const x = m[1];
      const title = tag(x, "title");
      const link = tag(x, "link");
      return {
        title,
        link,
        source: tag(x, "source") || "Google News",
        description: tag(x, "description"),
        publishedAt: tag(x, "pubDate"),
        category: feed.key,
        categoryLabel: feed.label
      };
    })
    .filter(x => x.title && /^https?:\/\//i.test(x.link));
}

async function getFeed(feed) {
  const url =
    `https://news.google.com/rss/search?q=${encodeURIComponent(feed.q)}&hl=ar&gl=EG&ceid=EG:ar`;

  const response = await fetch(url, {
    headers: { "Accept": "application/rss+xml, application/xml, text/xml" }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const xml = await response.text();
  const items = parseFeed(xml, feed);

  if (!items.length) {
    throw new Error("لم يتم العثور على أخبار قابلة للقراءة");
  }

  return items;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/news") {
      const results = await Promise.allSettled(FEEDS.map(getFeed));
      let items = [];
      const errors = [];

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          items.push(...result.value);
        } else {
          errors.push({
            category: FEEDS[index].key,
            message: String(result.reason?.message || result.reason)
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
        new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0)
      );

      return Response.json({
        items: items.slice(0, 30),
        updatedAt: new Date().toISOString(),
        errors
      }, {
        headers: { "Cache-Control": "no-store" }
      });
    }

    return env.ASSETS.fetch(request);
  }
};
