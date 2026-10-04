import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUpRight, Activity, Factory, Gauge, ScanLine, ShieldCheck, Zap } from "lucide-react";
import factoryFloor from "@/assets/factory-floor.jpg";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/lib/factory/queries";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "FactoryPulse — Clarity for every shift" },
    { name: "description", content: "See the signal behind every shift. FactoryPulse turns plant performance, deviations, and operational evidence into clearer decisions." },
    { property: "og:title", content: "FactoryPulse — Clarity for every shift" },
    { property: "og:description", content: "Industrial operations intelligence for the moments that matter on the factory floor." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }), component: Home,
});

function Home() {
  const [progress, setProgress] = useState(0);
  const { data: db } = useDashboard();
  const top = db?.topInvestigation ?? null;
  const topM = top ? db?.machines.find(m => m.id === top.machineId) : undefined;
  const pad = (n?: number) => (n === undefined ? "—" : String(n).padStart(2, "0"));
  useEffect(() => {
    const update = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(height > 0 ? window.scrollY / height : 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
    }), { threshold: 0.12 });
    document.querySelectorAll(".reveal-on-scroll").forEach(el => observer.observe(el));
    return () => { window.removeEventListener("scroll", update); observer.disconnect(); };
  }, []);

  return <div className="home-page">
    <div className="reading-progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
    <header className="landing-header">
      <Link to="/" className="landing-brand" aria-label="FactoryPulse home"><span className="landing-brand-mark"><Factory size={19} /></span><span>FactoryPulse<small>OPERATIONS INTELLIGENCE</small></span></Link>
      <nav aria-label="Landing navigation"><Button asChild variant="hero" size="lg"><Link to="/operations">Open dashboard <ArrowUpRight size={17}/></Link></Button></nav>
    </header>
    <section className="home-hero">
      <img className="home-hero-image" src={factoryFloor} alt="Industrial robotic arms working on a precision manufacturing floor" width={1536} height={1024} />
      <div className="home-hero-shade" />
      <div className="home-hero-content">
        <div className="home-kicker"><span className="signal-dot" /> OPERATIONS INTELLIGENCE <span className="kicker-rule" /> PLANT A / VADODARA</div>
        <h1>FACTORY<br /><span>PULSE.</span></h1>
        <p>See the signal behind every shift. Turn production data into the decisions that keep your floor moving.</p>
        <div className="home-hero-actions">
          <Button asChild variant="hero" size="lg"><Link to="/operations">Open dashboard <ArrowUpRight /></Link></Button>
          <Button asChild variant="heroOutline" size="lg"><a href="#the-signal">Explore the story <ArrowDown /></a></Button>
        </div>
      </div>
      <div className="home-hero-bottom"><span>01 / THE BIGGER PICTURE</span><a href="#the-signal" aria-label="Scroll to the signal"><ArrowDown size={18} /> SCROLL TO EXPLORE</a><span>DEMO ENVIRONMENT · PLANT A</span></div>
    </section>

    <section className="home-intro" id="the-signal">
      <div className="home-section-index reveal-on-scroll"><span>01 — THE SIGNAL</span><span>FROM DATA TO DIRECTION</span></div>
      <div className="intro-grid reveal-on-scroll"><div><span className="home-overline">A DIFFERENT VIEW OF THE FACTORY FLOOR</span><h2>EVERY SHIFT<br />TELLS A <em>STORY.</em></h2></div><div className="intro-aside"><p>Most systems show you what happened. FactoryPulse helps you see what changed, where it matters, and what to investigate next.</p><Link className="home-text-link" to="/operations">Enter the operations overview <ArrowUpRight size={18}/></Link></div></div>
      <div className="home-stat-strip reveal-on-scroll"><div><strong>{pad(db?.machines.length)}</strong><span>MACHINES MONITORED</span></div><div><strong>{db?.metrics[0]?.value ?? "—"}</strong><span>CURRENT PRODUCTION</span></div><div><strong>{pad(db?.activeInvestigationCount)}</strong><span>DEVIATIONS IN FOCUS</span></div><div><strong>{pad(db ? db.statusSummary.INVESTIGATE : undefined)}</strong><span>ACTIVE INVESTIGATION</span></div></div>
    </section>

    <section className="home-feature" id="investigation">
      <div className="home-section-index reveal-on-scroll"><span>02 — IN FOCUS</span><span>ONE SIGNAL. THE FULL PICTURE.</span></div>
      <div className="feature-grid"><div className="feature-copy reveal-on-scroll"><div className="feature-tag"><span className="signal-dot amber" /> ACTIVE INVESTIGATION / M-04</div><h2>DON’T JUST<br />SEE THE<br /><em>DEVIATION.</em></h2><p>Production fell. Downtime climbed. Quality shifted. Follow the evidence from first anomaly to next action, all in one place.</p><Button asChild variant="hero" size="lg"><Link to="/operations">Open dashboard <ArrowUpRight /></Link></Button></div><div className="feature-instrument reveal-on-scroll"><div className="instrument-top"><span>LIVE DEVIATION / M-04</span><ScanLine size={20}/></div><div className="instrument-main"><span>PRODUCTION VARIANCE</span><strong>{topM ? `−${Math.abs(Math.round(topM.baseline.production.deviationPercent))}` : "—"}<small>%</small></strong><div className="instrument-line"><svg viewBox="0 0 600 170" preserveAspectRatio="none" aria-hidden="true"><path className="grid-line" d="M0 36H600 M0 85H600 M0 135H600"/><path className="baseline-line" d="M0 57 L90 60 L175 52 L250 65 L320 58 L390 62 L470 59 L540 57 L600 54"/><path className="signal-line" d="M0 65 L90 62 L175 59 L250 64 L320 74 L370 93 L410 125 L460 137 L515 129 L560 119 L600 124"/></svg></div></div><div className="instrument-bottom"><div><span>DETECTED</span><strong>{top?.detectedAt.replace("Today, ", "") ?? "—"}</strong></div><div><span>PRIORITY SCORE</span><strong>{top ? `${top.priority} / 100` : "—"}</strong></div><div><span>EST. IMPACT</span><strong>{top ? `${top.impact.productionLossUnits} UNITS` : "—"}</strong></div></div></div></div>
    </section>

    <section className="home-explore"><div className="home-section-index reveal-on-scroll"><span>03 — EXPLORE</span><span>BUILT FOR THE NEXT DECISION</span></div><div className="explore-heading reveal-on-scroll"><h2>FOLLOW THE<br /><em>RIGHT SIGNAL.</em></h2><p>From the whole plant to a single machine, move from context to clarity without losing the thread.</p></div><div className="explore-links reveal-on-scroll"><div><span>01</span><Factory/><div><strong>Machines</strong><small>See the state of every asset.</small></div></div><div><span>02</span><ShieldCheck/><div><strong>Quality</strong><small>Find the patterns behind defects.</small></div></div><div><span>03</span><Zap/><div><strong>Energy</strong><small>Track consumption against output.</small></div></div><div><span>04</span><Gauge/><div><strong>What-if</strong><small>Test the impact before acting.</small></div></div></div></section>
    <section className="home-end reveal-on-scroll"><div><Activity size={26}/><span>FACTORYPULSE / PLANT A</span></div><h2>MAKE THE NEXT<br />MOVE <em>COUNT.</em></h2><Button asChild variant="hero" size="lg"><Link to="/operations">Open operations <ArrowUpRight/></Link></Button></section>
    <footer className="home-footer"><span>FACTORYPULSE © 2026</span><span>INDUSTRIAL OPERATIONS INTELLIGENCE</span><span>DEMO DATA · VADODARA</span></footer>
  </div>;
}
