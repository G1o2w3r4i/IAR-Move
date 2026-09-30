# Workspace Rules, Constraints & Project Architecture

## 1. Strictly Read-Only Backup Directories (Critical Constraint)

The following folders are strictly preserved for **read-only reference**:
- `Backup_IAR-components/` (Source for J&J brand theme & standardized UI components)
- `Backup_JNJ_IAR/` (Source for audit business logic, workflows, and mock schemas)

### Strict Guidelines:
1. **NEVER write, edit, rename, move, delete, or modify** any files or folders inside `Backup_IAR-components` or `Backup_JNJ_IAR`.
2. Both directories are strictly preserved for **read-only reference**.
3. All new work, development, modifications, and project files must be created outside these two directories.

---

## 2. Project Overview & Scope

- **Application Name**: **IAR (Intelligent Audit Reporting)**
- **Platform Stack**:
  - **Frontend**: **Power Apps Code App** (React & TypeScript)
  - **Data Storage**: **Microsoft Dataverse** (relational database for all entities)
  - **Integration & Automations**: **Power Automate** (Instant HTTP flows for UI buttons; Scheduled flows for batch jobs)
  - **File & Big Data Storage**: **SharePoint Online** (workpapers, evidence, PDF reports) and **Azure Data Lake Storage / ADLS Gen2** (forensic logs, ERP sample extracts)
- **Module & Navigation Boundaries**:
  - Top Navigation includes all 6 phases: `Pre-Planning`, `Planning`, `Fieldwork`, `Reporting`, `Wrap-up`, `Dashboards`.
  - **Current Development Scope**: Fully implement the **Reporting Module** with all workflows, AI generation, review tiers, and business responses. The other 5 phases remain as standby placeholder views.

---

## 3. Requirements & Architecture Documentation Index

Always refer to the following project specifications located in `docs/`:

1. [docs/REQUIREMENTS.md](file:///d:/IAR/docs/REQUIREMENTS.md) — Master High-Level Requirements & System Architecture.
2. [docs/REFERENCE_MAPPING.md](file:///d:/IAR/docs/REFERENCE_MAPPING.md) — Master Repository Cross-Reference & Source Mapping (Mock JSON $\rightarrow$ Dataverse, Button actions $\rightarrow$ Power Automate).
3. [docs/FRD_REPORTING_MODULE.md](file:///d:/IAR/docs/FRD_REPORTING_MODULE.md) — Detailed Functional Requirements for Reporting (Audit Queue, Workpapers, AI Synthesis, State Machine, Business Response Loop, Sign-Offs, Comments).
4. [docs/UI_DESIGN_HARMONIZATION_SPEC.md](file:///d:/IAR/docs/UI_DESIGN_HARMONIZATION_SPEC.md) — Corporate Brand Standards, Colors, Typography & Standardized UI Components (`SharedTable`, `SharedAccordion`, `SharedButton`, inputs).
5. [docs/DATAVERSE_SCHEMA_SPEC.md](file:///d:/IAR/docs/DATAVERSE_SCHEMA_SPEC.md) — Foundational Dataverse Data Model, Entities, and OptionSets.
6. [docs/INTEGRATION_AUTOMATION_SPEC.md](file:///d:/IAR/docs/INTEGRATION_AUTOMATION_SPEC.md) — Foundational Power Automate Flow Contracts, SharePoint Folders, and ADLS Containers.

---

## 4. Architectural & Domain Best Practices

### 4.1 UI & Design System Consistency
- **Strict Brand Styling**: All UI components must adhere to the J&J brand palette:
  - Primary Blue (`#000099`), Primary Red (`#eb1700`), Dark Text (`#212121`), Border Grey (`#d8d8d8`), Background (`#f4f4f4`).
  - Typography: `"jj-circular", Arial, Helvetica, sans-serif`.
- **Corporate Header Chrome & Brand Assets**:
  - **Logo & Subtitle**: Authentic signature `jj-logo.png` on the top-left with `GA&A INTERNAL AUDIT REPORTING` in bold uppercase subtitle.
  - **Active Navigation Indicator**: Thick J&J Red (`#eb1700`, 4px height) underline indicator positioned directly beneath the active navigation label with clean white clearance separating it from the blue ribbon.
  - **Sub-Header Blue Ribbon**: Full-width repeating blue patterned ribbon (`header-bg.png`, 13px height, `repeat-x`) directly beneath the white header with elevation drop shadow (`box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08)`).
  - **User Profile Widget**: Circle user silhouette outline icon, display name (e.g. `Tamilselvan`), and chevron down for persona switching.
- **Reusable Component Consumption**: Always utilize the standardized components based on `Backup_IAR-components/src/components/shared/`:
  - Tables $\rightarrow$ `SharedTable` (with sorting, pagination, and `.strength` risk dots).
  - Collapsible finding sections $\rightarrow$ `SharedAccordion`.
  - Action buttons $\rightarrow$ `SharedButton` (`contained` blue, `outlined` red border, `text` bright blue).
  - Form fields $\rightarrow$ `SharedTextInput`, `SharedTextArea`, `SharedSelect` (with red chevron), `SharedMultiSelect`, `SharedAutocomplete`, `SharedFieldLabel`, `SharedFieldError`.

### 4.2 Business Logic & Governance Enforcement
- **State Machine Fidelity**: Strictly follow the 5-tier review workflow and status progression defined in `FRD_REPORTING_MODULE.md`:
  `Pending Staff` $\rightarrow$ `Pending TC` $\rightarrow$ `Pending Manager` $\rightarrow$ `Pending with Business` $\rightarrow$ `Ready for Director Submission` $\rightarrow$ `Pending Director` $\rightarrow$ `Pending VP` / Sign-off.
- **Criticality Escalation Gate**: Never bypass the VP sign-off rule when an engagement contains $\ge 1$ Critical issue.
- **AI Versioning & Comparison**: Preserve immutable generation records in `cr_issue_ai_version` and support side-by-side comparison and field-by-field hybrid merge.
- **Strict Comment Resolution Locks**: For tagged `@mention` comments, ensure only the tagged user can resolve the thread.
- **Regulatory Audit Trail**: Ensure every state advancement, AI adoption, and sign-off writes an immutable entry to `cr_audit_trail_log`.

---

## 5. Power Apps Code Apps & Codebase Engineering Best Practices

### 5.1 Clean Architecture & Service Layer Abstraction
- **Decoupled Data Services**: Never bind UI components directly to raw API fetches or static JSON files. Implement a clean service abstraction layer (`services/`):
  - `dataverseService.ts`: Centralizes Dataverse Web API OData queries, CRUD operations, and pagination.
  - `flowService.ts`: Centralizes Power Automate HTTP trigger invocations (AI synthesis, workflow progression, notifications).
  - `storageService.ts`: Encapsulates SharePoint file uploads/downloads and ADLS queries.
- **Local Dev vs. Power Apps Runtime Adapter (Dual-Mode)**:
  - Implement an environment-aware Data Provider interface (`IDataProvider`).
  - When running locally in Vite (`import.meta.env.DEV`), initialize the application using mock/seed adapters that mirror Dataverse entity structures.
  - When deployed inside Power Apps Code App context, seamlessly switch to native Dataverse Web API / PCF WebApi context without code refactoring.

### 5.2 State Management & Performance Optimization
- **Predictable Central Store**: Manage global application state (active assessment, active engagement, user persona/role, drawer visibility) using a unified React Context or custom hook architecture.
- **Prevent Unnecessary Re-Renders**:
  - Audit workpapers contain extensive text fields and collapsible sections. Use `React.memo`, `useMemo`, and `useCallback` for finding cards, list items, and table rows to prevent lag during rapid keystrokes.
  - Use debouncing (300ms) on search inputs and auto-save fields.
- **Optimistic UI with Rollback**: For status transitions and comment resolution, update UI state optimistically while dispatching the background service call; rollback cleanly and toast an alert if the service returns an error.

### 5.3 Dataverse OData & Power Automate Best Practices
- **Lean OData Queries**:
  - Always specify `$select` to fetch only required fields (e.g. avoid fetching bulky rich-text descriptions when listing issues in grids).
  - Use `$expand` judiciously for related entities (`cr_testprocedure`, `systemuser`).
  - Implement `$top` and `$skip` (or `@odata.nextLink`) for server-side pagination.
- **Concurrency & Soft-Locking**:
  - Implement soft record locking (`isLocked`, `lockedBy`, `lockedAt`) to prevent two reviewers from modifying the same finding simultaneously.
  - Check ETags (`If-Match`) on Dataverse updates to prevent lost updates.
- **Resilient Flow Invocations**:
  - Wrap all Power Automate HTTP flow calls in timeout guards (e.g. 30s timeout for LLM synthesis) with user-friendly retry banners.
  - Display non-blocking loading skeletons or button spinners during async flow execution.

### 5.4 TypeScript & Enterprise Code Quality Standards
- **Strict Typing Throughout**:
  - Define explicit TypeScript interfaces in `types/` for every entity (`Engagement`, `Issue`, `AiVersion`, `Comment`, `Assignment`, `ComplianceStandard`).
  - Strict prohibition of `any` types; use union types, generic constraints, and discriminated unions for workflow states.
- **Modular Component Sizing**:
  - Maintain small, single-responsibility files (target < 300 lines). Break large studios into distinct child components (`FindingNavigator`, `WorkpaperSection`, `ActionDock`, `AiComparisonModal`).
- **Error Boundaries & Defensive Coding**:
  - Enclose major views (`AuditReportStudio`, `ExecutiveStudio`, `Queue`) in React Error Boundaries to prevent full-app crashes.
  - Validate all inbound API and Flow payloads before writing to local state.

### 5.5 GxP Security, Accessibility & Regulatory Traceability
- **Immutable Log Emission**: Every state transition, AI adoption, and sign-off must trigger an audit trail entry containing user ID, timestamp, prior state, and new state.
- **Security & Sanitization**: Sanitize all rich text and markdown content before rendering to eliminate XSS risks. Never hardcode credentials, flow URLs, or API keys in source code; use Power Platform environment variables.
- **Accessibility Compliance**: Ensure full keyboard navigation (`Tab`, `Esc` for modals/drawers), ARIA labels on icon buttons, and color contrast compliance (WCAG 2.1 AA).
