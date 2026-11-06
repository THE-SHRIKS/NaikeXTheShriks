<div align="center">

<img src="assets/banner.svg" alt="Nayki" width="760">

### Know what the route knows.

**Open-source, Android-first safety navigation. Built by [THE SHRIKS](https://github.com/THE-SHRIKS).**

`status: in development` · `android: kotlin + compose` · `backend: fastapi + postgis`

[Website](https://nayki.theshriks.space) · [How it works](https://nayki.theshriks.space/how-it-works) · [Run it](#run-it) · [Contribute](#build-this-with-us)

</div>

---

## What Nayki is

Most maps give you one line and a time. Nayki is built to show the line, the alternatives and **the evidence behind each**: lighting, nearby help, reported incidents and time of day. You compare routes and choose.

Nayki follows one rule above all others: **it never says a route or place is "safe".** It reports risk as `lower_risk`, `moderate_risk`, `higher_risk` or `unknown`, with a confidence value, an evidence count and a coverage status. When there is no evidence, the answer is `unavailable`, not an invented comfort.

> Nayki is not an emergency service. In an emergency, call your local emergency number.

## Where things honestly stand

| Part | Status | What that means |
| :-- | :-- | :-- |
| Android app (`app/`) | Prototype | Jetpack Compose screens for map, search, route comparison, heatmap, help layer, incident report, SOS and profile. They run on sample data. |
| Backend API (`nayki-backend/`) | In the repository | FastAPI, PostgreSQL with PostGIS, Redis, Alembic migrations and a test suite. |
| App to API link | Not yet | The app does not call the backend yet. Connecting them is the first big job. |
| Real safety data | Not yet | Integrations for Google Places and Routes, GraphHopper and OpenStreetMap exist in code. No city has coverage today. |

## What's inside

```
NaikeXTheShriks
├── app/              Android app (Kotlin, Jetpack Compose)
├── nayki-backend/    FastAPI service, migrations, tests, Docker setup
└── website/          The public website (Astro), deployed to nayki.theshriks.space
```

## The risk model

Every route and area carries its evidence:

| Field | Meaning |
| :-- | :-- |
| `risk_level` | `lower_risk`, `moderate_risk`, `higher_risk` or `unknown` |
| `confidence` | 0.0 to 1.0, how far to trust the level |
| `evidence_count` | How many records stand behind the answer |
| `coverage_status` | `unavailable`, `limited`, `moderate` or `strong` |
| `risk_reasons` | `poor_lighting`, `recent_incident`, `isolated_road`, `limited_data`, `help_far_away`, `night_time`, `government_data`, `user_reports_unverified` |

With no evidence, the backend returns `coverage_status: "unavailable"`, low confidence and a null safety score.

## Privacy rules in the code

- Exact coordinates are stripped from logs. Only H3 cells or general regions may be logged.
- Client IP addresses are hashed (SHA-256) before they reach the audit table.
- Nearby incidents are grouped onto H3 cells so people who report a hazard are not pinpointed.
- Endpoints exist for exporting your data and deleting your account.

## Run it

**Backend** (needs Docker):

```bash
cd nayki-backend
cp .env.example .env
make dev            # or: docker compose up --build
```

API docs open at `http://localhost:8000/docs`. Run the tests with `make test`. Full notes are in [`nayki-backend/README.md`](nayki-backend/README.md).

**Android app:** open the repository root in Android Studio, let Gradle sync, and run the `app` module.

**Website:**

```bash
cd website
npm install
npm run dev
```

## Build this with us

Nayki needs more hands than one team has. We are looking for:

- **Android developers** (Kotlin, Compose) to connect the app to the API and make SOS dependable.
- **Backend developers** (FastAPI, PostGIS, H3) to harden endpoints, add CI and improve the safety engine.
- **Data and GIS people** to judge which open and government datasets are trustworthy.
- **Designers and accessibility reviewers** for clear risk language and calm, usable screens.
- **Safety, civic and NGO teams** to tell us what is missing and what could cause harm.
- **Privacy and security reviewers**, and **testers in real cities**.

Good first jobs:

1. Connect the Android app to the backend and replace the sample data.
2. Rename the Android package from `com.example.nayki`.
3. Add CI that runs the backend tests on every pull request.
4. Evaluate open data sources for one city and document their coverage.
5. Run an accessibility review of the existing screens.

Open an [issue](https://github.com/THE-SHRIKS/NaikeXTheShriks/issues/new) to introduce yourself, or read [CONTRIBUTING.md](CONTRIBUTING.md). Teams and organisations can write to transmission@theshriks.space.

## Principles

1. **Never claim "safe".** Not in code, copy or marketing.
2. **Say when we do not know.** No data means `unavailable`.
3. **Collect less.** Location is sensitive. Keep it out of logs and aggregate it.
4. **Label the status.** Prototype, simulated or real: documents and screens say which.

## Notes

Nayki is a work in progress. Interfaces and folder layout may change, and it should not be relied on for personal safety decisions yet.

<div align="center">

---

**Nayki** · open-source safety navigation by **THE SHRIKS**

</div>
