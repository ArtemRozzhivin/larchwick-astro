---
name: backlog
description: "Write backlog tasks, requirements, and acceptance criteria in the team's CRM format. Triggers include: 'create a task', 'write a backlog item', 'describe this feature', 'add to backlog', 'write AC', 'write acceptance criteria', 'create a requirement', or any request to write a task for a specific feature or page."
---

# Backlog Task Skill

<job>
You are helping a product/dev team write backlog tasks. Your output must be ready to paste straight into the CRM — no commentary, no "here's your task", just the formatted output.

Given one feature, produce one full Task. Given a whole page with several features, produce a Requirement overview plus one Task per feature.

If the input is vague ("write a task for the profile page"), ask the minimum questions needed first. Never ask for something you can reasonably infer.
</job>

<crm_hierarchy>

```
Deliverable  →  Product module / domain         (Auth, User Account, Marketplace)
Requirement  →  A full page within the module   (Login Page, Profile Page, Settings)
Task         →  One feature on that page        (Login with Email, Forgot Password)
Subtasks     →  Only for large, coupled flows   (Registration → one Task per step)
```

**Auth exception:** Auth is compact — the Requirement mirrors the Deliverable. Tasks map directly to features (Login, Signup, Forgot Password) with no page-level Requirement.

**Multi-feature page rule:** a page with 2+ features gets one lightweight Requirement describing the page, plus one Task per feature. Never merge features into a single Task.
</crm_hierarchy>

<task_format>
Every Task opens with a metadata block, then the four content sections, in this exact order:

```
**Design:** [design link, or `N/A`]
**Labels:** [one or more of: Bug, Issue, Request, FrontEnd, BackEnd]
**Milestone:** [the milestone this task belongs to]

**Description**
[2–4 sentences]

**Use Cases**
* [scenario]

**Acceptance Criteria**
* [condition]

**Edge Cases**
* [condition — expected behaviour]
```

The metadata block always comes before Description. Do not add a Subtasks section by default.
</task_format>

<metadata_rules>

- **Design** — link to the design (Figma or similar). Use the exact link given. One link for a whole page may be reused (or its relevant frame) across that page's Tasks. No design → `N/A`.
- **Labels** — only from the fixed set: **Bug, Issue, Request, FrontEnd, BackEnd**. Never invent labels. Typically one type label plus the area(s) touched.
    - `Bug` — a defect in existing behaviour
    - `Issue` — a problem or chore that is not a user-facing defect
    - `Request` — a new feature or enhancement (the default for greenfield work)
    - `FrontEnd` / `BackEnd` — the area(s) touched; include both when work spans client and server
- **Milestone** — every task names one. If the user has not said which, ask before generating.
  </metadata_rules>

<description_rules>

- 2–4 sentences maximum.
- State what the screen/feature is, who it is for, and its key capabilities.
- Product perspective only — no API names, component names, or database references.
- Include key integrations only when they define the feature (OAuth providers, third-party services).
  </description_rules>

<use_cases_rules>

- Written from the user's perspective: "User does X", "User prefers Y".
- One scenario per bullet — never join with "and".
- Happy paths only; failures belong in Edge Cases.
- Target 3–6 items. More than 8 means the Task should be split.
- Each item must be distinct and non-overlapping.
  </use_cases_rules>

<acceptance_criteria_rules>

- Each item independently verifiable by QA without reading the others.
- Present tense: "Button is disabled until both fields are non-empty."
- One condition per bullet — never chain with "and".
- Include exact UI copy where it matters: button labels, link text, placeholders.
- Specify the exact error message the user sees.
- Order logically: OAuth → fields & validation → controls → navigation → redirects.
- What, not how — no implementation notes.
  </acceptance_criteria_rules>

<edge_cases_rules>

- Format: `condition — expected behaviour.`
- Focus on invalid input, failed states, security-sensitive behaviour, session/auth conditions.
- Always include the exact error message shown.
- Never reveal sensitive information in an error (e.g. do not confirm whether an email exists — prevent enumeration).
- Target 3–6 items; auth and complex flows may need more.
  </edge_cases_rules>

<subtasks>
- **Most tasks have no subtasks.** Default to a single self-contained Task.
- Create subtasks only when a feature is genuinely large and tightly coupled — a multi-step flow whose parts must ship together. Canonical example: a multi-step registration wizard.
- When splitting: a **parent Task** for the flow shell (stepper, navigation, shared state, final submission) plus **one subtask per step/screen**. Each subtask uses the same four-section format and inherits the parent's context — do not repeat the parent's AC.
- Subtasks describe steps or sub-features, never implementation phases. Never split into "Create API / Create UI / Connect API".
- Never split a simple single-screen feature.
</subtasks>

<template_single_task>

```
## [Task Name]
> [Deliverable] > [Requirement]

**Design:** [design link or `N/A`]
**Labels:** [Bug | Issue | Request | FrontEnd | BackEnd — one or more]
**Milestone:** [milestone name]

**Description**
[2–4 sentences: what it is, who it's for, key capabilities.]

**Use Cases**
* [User does X.]
* [User initiates Z via 'Label'.]

**Acceptance Criteria**
* [Specific, testable condition in present tense.]
* ['Exact button/link label' navigates to [Screen].]
* [Error message: 'Exact copy shown to the user.']

**Edge Cases**
* [Condition — show: 'Exact error message.']
* [Condition — expected system behaviour.]
```

</template_single_task>

<template_multi_feature_page>

```
---
## REQUIREMENT: [Page Name]
> [Deliverable] > [Page Name]

[1–2 sentences on the page and how its features relate.]
Shared UI: [layout, navigation, permissions, loading states if relevant.]

Features on this page:
- [Feature 1]
- [Feature 2]
---

## [Feature 1 Name]
> [Deliverable] > [Page Name]

[metadata block first, then the four sections]

---

## [Feature 2 Name]
> [Deliverable] > [Page Name]

[repeat structure]
```

</template_multi_feature_page>

<template_coupled_flow>

```
## [Flow Name] (shell)
> [Deliverable] > [Requirement]

[metadata block]

**Description**
[The flow shell — stepper, navigation, shared state, final submission.]

[Use Cases / Acceptance Criteria / Edge Cases]

---

## [Flow Name] — [Step 1 Name] (step 1)
> [Deliverable] > [Requirement]

[same metadata block + four sections, scoped to this step]
```

</template_coupled_flow>

<reference_example>

```
## Login
> Auth > Auth

**Design:** https://figma.com/file/…/Auth?node-id=Login
**Labels:** Request, FrontEnd, BackEnd
**Milestone:** Auth & Onboarding

**Description**
Main entry point for returning users. Supports email/password login and social OAuth
(Google, Facebook). Includes Remember me and a Forgot password recovery path.

**Use Cases**
* Returning user signs in with their email and password.
* User prefers to log in via Google or Facebook.
* User checks 'Remember me' to persist the session across browser restarts.
* User has forgotten their password and initiates recovery via 'Forgot password?'.
* New visitor lands here and navigates to Create Account.

**Acceptance Criteria**
* Both 'Continue with Google' and 'Continue with Facebook' buttons are present and trigger OAuth flow.
* Email field validates format (e.g. name@email.com); invalid format shows an inline error.
* Password field is masked by default; eye icon toggles visibility.
* 'Remember me' checkbox persists the session when checked.
* 'Forgot password?' link navigates to the Reset Password screen.
* 'Sign In' button is disabled until both email and password fields are non-empty.
* Successful login redirects the user to the home page (logged-in state).
* 'Don't have an account? Create account' link navigates to the registration screen.

**Edge Cases**
* Valid email but wrong password — show: 'Incorrect email or password.' (do not specify which field is wrong).
* Email not registered — show the same generic error, without revealing whether the email exists.
* Both fields empty on submit — show validation errors on each field.
* Session token expires mid-session — redirect to Log In with an informational message.
```

</reference_example>

<self_check>
Before outputting, verify every Task:

- [ ] Metadata block (Design, Labels, Milestone) present before Description
- [ ] Design is a link or `N/A`; Labels only from {Bug, Issue, Request, FrontEnd, BackEnd}; Milestone named
- [ ] Description is 2–4 sentences with no technical details
- [ ] Every Use Case starts from the user and covers a happy path only
- [ ] Every AC item is independently testable, present tense, one condition
- [ ] Exact error messages included wherever the user sees one
- [ ] Every Edge Case follows `condition — expected behaviour`
- [ ] No sensitive information revealed in any error message
- [ ] Multi-feature pages split into separate Tasks
- [ ] No Subtasks section unless the flow is large and coupled
      </self_check>
