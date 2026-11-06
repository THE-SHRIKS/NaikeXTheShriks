# Contributing to Nayki

Thank you for wanting to help. Nayki is open source and in development, and it needs people with different skills. This page explains how to start.

## Who we need

Android developers, backend developers, data and GIS people, designers, accessibility and privacy reviewers, safety and civic teams, and testers in real cities. See the list on the [website](https://nayki.theshriks.space/contribute).

## How to start

1. **Read** the root [README](README.md) and [`nayki-backend/README.md`](nayki-backend/README.md).
2. **Open an issue** and tell us who you are, what you can do and what you would like to pick up. Teams and organisations are welcome.
3. **Fork** the repository and make your change on a branch. Keep it small and focused.
4. **Open a pull request.** Describe what changed and how you checked it.

## Checks before you open a pull request

- Backend: `cd nayki-backend && make test` passes.
- Website: `cd website && npm run build` succeeds.
- No secrets, keys or `.env` files, and no compiled files (`__pycache__`, `*.pyc`, build output).

## Principles every change follows

1. **Never claim a route or place is "safe" or "secure".** Use `lower_risk`, `moderate_risk`, `higher_risk` or `unknown`.
2. **Say when we do not know.** No evidence means `coverage_status: "unavailable"` and a null score. Never invent a high-safety result.
3. **Collect less.** Do not log exact coordinates. Aggregate location data and delete what is not needed.
4. **Label the status.** Say whether something is a prototype, simulated or real. No fake demos.

## Good first jobs

- Connect the Android app to the backend and replace `SampleData`.
- Rename the Android package from `com.example.nayki`.
- Add CI that runs the backend tests on every pull request.
- Evaluate open data sources for one city and document their coverage.
- Run an accessibility review of the existing screens.
- Translate the app strings into a second language.

## Reporting a security problem

Please do not open a public issue for a vulnerability. Email transmission@theshriks.space with the details.

## Contact

Public: [GitHub issues](https://github.com/THE-SHRIKS/NaikeXTheShriks/issues). Direct: transmission@theshriks.space.

Nayki is not an emergency service. In an emergency, call your local emergency number.
