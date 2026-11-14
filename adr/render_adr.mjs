// Render one ADR Markdown file (the adr.md format) into a standalone HTML page styled like adr.html.
// Only the Markdown that the ADR template uses is supported: headings, paragraphs, lists, tables and blockquotes.

const SECTION_IDS = {
  "01": "context",
  "02": "drivers",
  "03": "options",
  "04": "decision",
  "05": "consequences",
  "06": "follow-up",
  "07": "related",
  "08": "history",
};
export const STATUSES = {
  "提案中": "proposed",
  "承認": "accepted",
  "却下": "rejected",
  "廃止": "deprecated",
  "置換": "superseded",
};
const STATUS_MEANINGS = [
  ["提案中", "レビュー・合意を待っている状態。"],
  ["承認", "合意され、この決定に従って進める状態。"],
  ["却下", "検討したが採用しなかった状態。理由を残します。"],
  ["廃止", "前提が変わり、もう従わない状態。"],
  ["置換", "別のADRで置き換えた状態。「関連ADR」に後継を記載します。"],
];
const SCORES = { "◎": "good", "○": "fair", "△": "poor", "×": "poor" };

export function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" })[char]);
}

// ADR同士のリンクは、生成するHTML同士のリンクに置き換える。
function href(url) {
  return /^adr-\d{4}-[a-z0-9-]+\.md$/.test(url) ? url.replace(/\.md$/, ".html") : url;
}

export function inline(text) {
  let html = "";
  let last = 0;
  for (const match of text.matchAll(/`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)|\*\*(.+?)\*\*/g)) {
    html += escapeHtml(text.slice(last, match.index));
    if (match[1] !== undefined) html += `<code>${escapeHtml(match[1])}</code>`;
    else if (match[2] !== undefined) html += `<a href="${escapeHtml(href(match[3]))}">${inline(match[2])}</a>`;
    else html += `<strong>${inline(match[4])}</strong>`;
    last = match.index + match[0].length;
  }
  return html + escapeHtml(text.slice(last));
}

function cells(line) {
  return line.trim().replace(/^\||\|$/g, "").split(/(?<!\\)\|/).map((cell) => cell.trim().replace(/\\\|/g, "|"));
}

// Split Markdown lines into blocks: heading, table, ul, ol, quote, paragraph.
function parseBlocks(lines) {
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    let match;
    if ((match = line.match(/^(#{3,4}) (.+)$/))) {
      blocks.push({ type: match[1].length === 3 ? "h3" : "h4", text: match[2].trim() });
      i++;
    } else if (line.startsWith("|")) {
      const rows = [];
      while (i < lines.length && lines[i].startsWith("|")) rows.push(lines[i++]);
      const [head, , ...body] = rows.map(cells);
      blocks.push({ type: "table", head, body });
    } else if (line.startsWith(">")) {
      const quote = [];
      while (i < lines.length && lines[i].startsWith(">")) quote.push(lines[i++].replace(/^> ?/, ""));
      blocks.push({ type: "quote", lines: quote });
    } else if (/^(- |\d+\. )/.test(line)) {
      const ordered = /^\d+\. /.test(line);
      const items = [];
      while (i < lines.length && (/^(- |\d+\. )/.test(lines[i]) || (/^\s+\S/.test(lines[i]) && items.length))) {
        if (/^\s+\S/.test(lines[i])) items[items.length - 1].push(lines[i].trim());
        else items.push([lines[i].replace(/^(- |\d+\. )/, "")]);
        i++;
      }
      blocks.push({ type: ordered ? "ol" : "ul", items });
    } else {
      const text = [];
      while (i < lines.length && lines[i].trim() && !/^(#{3,4} |\||>|- |\d+\. )/.test(lines[i])) text.push(lines[i++].trim());
      blocks.push({ type: "p", text: text.join("") });
    }
  }
  return blocks;
}

function renderCell(cell, column) {
  if (column === "ステータス" && cell in STATUSES) {
    return `<span class="status status-${STATUSES[cell]}">${escapeHtml(cell)}</span>`;
  }
  const score = cell.match(/^([◎○△×]) (.*)$/);
  return score ? `<span class="score ${SCORES[score[1]]}">${score[1]}</span>${inline(score[2])}` : inline(cell);
}

function renderTable(block, label) {
  const head = block.head.map((cell) => {
    const chosen = cell.match(/^(.*)（(採用案?)）$/);
    return `<th scope="col">${chosen ? `${inline(chosen[1])}<span class="chosen">${chosen[2]}</span>` : inline(cell)}</th>`;
  });
  const body = block.body.map((row) => "<tr>" + row.map((cell, index) => index === 0
    ? `<th scope="row">${renderCell(cell, block.head[0])}</th>`
    : `<td>${renderCell(cell, block.head[index])}</td>`).join("") + "</tr>");
  return `<div class="table-wrap" role="region" aria-label="${escapeHtml(label)}" tabindex="0"><table>\n` +
    `          <thead><tr>${head.join("")}</tr></thead>\n          <tbody>\n` +
    body.map((row) => `            ${row}`).join("\n") + "\n          </tbody>\n        </table></div>";
}

function renderQuote(block) {
  const [first, ...rest] = block.lines;
  const title = first.match(/^\*\*(.+)\*\*$/);
  if (title && title[1] === "DECISION") {
    return `<div class="decision">\n          <p class="decision-label">DECISION</p>\n          <p class="decision-text">${inline(rest.join(""))}</p>\n        </div>`;
  }
  if (title) {
    return `<aside class="callout" aria-label="${escapeHtml(title[1])}"><strong>${inline(title[1])}</strong>${inline(rest.join(""))}</aside>`;
  }
  return `<aside class="callout">${inline(block.lines.join(""))}</aside>`;
}

function renderList(block, sectionId) {
  const pairs = block.items.map((item) => item.join("").match(/^\*\*(.+?)\*\*：(.*)$/));
  if (block.type === "ul" && pairs.every(Boolean)) {
    return `<dl class="pros-cons">${pairs.map((pair) => `<dt>${inline(pair[1])}</dt><dd>${inline(pair[2])}</dd>`).join("")}</dl>`;
  }
  if (block.type === "ol" && sectionId === "drivers") {
    return `<ol class="steps">\n` + block.items.map(([first, ...rest]) =>
      `          <li><div><strong>${inline(first.replace(/^\*\*(.+)\*\*$/, "$1"))}</strong>${rest.length ? `<p>${inline(rest.join(""))}</p>` : ""}</div></li>`).join("\n") + "\n        </ol>";
  }
  if (sectionId === "related") {
    return `<ul class="reference-list">\n` + block.items.map((item) => {
      const [text, note] = item.join("").split(" — ");
      return `          <li>${inline(text)}${note ? `<small>${inline(note)}</small>` : ""}</li>`;
    }).join("\n") + "\n        </ul>";
  }
  const tag = block.type;
  return `<${tag}>` + block.items.map((item) => `<li>${inline(item.join(""))}</li>`).join("") + `</${tag}>`;
}

function renderBlock(block, sectionId, sectionTitle, muted = false) {
  switch (block.type) {
    case "h3": return `<h3>${inline(block.text)}</h3>`;
    case "h4": return `<h3>${inline(block.text)}</h3>`;
    case "table": return renderTable(block, sectionTitle);
    case "quote": return renderQuote(block);
    case "ul":
    case "ol": return renderList(block, sectionId);
    default:
      if (/^◎：/.test(block.text)) return `<p class="caption">${inline(block.text)}</p>`;
      return muted ? `<p class="muted">${inline(block.text)}</p>` : `<p>${inline(block.text)}</p>`;
  }
}

// Group blocks under each heading of the given type, e.g. "h3" → [{ heading, blocks }].
function groupBy(blocks, type) {
  const intro = [];
  const groups = [];
  for (const block of blocks) {
    if (block.type === type) groups.push({ heading: block.text, blocks: [] });
    else (groups.length ? groups[groups.length - 1].blocks : intro).push(block);
  }
  return { intro, groups };
}

function panel(group, sectionId, sectionTitle, className = "panel", muted = false) {
  return `<article class="${className}"><h3>${inline(group.heading)}</h3>` +
    group.blocks.map((block) => renderBlock(block, sectionId, sectionTitle, muted)).join("") + "</article>";
}

const indent = (items) => items.map((item) => `        ${item}`).join("\n");

// Sections whose ### subsections become side-by-side panels, as in adr.html.
function renderSection(id, title, blocks) {
  const { intro, groups } = groupBy(blocks, "h3");
  const out = intro.map((block) => renderBlock(block, id, title));
  if (["context", "consequences", "follow-up"].includes(id) && groups.length) {
    const quotes = groups.flatMap((group) => group.blocks.filter((block) => block.type === "quote"));
    const panels = groups.map((group) => {
      const inner = { ...group, blocks: group.blocks.filter((block) => block.type !== "quote") };
      const tone = group.heading === "良い影響" ? " consequence-good" : group.heading === "受け入れる不利益" ? " consequence-bad" : "";
      return `  ${panel(inner, id, title, "panel" + tone, id === "follow-up")}`;
    });
    const grid = id === "consequences" ? "consequences" : id === "follow-up" ? "two-columns review" : "two-columns";
    out.push(`<div class="${grid}">\n${panels.map((p) => `        ${p}`).join("\n")}\n        </div>`);
    out.push(...quotes.map((block) => renderBlock(block, id, title)));
  } else {
    for (const group of groups) {
      out.push(`<h3>${inline(group.heading)}</h3>`);
      const sub = groupBy(group.blocks, "h4");
      out.push(...sub.intro.map((block) => renderBlock(block, id, title)));
      if (sub.groups.length) {
        // The first paragraph of each option is its summary, shown muted as in adr.html.
        out.push(`<div class="options">\n` + sub.groups.map((option) =>
          `          <article class="panel"><h3>${inline(option.heading)}</h3>` + option.blocks.map((block, index) =>
            renderBlock(block, id, title, index === 0 && block.type === "p")).join("") + "</article>").join("\n") + "\n        </div>");
      }
    }
  }
  return out;
}

export function parseAdr(markdown) {
  // Drop only comments and <details> that start a line, so `<!-- ... -->` inside code spans stays.
  const text = markdown.replace(/^<!--[\s\S]*?-->[ \t]*$/gm, "").replace(/^<details>[\s\S]*?<\/details>[ \t]*$/gm, "");
  const lines = text.split("\n");
  const title = text.match(/^# ADR-(\d{4})：(.+)$/m);
  const firstSection = lines.findIndex((line) => line.startsWith("## "));
  const header = lines.slice(0, firstSection === -1 ? lines.length : firstSection);
  const breadcrumb = header.find((line) => line.trim() && !/^(#|>|\|)/.test(line)) || "";
  const lead = header.filter((line) => line.startsWith("> ")).map((line) => line.slice(2)).join("");
  const metadata = header.filter((line) => line.startsWith("|")).map(cells).slice(2).filter((row) => row.length >= 2);
  const sections = [];
  let footer = "";
  let current = null;
  for (const line of lines.slice(firstSection)) {
    const heading = line.match(/^## (?:(\d{2})\. )?(.+)$/);
    if (heading) {
      current = heading[2].trim() === "目次" ? null : { number: heading[1] || "", title: heading[2].trim(), lines: [] };
      if (current) sections.push(current);
    } else if (line.trim() === "---") {
      current = null;
      footer = "";
    } else if (current) {
      current.lines.push(line);
    } else if (line.trim()) {
      footer = line.trim();
    }
  }
  return { number: title && title[1], title: title && title[2].trim(), breadcrumb, lead, metadata, sections, footer };
}

export function renderAdr(markdown, { head, source }) {
  const adr = parseAdr(markdown);
  const sections = adr.sections.map((section, index) => ({ ...section, id: SECTION_IDS[section.number] || `section-${index + 1}` }));
  const toc = sections.map((s) => `          <li><a href="#${s.id}"><span class="toc-number">${s.number}</span>${inline(s.title)}</a></li>`);
  const meta = adr.metadata.map(([label, value]) => `          <div><dt>${inline(label)}</dt><dd>${label === "ステータス" && value in STATUSES
    ? `<span class="status status-${STATUSES[value]}">${escapeHtml(value)}</span>` : inline(value)}</dd></div>`);
  const breadcrumb = inline(adr.breadcrumb).replace(/^ADR(?= \/)/, '<a href="index.html">ADR</a>');
  const body = sections.map((s) => {
    const number = s.number ? `<span class="section-number">${s.number} /</span>` : "";
    return `      <section id="${s.id}" aria-labelledby="${s.id}-title">\n` +
      `        <div class="section-heading">${number}<h2 id="${s.id}-title">${inline(s.title)}</h2></div>\n` +
      indent(renderSection(s.id, s.title, parseBlocks(s.lines))) + "\n      </section>";
  });
  const pageHead = head
    .replace(/<head>\n/, `<head>\n  <!-- このファイルは adr/${source} から node adr/build_index.mjs で生成しています。直接編集せず、Markdownを編集してください。 -->\n`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escapeHtml(`ADR-${adr.number}：${adr.title}`)}">`)
    .replace(/\n\s*<!-- 1つの決定につき[^\n]*-->/, "")
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(`ADR-${adr.number} ${adr.title}｜DECISION RECORD`)}</title>`);
  return `${pageHead}<body data-layout="document" id="top">
  <a class="skip-link" href="#main-content">本文へスキップ</a>
  <div class="layout">
    <aside class="sidebar" aria-label="ADRのナビゲーション">
      <div class="brand"><span class="mark" aria-hidden="true"></span>DECISION RECORD</div>
      <p class="sidebar-description">ADR-${adr.number}<br>アーキテクチャ決定レコード</p>
      <nav aria-labelledby="toc-title">
        <p class="toc-label" id="toc-title">CONTENTS / 目次</p>
        <ol class="toc">
${toc.join("\n")}
        </ol>
      </nav>
      <div class="sidebar-note"><a href="index.html">ADR一覧へ戻る</a><br><br>このページの元データ（Markdown）：<br><a href="${escapeHtml(source)}">${escapeHtml(source)}</a></div>
    </aside>

    <main id="main-content" tabindex="-1">
      <header class="document-header">
        <p class="breadcrumb">${breadcrumb}</p>
        <p class="eyebrow">ARCHITECTURE DECISION RECORD</p>
        <h1>ADR-${adr.number}：<span>${inline(adr.title)}</span></h1>
        <p class="lead">${inline(adr.lead)}</p>
        <dl class="metadata">
${meta.join("\n")}
        </dl>
      </header>

      <div class="status-guide" role="region" aria-label="ステータスの意味">
        <p class="toc-label">STATUS / ステータスの意味</p>
        <ul>
${STATUS_MEANINGS.map(([status, meaning]) => `          <li><span class="status status-${STATUSES[status]}">${status}</span>${meaning}</li>`).join("\n")}
        </ul>
      </div>

${body.join("\n\n")}
      <footer><span>${inline(adr.footer)}</span><a class="back-to-top" href="#top">ページの先頭へ ↑</a></footer>
    </main>
  </div>
</body>
</html>
`;
}
