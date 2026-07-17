"use client";

import { useMemo, useState } from "react";

import { leagueProfile } from "@/lib/war-room/league-profile";

type Confidence = "high" | "medium_high" | "medium" | "medium_low" | "low";
type Category = "movement" | "coaching" | "opportunity" | "uncertainty";

type Signal = {
  id: string;
  team: string;
  category: Category;
  type: string;
  title: string;
  thesis: string;
  direction: "up" | "mixed" | "uncertain" | "down";
  confidence: Confidence;
  affected: string;
  fact: string;
  mechanism: string;
  trigger: string;
  source: string;
  sourceUrl: string;
  featured?: boolean;
};

const signals: Signal[] = [
  {
    id: "kc-walker",
    team: "KC",
    category: "opportunity",
    type: "Player + coach",
    title: "Kenneth Walker III",
    thesis: "Lead-back investment meets an open depth chart in an elite scoring environment. The contract is stronger evidence than the coordinator story alone.",
    direction: "up",
    confidence: "high",
    affected: "Walker · Mahomes · Demercado",
    fact: "Three years, up to $45M with $28.7M guaranteed; Isiah Pacheco departed.",
    mechanism: "Premium investment plus an open depth chart creates touch and touchdown leverage.",
    trigger: "Track third-down and two-minute back usage.",
    source: "NFL transactions",
    sourceUrl: "https://www.nfl.com/news/2026-nfl-free-agency-tracker-latest-signings-trades-contract-info-for-all-32-teams",
    featured: true,
  },
  {
    id: "sea-charbonnet",
    team: "SEA",
    category: "opportunity",
    type: "Opportunity",
    title: "Zach Charbonnet",
    thesis: "Walker's exit opens the RB1 lane. Brian Fleury's run-game background supports the shape; camp decides whether the workload follows.",
    direction: "up",
    confidence: "high",
    affected: "Charbonnet · Jadarian Price",
    fact: "Walker departed and ESPN currently lists Charbonnet as Seattle's RB1.",
    mechanism: "A direct vacancy moves Charbonnet from contingent value to projected lead work.",
    trigger: "Confirm health and the first-team carry split.",
    source: "ESPN projections",
    sourceUrl: "https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf",
    featured: true,
  },
  {
    id: "lac-mcdaniel",
    team: "LAC",
    category: "coaching",
    type: "Coach",
    title: "Mike McDaniel system",
    thesis: "Motion and outside zone align with Justin Herbert, Ladd McConkey and Omarion Hampton. This is the cleanest team-level coaching upgrade.",
    direction: "up",
    confidence: "medium_high",
    affected: "Herbert · Hampton · McConkey",
    fact: "Mike McDaniel replaced Greg Roman as offensive coordinator.",
    mechanism: "More motion and outside zone should improve spacing and fit Hampton's strongest run concept.",
    trigger: "Log Hampton's passing-down share and secondary receiver roles.",
    source: "PFF coaching study",
    sourceUrl: "https://www.pff.com/news/fantasy-football-top-3-offensive-playcaller-upgrades",
    featured: true,
  },
  {
    id: "mia-reset",
    team: "MIA",
    category: "uncertainty",
    type: "System reset",
    title: "Discard the old baseline",
    thesis: "New quarterback, coordinator and receiver hierarchy. Achane keeps the opportunity, but Miami's prior efficiency assumptions no longer travel.",
    direction: "uncertain",
    confidence: "low",
    affected: "Willis · Achane · Miami WRs",
    fact: "Malik Willis signed, Jaylen Waddle left, Tua exited and Bobby Slowik became OC.",
    mechanism: "Simultaneous changes widen every passing and efficiency outcome.",
    trigger: "Track designed runs, starting receivers and Achane's route share.",
    source: "NFL transactions",
    sourceUrl: "https://www.nfl.com/news/2026-nfl-free-agency-tracker-latest-signings-trades-contract-info-for-all-32-teams",
    featured: true,
  },
  {
    id: "buf-moore",
    team: "BUF",
    category: "movement",
    type: "Trade",
    title: "DJ Moore to Buffalo",
    thesis: "Buffalo adds an outside target winner beside Khalil Shakir, while Moore reunites with Joe Brady.",
    direction: "up",
    confidence: "medium_high",
    affected: "Moore · Allen · Shakir · Coleman",
    fact: "Buffalo traded a second-round pick for Moore and a fifth-rounder.",
    mechanism: "A credible outside WR1 fills a role the offense had not replaced.",
    trigger: "Compare red-zone targets and Keon Coleman's first-team role.",
    source: "NFL trade report",
    sourceUrl: "https://www.nfl.com/news/bears-trading-wr-dj-moore-to-bills-for-mid-round-draft-pick",
  },
  {
    id: "chi-vacancy",
    team: "CHI",
    category: "opportunity",
    type: "Departure",
    title: "Chicago target consolidation",
    thesis: "Moore's exit raises the target-share ceilings for Rome Odunze and Luther Burden III.",
    direction: "up",
    confidence: "high",
    affected: "Odunze · Burden",
    fact: "DJ Moore was traded to Buffalo.",
    mechanism: "A veteran target earner left without a like-for-like replacement.",
    trigger: "Check whether vacated work consolidates or spreads to tight ends and backs.",
    source: "NFL trade report",
    sourceUrl: "https://www.nfl.com/news/bears-trading-wr-dj-moore-to-bills-for-mid-round-draft-pick",
  },
  {
    id: "den-waddle",
    team: "DEN",
    category: "movement",
    type: "Trade",
    title: "Jaylen Waddle to Denver",
    thesis: "Bo Nix gains another premium weapon, but Waddle and Courtland Sutton now share the same 119-target projection.",
    direction: "mixed",
    confidence: "high",
    affected: "Nix · Waddle · Sutton",
    fact: "Denver sent a major pick package to Miami for Waddle and a fourth-rounder.",
    mechanism: "The passing environment improves while target competition increases.",
    trigger: "Track slot deployment and red-zone targets.",
    source: "NFL transactions",
    sourceUrl: "https://www.nfl.com/news/2026-nfl-free-agency-tracker-latest-signings-trades-contract-info-for-all-32-teams",
  },
  {
    id: "tb-evans",
    team: "TB",
    category: "opportunity",
    type: "Departure",
    title: "Where do Evans' targets land?",
    thesis: "Tampa removed an established red-zone target, raising the ceilings of Emeka Egbuka and Bucky Irving.",
    direction: "up",
    confidence: "high",
    affected: "Egbuka · Irving · Mayfield",
    fact: "Mike Evans signed with San Francisco.",
    mechanism: "High-value targets are available in a younger receiving group.",
    trigger: "Compare first-team and red-zone routes through preseason Week 2.",
    source: "NFL departures",
    sourceUrl: "https://www.nfl.com/news/2026-nfl-free-agency-free-agents-notable-departures-for-all-32-teams",
  },
  {
    id: "tb-irving",
    team: "TB",
    category: "coaching",
    type: "Coach + backfield",
    title: "Bucky Irving's receiving case",
    thesis: "Zac Robinson's arrival and Rachaad White's departure point toward more passing-game work, even with Kenneth Gainwell present.",
    direction: "up",
    confidence: "medium_high",
    affected: "Irving · Gainwell",
    fact: "Robinson became OC; White left; Gainwell signed a two-year deal.",
    mechanism: "The lead role strengthens while passing-down competition remains.",
    trigger: "Track two-minute and third-down back usage.",
    source: "PFF coaching study",
    sourceUrl: "https://www.pff.com/news/fantasy-football-top-5-risers-and-fallers-from-2026-nfl-coaching-changes",
  },
  {
    id: "pit-pittman",
    team: "PIT",
    category: "movement",
    type: "Trade",
    title: "Michael Pittman Jr. joins DK",
    thesis: "Pittsburgh finally gives DK Metcalf a high-volume complement, but the target hierarchy remains price sensitive.",
    direction: "mixed",
    confidence: "medium_high",
    affected: "Pittman · Metcalf · Rodgers",
    fact: "Pittman was acquired and extended for three years and $59M.",
    mechanism: "Pittman adds chain-moving volume while Metcalf retains vertical leverage.",
    trigger: "Measure first-team targets and route depth with Aaron Rodgers.",
    source: "NFL trade report",
    sourceUrl: "https://www.nfl.com/news/michael-pittman-jr-trade-steelers-colts",
  },
  {
    id: "pit-backfield",
    team: "PIT",
    category: "uncertainty",
    type: "Backfield",
    title: "Warren–Dowdle split",
    thesis: "Rico Dowdle's two-year contract turns a clean Jaylen Warren thesis into a role-allocation question.",
    direction: "down",
    confidence: "medium",
    affected: "Warren · Dowdle",
    fact: "Dowdle signed a two-year, $12.25M contract.",
    mechanism: "A credible early-down and goal-line competitor caps touch certainty.",
    trigger: "Log goal-line, third-down and first-series usage.",
    source: "NFL transactions",
    sourceUrl: "https://www.nfl.com/news/2026-nfl-free-agency-tracker-latest-signings-trades-contract-info-for-all-32-teams",
  },
  {
    id: "pit-mccarthy",
    team: "PIT",
    category: "coaching",
    type: "Head coach",
    title: "McCarthy's vertical intent",
    thesis: "Mike McCarthy's history supports deep receiver targets, but quarterback arm strength determines whether the mechanism survives.",
    direction: "up",
    confidence: "medium_low",
    affected: "Metcalf · Rodgers",
    fact: "McCarthy replaced Mike Tomlin as head coach.",
    mechanism: "His previous offenses consistently generated deep WR targets.",
    trigger: "Monitor Metcalf's preseason route tree and Rodgers' downfield attempts.",
    source: "PFF coaching study",
    sourceUrl: "https://www.pff.com/news/fantasy-football-top-5-risers-and-fallers-from-2026-nfl-coaching-changes",
  },
  {
    id: "ten-daboll",
    team: "TEN",
    category: "coaching",
    type: "Coordinator",
    title: "Daboll's slot tendency",
    thesis: "Brian Daboll brings a history of top-10 slot-WR target rates to a rebuilt Tennessee receiver room.",
    direction: "up",
    confidence: "medium",
    affected: "Wan'Dale Robinson · Ward · Tate",
    fact: "Daboll became OC and Tennessee added Robinson.",
    mechanism: "Prior Daboll offenses concentrated meaningful volume in the slot.",
    trigger: "Track Robinson's slot rate and first-team targets.",
    source: "PFF coaching study",
    sourceUrl: "https://www.pff.com/news/fantasy-football-top-5-risers-and-fallers-from-2026-nfl-coaching-changes",
  },
  {
    id: "ten-tate",
    team: "TEN",
    category: "opportunity",
    type: "Draft",
    title: "Carnell Tate arrives at No. 4",
    thesis: "Premium draft investment gives Tate an immediate path to lead-receiver volume for Cameron Ward.",
    direction: "up",
    confidence: "medium",
    affected: "Tate · Ward",
    fact: "Tennessee selected Tate fourth overall; ESPN projects 127 targets.",
    mechanism: "Draft capital and a thin hierarchy create immediate volume potential.",
    trigger: "Check first-team routes and target share.",
    source: "NFL draft report",
    sourceUrl: "https://www.nfl.com/news/2026-nfl-draft-titans-select-ohio-state-wr-carnell-tate-with-no-4-overall-pick",
  },
  {
    id: "atl-stefanski",
    team: "ATL",
    category: "coaching",
    type: "Head coach",
    title: "Stefanski meets Bijan",
    thesis: "Wide-zone and play-action structure fit Atlanta's core personnel; quarterback quality is the limiting variable.",
    direction: "up",
    confidence: "medium",
    affected: "Bijan · London · Pitts",
    fact: "Kevin Stefanski became head coach with Tommy Rees as OC.",
    mechanism: "A wide-zone and play-action framework fits the offense's best players.",
    trigger: "Re-grade after quarterback health and play-action rates clarify.",
    source: "PFF play-caller study",
    sourceUrl: "https://www.pff.com/news/fantasy-football-top-3-offensive-playcaller-upgrades",
  },
  {
    id: "cle-monken",
    team: "CLE",
    category: "coaching",
    type: "Head coach",
    title: "Monken without a QB answer",
    thesis: "The structure can help Harold Fannin Jr. and KC Concepcion, but quarterback uncertainty blocks a team-wide upgrade.",
    direction: "mixed",
    confidence: "medium_low",
    affected: "Fannin · Jeudy · Concepcion",
    fact: "Todd Monken became Cleveland's head coach.",
    mechanism: "His offenses support tight-end touchdowns and downfield concepts.",
    trigger: "Wait for the starting quarterback and first-team target distribution.",
    source: "NFL coaching tracker",
    sourceUrl: "https://www.nfl.com/news/nfl-coaching-gm-tracker-latest-news-interviews-developments-2026-hiring-cycle",
  },
  {
    id: "no-etienne",
    team: "NO",
    category: "movement",
    type: "Signing",
    title: "Travis Etienne gets lead investment",
    thesis: "A four-year deal and current 60% carry projection make Etienne the lead-rusher assumption despite Alvin Kamara.",
    direction: "mixed",
    confidence: "medium",
    affected: "Etienne · Kamara",
    fact: "Etienne signed a four-year, $52M deal.",
    mechanism: "Contract investment supports rushing volume while Kamara can retain passing work.",
    trigger: "Track passing-down and goal-line splits.",
    source: "NFL transactions",
    sourceUrl: "https://www.nfl.com/news/2026-nfl-free-agency-tracker-latest-signings-trades-contract-info-for-all-32-teams",
  },
  {
    id: "sf-evans",
    team: "SF",
    category: "movement",
    type: "Signing",
    title: "Mike Evans joins the 49ers",
    thesis: "San Francisco's red-zone quality rises, while Ricky Pearsall inherits more target competition.",
    direction: "mixed",
    confidence: "medium",
    affected: "Evans · Pearsall · Purdy · McCaffrey",
    fact: "Evans signed a three-year deal with San Francisco.",
    mechanism: "A proven scoring target improves the offense but divides an already crowded tree.",
    trigger: "Track Evans' health and first-team target rate.",
    source: "NFL transactions",
    sourceUrl: "https://www.nfl.com/news/2026-nfl-free-agency-tracker-latest-signings-trades-contract-info-for-all-32-teams",
  },
  {
    id: "ne-receivers",
    team: "NE",
    category: "movement",
    type: "Trade + signing",
    title: "A.J. Brown resets the hierarchy",
    thesis: "Drake Maye gains an alpha target while Romeo Doubs becomes a complementary efficiency and touchdown bet.",
    direction: "up",
    confidence: "medium_high",
    affected: "Brown · Doubs · Maye",
    fact: "New England signed Doubs, then traded for A.J. Brown.",
    mechanism: "Brown establishes a clear WR1 and moves every other receiver into a narrower role.",
    trigger: "Track Doubs' red-zone usage and target hierarchy.",
    source: "NFL Brown trade",
    sourceUrl: "https://www.nfl.com/news/patriots-hc-mike-vrabel-on-a-j-brown-trade-trying-to-improve-our-football-team-in-every-possible-way",
  },
  {
    id: "det-pacheco",
    team: "DET",
    category: "uncertainty",
    type: "Signing",
    title: "Do not overprice Pacheco's name",
    thesis: "A one-year, $1.81M deal signals depth competition, not proof of a major role behind Jahmyr Gibbs.",
    direction: "mixed",
    confidence: "medium",
    affected: "Gibbs · Pacheco",
    fact: "Pacheco joined Detroit after David Montgomery was traded.",
    mechanism: "Low-cost competition can absorb carries without changing the incumbent hierarchy.",
    trigger: "Watch goal-line and second-series usage.",
    source: "NFL transactions",
    sourceUrl: "https://www.nfl.com/news/2026-nfl-free-agency-tracker-latest-signings-trades-contract-info-for-all-32-teams",
  },
  {
    id: "was-white",
    team: "WAS",
    category: "uncertainty",
    type: "Signing",
    title: "Washington's committee warning",
    thesis: "Rachaad White's receiving skill creates a committee and caps certainty for every back in the room.",
    direction: "mixed",
    confidence: "medium",
    affected: "White · Croskey-Merritt · Ford",
    fact: "White signed with Washington; ESPN projects a 33% carry share.",
    mechanism: "Multiple credible specialists make a singular lead role less likely.",
    trigger: "Track third-down and goal-line splits.",
    source: "NFL transactions",
    sourceUrl: "https://www.nfl.com/news/2026-nfl-free-agency-tracker-latest-signings-trades-contract-info-for-all-32-teams",
  },
  {
    id: "sea-fleury",
    team: "SEA",
    category: "coaching",
    type: "Coordinator",
    title: "A broader Seattle target tree",
    thesis: "Brian Fleury's background increases the chance of more tight-end involvement and natural JSN target regression.",
    direction: "mixed",
    confidence: "medium",
    affected: "JSN · AJ Barner · Elijah Arroyo",
    fact: "Fleury arrived from San Francisco's tight-end and run-game staff.",
    mechanism: "A different distribution philosophy can redirect marginal targets to tight ends.",
    trigger: "Track first-team tight-end routes and targets per route.",
    source: "PFF coaching study",
    sourceUrl: "https://www.pff.com/news/fantasy-football-top-5-risers-and-fallers-from-2026-nfl-coaching-changes",
  },
  {
    id: "mia-willis",
    team: "MIA",
    category: "uncertainty",
    type: "Quarterback",
    title: "Malik Willis changes the shape",
    thesis: "Willis adds useful rushing upside while widening Miami's pass-volume and touchdown outcomes.",
    direction: "mixed",
    confidence: "medium",
    affected: "Willis · Achane · Miami receivers",
    fact: "Willis signed for three years and $67.5M with $45M guaranteed.",
    mechanism: "A mobile quarterback adds designed-run value but has not established high passing volume.",
    trigger: "Track designed runs and preseason pass rate.",
    source: "NFL transactions",
    sourceUrl: "https://www.nfl.com/news/2026-nfl-free-agency-tracker-latest-signings-trades-contract-info-for-all-32-teams",
  },
  {
    id: "mia-waddle-vacancy",
    team: "MIA",
    category: "opportunity",
    type: "Departure",
    title: "Miami's target vacancy",
    thesis: "Waddle's departure opens a large target pool, but there is no proven receiver ready to inherit it cleanly.",
    direction: "uncertain",
    confidence: "medium",
    affected: "Miami receivers · Achane",
    fact: "Miami traded Jaylen Waddle to Denver.",
    mechanism: "Vacated targets create opportunity and uncertainty at the same time.",
    trigger: "Identify the starting receiver rotation and Achane's target share.",
    source: "NFL transactions",
    sourceUrl: "https://www.nfl.com/news/2026-nfl-free-agency-tracker-latest-signings-trades-contract-info-for-all-32-teams",
  },
  {
    id: "tb-white",
    team: "TB",
    category: "opportunity",
    type: "Departure",
    title: "White leaves the backfield",
    thesis: "Rachaad White's exit makes Bucky Irving's lead role cleaner, even though Kenneth Gainwell retains standalone receiving value.",
    direction: "up",
    confidence: "medium_high",
    affected: "Irving · Gainwell",
    fact: "White signed with Washington and Gainwell joined Tampa Bay.",
    mechanism: "The incumbent lead loses one established competitor without becoming competition-free.",
    trigger: "Track two-minute and third-down work.",
    source: "NFL departures",
    sourceUrl: "https://www.nfl.com/news/2026-nfl-free-agency-free-agents-notable-departures-for-all-32-teams",
  },
];

const categoryLabels: Record<Category, string> = {
  movement: "Movement",
  coaching: "Coaching",
  opportunity: "Opportunity",
  uncertainty: "Uncertainty",
};

const confidenceLabels: Record<Confidence, string> = {
  high: "High",
  medium_high: "Medium-high",
  medium: "Medium",
  medium_low: "Medium-low",
  low: "Unsettled",
};

const directionLabels = {
  up: "↑ Up",
  mixed: "↕ Mixed",
  uncertain: "↕ Wide",
  down: "↓ Down",
};

type ConfidenceFilter = "all" | "high" | "camp";

export function WarRoom() {
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [selectedId, setSelectedId] = useState("kc-walker");
  const [toast, setToast] = useState(false);

  const selected = signals.find((signal) => signal.id === selectedId) ?? signals[0]!;
  const filteredSignals = useMemo(() => {
    return signals.filter((signal) => {
      const categoryMatch = categoryFilter === "all" || signal.category === categoryFilter;
      const confidenceMatch =
        confidenceFilter === "all" ||
        (confidenceFilter === "high" && ["high", "medium_high"].includes(signal.confidence)) ||
        (confidenceFilter === "camp" && ["medium", "medium_low", "low"].includes(signal.confidence));
      return categoryMatch && confidenceMatch;
    });
  }, [categoryFilter, confidenceFilter]);

  const teamCount = new Set(signals.map((signal) => signal.team)).size;

  function runRefresh() {
    setToast(true);
    window.setTimeout(() => setToast(false), 2400);
  }

  return (
    <div className="war-room-shell site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="FantasyMax War Room home">
          <span className="brand-mark">FM</span>
          <span>
            <strong>FantasyMax</strong>
            <small>Private research desk</small>
          </span>
        </a>
        <nav className="topnav" aria-label="War Room sections">
          <a className="active" href="#signals">Signals</a>
          <a href="#ledger">Signal ledger</a>
          <a href="#method">Method</a>
        </nav>
        <div className="top-actions">
          <span className="as-of">Evidence as of<br />Jul 16, 2026</span>
          <button className="refresh-button" onClick={runRefresh}>Run refresh</button>
        </div>
      </header>

      <div className="workspace" id="top">
        <aside className="left-rail" aria-label="Research index">
          <p className="rail-kicker">Preseason notebook</p>
          <h2 className="season-title">2026<br /><em>War Room</em></h2>
          <p className="season-note">A living evidence layer for movement, opportunity and draft-day conviction.</p>

          <div className="metric-pair" aria-label={`${signals.length} signals across ${teamCount} teams`}>
            <div><strong>{signals.length}</strong><span>signals</span></div>
            <div><strong>{teamCount}</strong><span>teams</span></div>
          </div>

          <div className="research-index">
            <p className="index-title">Research index</p>
            <button className={categoryFilter === "all" ? "active" : ""} onClick={() => setCategoryFilter("all")}>
              <span>00</span><strong>All research</strong><b>{signals.length}</b>
            </button>
            {(Object.keys(categoryLabels) as Category[]).map((category, index) => (
              <button
                className={categoryFilter === category ? "active" : ""}
                key={category}
                onClick={() => setCategoryFilter(category)}
              >
                <span>0{index + 1}</span>
                <strong>{categoryLabels[category]}</strong>
                <b>{signals.filter((signal) => signal.category === category).length}</b>
              </button>
            ))}
            <button className="disabled" disabled><span>05</span><strong>Market gaps</strong><b>—</b></button>
          </div>

          <section className="league-profile" aria-labelledby="league-profile-title">
            <p className="index-title" id="league-profile-title">League model</p>
            <strong>Full PPR</strong>
            <span>2 flex · 4 bench</span>
            <span>4-pt pass TD</span>
            <small>{leagueProfile.roster.activeSlots} starters · {leagueProfile.roster.draftableSlots} draft rounds</small>
          </section>

          <div className="lab-note">
            <strong>Next experiment</strong>
            <p>Join these signals to current ADP and league scoring. Find high-confidence role gains the room has not priced yet.</p>
          </div>
        </aside>

        <main className="main-column">
          <section className="hero" id="signals">
            <div>
              <p className="eyebrow">2026 offseason dossier / experiment 01</p>
              <h1>Draft the <em>delta</em>,<br />not the headline.</h1>
            </div>
            <dl className="hero-meta">
              <div><dt>Research state</dt><dd>Active · {signals.length} claims</dd></div>
              <div><dt>Next checkpoint</dt><dd>Camp opens</dd></div>
            </dl>
          </section>

          <div className="control-row">
            <div className="filters" role="group" aria-label="Confidence filter">
              {(["all", "high", "camp"] as ConfidenceFilter[]).map((filter) => (
                <button
                  key={filter}
                  className={confidenceFilter === filter ? "active" : ""}
                  onClick={() => setConfidenceFilter(filter)}
                  aria-pressed={confidenceFilter === filter}
                >
                  {filter === "all" ? "All signals" : filter === "high" ? "High confidence" : "Needs camp"}
                </button>
              ))}
            </div>
            <div className="legend" aria-label="Confidence legend">
              <span><i className="dot high" />High</span>
              <span><i className="dot medium" />Medium</span>
              <span><i className="dot low" />Unsettled</span>
            </div>
          </div>

          <section className="active-dossier" aria-label="Selected signal evidence">
            <p className="section-label">Selected signal</p>
            <article className="selected-evidence selected-evidence-main" aria-live="polite">
              <header className="dossier-header">
                <div>
                  <div className="selected-heading">
                    <span>{selected.team} · {selected.type}</span>
                    <b>{directionLabels[selected.direction]}</b>
                  </div>
                  <h2 id="selected-signal-title">{selected.title}</h2>
                  <p>{selected.thesis}</p>
                </div>
                <span className={`confidence-pill ${selected.confidence}`}>
                  {confidenceLabels[selected.confidence]} confidence
                </span>
              </header>

              <div className="evidence-chain-grid">
                <div className="evidence-step">
                  <span>01 · Fact</span>
                  <p>{selected.fact}</p>
                </div>
                <div className="chain-arrow" aria-hidden="true">→</div>
                <div className="evidence-step">
                  <span>02 · Mechanism</span>
                  <p>{selected.mechanism}</p>
                </div>
                <div className="chain-arrow" aria-hidden="true">→</div>
                <div className="evidence-step draft-direction">
                  <span>03 · Draft direction</span>
                  <strong className={`direction ${selected.direction}`}>{directionLabels[selected.direction]}</strong>
                  <p>{selected.affected}</p>
                </div>
              </div>

              <footer className="dossier-footer">
                <div className="review-trigger">
                  <span>Review trigger</span>
                  <p>{selected.trigger}</p>
                </div>
                <a href={selected.sourceUrl} target="_blank" rel="noreferrer">Open {selected.source} ↗</a>
              </footer>
            </article>
          </section>

          {filteredSignals.length === 0 && (
            <div className="empty-state">No signals match both filters. Try another research lens.</div>
          )}

          <section className="ledger" id="ledger">
            <div className="ledger-head">
              <div><p>Signal ledger</p><span>{filteredSignals.length} visible claims</span></div>
              <strong>Fact → Mechanism → Draft direction</strong>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr><th>Team</th><th>Subject</th><th>Affected players</th><th>Direction</th><th>Confidence</th><th>Review trigger</th></tr>
                </thead>
                <tbody>
                  {filteredSignals.map((signal) => (
                    <tr key={signal.id} className={selected.id === signal.id ? "selected-row" : ""} onClick={() => setSelectedId(signal.id)}>
                      <td><strong>{signal.team}</strong></td>
                      <td><button onClick={() => setSelectedId(signal.id)}>{signal.title}</button></td>
                      <td>{signal.affected}</td>
                      <td><span className={`table-direction ${signal.direction}`}>{directionLabels[signal.direction]}</span></td>
                      <td><span className={`confidence-pill ${signal.confidence}`}>{confidenceLabels[signal.confidence]}</span></td>
                      <td>{signal.trigger}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>

        <aside className="right-rail" aria-label="Watch triggers and research method">
          <section className="watch-list">
            <p className="section-label">Watch triggers / 04 open</p>
            {signals.filter((signal) => ["kc-walker", "mia-reset", "tb-evans", "sea-charbonnet"].includes(signal.id)).map((signal) => (
              <button key={signal.id} onClick={() => setSelectedId(signal.id)}>
                <span><strong>{signal.team} · {signal.category === "uncertainty" ? "OFF" : "ROLE"}</strong><b>{signal.id === "tb-evans" ? "PRE W2" : "CAMP"}</b></span>
                <h3>{signal.trigger}</h3>
              </button>
            ))}
          </section>

          <section className="method-card" id="method">
            <h2>The evidence chain</h2>
            <div><span>Fact</span><b>→</b><span>Mechanism</span><b>→</b><span>Signal</span></div>
            <p>No arbitrary coach bump. Every adjustment remains inspectable and expires when its review trigger contradicts it.</p>
          </section>

          <section className="sources">
            <p className="section-label">Connected sources</p>
            <a href="https://www.nfl.com/news/2026-nfl-free-agency-tracker-latest-signings-trades-contract-info-for-all-32-teams" target="_blank" rel="noreferrer"><i />NFL transactions<span>Live</span></a>
            <a href="https://g.espncdn.com/s/ffldraftkit/26/NFLDK2026_CS_ClayProjections2026.pdf" target="_blank" rel="noreferrer"><i />ESPN projections<span>Jul 09</span></a>
            <a href="https://www.pff.com/news/fantasy-football-top-5-risers-and-fallers-from-2026-nfl-coaching-changes" target="_blank" rel="noreferrer"><i />PFF coaching study<span>Read</span></a>
          </section>
        </aside>
      </div>

      <div className={`toast ${toast ? "show" : ""}`} role="status" aria-live="polite">Research refresh queued · 4 watch triggers</div>
    </div>
  );
}
