# Recommended GitHub repository settings

These controls cannot be enforced by source files alone. A repository
administrator should configure them before a public release.

## Default branch rules

Protect `main` and require:

- pull requests instead of direct pushes;
- at least one approving review, including CODEOWNERS where available;
- dismissal of stale approvals after new commits;
- resolution of review conversations;
- the `CI / verify` status check;
- branches to be up to date before merge;
- signed commits when the contributor workflow supports them;
- no force pushes and no branch deletion.

## Security settings

- Enable private vulnerability reporting.
- Enable Dependabot alerts and security updates.
- Enable secret scanning and push protection where the repository plan allows.
- Enable code scanning for JavaScript/TypeScript when GitHub Advanced Security
  is available. Keep the required code-scanning check in branch rules.
- Restrict Actions to trusted publishers and review third-party actions before
  use.

## Release evidence

For every release, retain the CI run, browser-test report, dependency-audit
result, reviewer approval, version tag, and deployment/rollback record. GitHub
settings complement, but never replace, the backend controls in
`API_CONTRACT.md` and `COMPLIANCE.md`.
