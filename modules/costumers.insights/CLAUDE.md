# @davna/costumers.insights

Capture of leads (a phone number) and suggestions, appended to Google Sheets through `GoogleSheetsRepository` of `@davna/infra`. Source-only: `main` is `index.ts`, and `src/index.ts` exports `dtos` (`leadValidate`, `suggestionValidate`), `entities` (`Lead`, `Suggestion`), `handlers` (`appendLeadHandler`, `appendSuggestionHandler`) and `repositories` (`LeadRepository`, `SuggestionRepository`); the services `appendLead` and `appendSuggestion` are internal.

```bash
yarn workspace @davna/costumers.insights test
yarn workspace @davna/costumers.insights test:handlers
yarn workspace @davna/costumers.insights test:services
yarn tsc -p modules/costumers.insights --noEmit   # no package script
yarn test:modules                                 # from the root: every module's tests, with a summary
```

- **The name is a typo** of "customers" and leaks into every import (`docs/recommendations.md` RG07). Use the current name until the rename lands; do not create a second, correctly spelled package beside it.
- `leadValidate` (`src/dtos/phone.ts`) accepts a phone number with an optional area code in parentheses and normalizes it to digits; `suggestionValidate` is in `src/dtos/suggestion.dto.ts`. They run in the app's `guardian` before the handler.
- The sheets are append-only stores: the module writes rows and never reads them back, and the column layout of each range is a contract with the spreadsheet.
- **Configuration read inside the module** (RG05): `LeadRepository` and `SuggestionRepository` default the spreadsheet to `GCP_LEAD_SPREADSHEET_ID`/`GCP_LEAD_SPREADSHEET_RANGE` and `GCP_SUGGESTION_SPREADSHEET_ID`/`GCP_SUGGESTION_SPREADSHEET_RANGE`, and the credentials to the `GCP_*` variables, with empty-string fallbacks. New code passes `credentials`, `spreadsheetId` and `range` from the app's configuration.
- A lead is personal data: it never goes into a log, an error message or a test fixture with a real number.
- `package.json` declares only `@davna/infra`; the code also imports `@davna/core` (RG15).

## Rules

- The module never imports another module; it depends only on `@davna/core` and `@davna/infra`.
- Business rules live in the services (`Service`, returning an `Either`); handlers only call them and build the `Response` (`docs/patterns/business-rules.md`).
- New `.ts` files in `src/` get the MIT header with `yarn add:header` from the repository root.

## Tests

- Handler specs mock their service with `jest.mock`; service specs use `InMemoryRepository` of `@davna/infra`. No spec reaches Google Sheets.
