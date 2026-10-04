# FactoryPulse

### Operations Intelligence for Manufacturing Teams

FactoryPulse is a decision-support prototype designed to help manufacturing teams move from **"what happened?"** to **"what should we investigate next?"**

It brings production, downtime, quality, and energy signals into one operational view and highlights the machines and deviations that deserve attention.

> **Prototype status:** Functional demonstration using seeded/demo data. No production database or live factory connection is required.

---

## 1. What FactoryPulse Does

FactoryPulse focuses on one core operational flow:

**Detect → Prioritize → Investigate → Simulate → Decide**

The prototype allows a user to:

1. View the current plant operating picture.
2. Identify the most significant machine deviation.
3. Open an investigation for the affected machine.
4. Review production, downtime, quality, and energy evidence.
5. Explore defect and machine-level patterns.
6. Run a simple "What-if" scenario before taking action.
7. Understand the estimated operational and financial impact.

The goal is not to replace an MES, ERP, historian, or maintenance system.

Instead, FactoryPulse acts as an **operational intelligence layer** that helps a decision-maker determine where attention should go first.

---

## 2. Core User Flow

### Plant Overview

The user starts at the plant-level overview.

The dashboard surfaces:

- Production performance
- Downtime
- Defect rate
- Energy consumption
- Active investigation
- Estimated operational impact

The prototype intentionally puts the most important deviation in focus instead of forcing the user to interpret multiple disconnected dashboards.

### Investigation

The user can select a machine and open its investigation view.

The investigation brings together relevant signals such as:

- Production deviation
- Downtime
- Defects
- Energy
- Supporting evidence

This creates a single context for understanding why a machine deserves attention.

### Quality

The Quality view provides:

- Overall defect rate
- Defect units
- Baseline comparison
- Defect categories
- Machine-level defect contribution

### What-If Simulation

The What-If simulator allows the user to explore the estimated effect of a potential maintenance decision.

For example:

> What happens if M-04 is stopped for maintenance?

The prototype estimates:

- Production impact
- Energy impact
- Potential avoided loss

The results are clearly presented as estimates based on the seeded scenario assumptions.

---

## 3. What We Built

### One primary flow

**Plant signal → anomaly prioritization → machine investigation → evidence review → what-if decision support**

This is the deliberately narrow scope of the prototype.

The prototype does **not** attempt to provide:

- Full predictive maintenance
- Live machine control
- Automated maintenance scheduling
- Production planning
- ERP functionality
- Real-time industrial IoT connectivity
- Autonomous operational decisions

Keeping the scope narrow allows the prototype to demonstrate the decision-support concept clearly.

---

## 4. Technology

The prototype is implemented as a modern web application.

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Component-based UI architecture

### Data

The prototype uses **seeded demo data** rather than a production database.

This was intentional for the assessment prototype because it makes the application:

- Easy to run
- Deterministic
- Reproducible
- Independent of external services
- Safe to demonstrate without credentials

### Calculations

Operational metrics and What-If outputs are calculated from the seeded dataset and defined calculation rules.

There is no dependency on a live manufacturing data source.

---

## 5. Demo Data

The application represents a fictional manufacturing environment:

**Plant A — Vadodara**

The seeded environment contains machine-level operational signals used to demonstrate the workflow.

Example signals include:

- Production
- Downtime
- Defects
- Energy
- Machine performance
- Baseline comparisons

The data is intentionally synthetic/demo data and should **not** be interpreted as real production data from an operating factory.

---

## 6. Example Investigation

The prototype highlights **Machine M-04** as an active investigation.

The scenario demonstrates a machine with:

- Production deterioration
- Increased downtime
- Increased defects
- Increased energy usage

The dashboard then estimates the contribution of the deviation and allows the user to investigate the machine further.

This example is designed to demonstrate the product's reasoning flow rather than claim that the numbers represent a real factory.

---

## 7. What-If Calculation

The What-If simulator demonstrates how an operational decision can be explored before action.

Example:

**Scenario:** Stop M-04 for maintenance.

The simulator uses the current seeded production and energy rates together with the selected maintenance duration to estimate:

- Lost production
- Energy impact
- Potential avoided loss

These values are **scenario estimates**, not forecasts or guarantees.

The interface explicitly communicates this distinction to the user.

---

## 8. Running Locally

### Prerequisites

Install:

- Node.js 18+
- npm

### Installation

Clone the repository:

```bash
git clone <YOUR-GITHUB-REPOSITORY-URL>
cd <PROJECT-FOLDER>
