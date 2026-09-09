# Test Scenarios

This directory contains human-readable test scenario documentation in Gherkin format. These files serve as the offline reference for all test cases in the Qase TC project.

## Purpose

- Source of truth for QA intent, readable by developers, PMs, and stakeholders
- Input for the `test-scenario-creator` agent when syncing to Qase
- Reference for manual exploratory testing sessions
- Changelog for test coverage evolution

## Structure

```
tests/e2e/scenarios/
├── README.md                  ← this file
├── auth-scenarios.md          ← registration, login, password reset, token security
├── enrollment-scenarios.md    ← course discovery, enrollment, access control
├── cms-scenarios.md           ← admin content management, block publishing
└── payment-scenarios.md       ← checkout, coupons, refunds, payment failure
```

## Format

All scenario files use Gherkin syntax:

```gherkin
Feature: <Feature Name>

  Background:
    Given <shared precondition>

  Scenario: <Scenario title>
    Given <precondition>
    When <action>
    And <additional action>
    Then <expected outcome>
    And <additional assertion>
```

## Severity Tags

Scenarios are tagged with:

- `@blocker` — system cannot function without this
- `@critical` — core user journey, must pass before release
- `@major` — important but has a workaround
- `@normal` — standard functional coverage
- `@minor` — edge case, cosmetic, or rare path
- `@security` — security and auth-related test
- `@smoke` — minimal set to verify a deployment is alive

## Roles

The TestCraft platform has four user roles:

| Role | Description |
|------|-------------|
| `STUDENT` | Enrolled learner |
| `INSTRUCTOR` | Course creator and teacher |
| `ADMIN` | Tenant/organization admin |
| `SUPER_ADMIN` | Platform-level superuser |

## Syncing to Qase

To create these scenarios as test cases in Qase TC project, invoke the test-scenario-creator agent:

```
/agent:test-scenario-creator Create test cases from tests/e2e/scenarios/auth-scenarios.md
```

Or ask it directly:

```
Generate Qase test cases for the auth module
```

## Updating Scenarios

1. Edit the relevant `.md` file in this directory
2. Re-run the `test-scenario-creator` agent to sync changes to Qase
3. Commit the `.md` file alongside any code changes it covers
