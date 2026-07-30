# New API Integration Guideline

Legacy company POST normalization is **removed**. The API only accepts the new structure — flat company fields at root plus nested `bank`, `primary_contact`, `sites`, and `contacts`. Sending `bank_name`, `primary_contact_first_name`, root `meterstrings`, or a nested `company` object returns **400**.

See the full guideline in the repository history. Frontend code now follows:

- **Company POST**: nested `bank`, `primary_contact`, `sites[].meterstrings`
- **Company GET**: `bank` (singular), `primary_contact`, `sites[].meters[].quote` with flat rate fields
- **Quote**: flat `standing_charge`, `day_rate`, `day_kwh`, etc. (no `Contract_Rates`)
- **Meter**: `POST /meter/` then `PATCH /quote-header/{id}/` for rates
