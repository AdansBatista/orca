# LOINC / CPT Mappings — Lab Work Management

This reference contains canonical mappings for common laboratory tests used in the clinic. It is intended as a pragmatic starting point for normalization and acceptance tests. Maintain this file as a living document and add vendor-specific exceptions where needed.

## How to use
- Use `loincCode` when available as the canonical observation code.
- Fall back to `cptCode` where LOINC is not applicable (procedure-level billing).
- Include `displayName`, common `alternateNames`, specimen type and typical units.
- Map to internal `testCode` used by the application when present.

## Format
| Internal Test Code | Display Name | LOINC | CPT (if applicable) | Specimen Type | Typical Unit |
|---|---:|---|---|---|---|

## Common mappings (starter set)
| `CBC` | Complete Blood Count (CBC) | 57021-8 (Panel)^1 | 85025 / 85027 (CBC w/auto diff) | Blood (whole) | cells/uL, g/dL |
| `BMP` | Basic Metabolic Panel | 24323-8 (BMP panel)^2 | 80048 | Blood (serum/plasma) | mmol/L, mg/dL |
| `CMP` | Comprehensive Metabolic Panel | 24320-7 (CMP panel)^3 | 80053 | Blood (serum/plasma) | mmol/L, mg/dL |
| `LIPID` | Lipid Panel | 2093-3 (Cholesterol HDL, LDL panels)^4 | 80061 | Blood (serum) | mg/dL |
| `TSH` | Thyroid Stimulating Hormone | 3016-3 | 84443 | Blood (serum) | uIU/mL |
| `HBA1C` | Hemoglobin A1c | 4548-4 | 83036 | Blood (whole) | % |
| `URINALYSIS` | Urinalysis (complete) | 58060-1 | 81003 | Urine | various |
| `CULTURE_BLOOD` | Blood Culture | 600-7^5 | 87040 | Blood (culture bottles) | qualitative |

^1 LOINC panel codes point to groups of observations — prefer mapping individual observations (e.g., hemoglobin 718-7) where possible.
^2/3 Panel LOINC codes vary by vendor; confirm vendor Observation resources.
^4 Map LDL/HDL/Total/Trig individually when available.
^5 Cultures are typically reported as organism + sensitivity results; map to result observation rows rather than single LOINC when possible.

## Recommended team workflow
- Curate a canonical internal `testCode` catalog and store mappings in a small managed YAML/JSON file consumed by the ingestion pipeline.
- For CI and test fixtures, include both LOINC and CPT where available so ingestion tests can validate normalization and billing hooks.

## Next steps
- Expand this file with the top 200 tests your labs send (CBC panel components, metabolic panel analytes, cultures, PCRs).
- Add a machine-readable export `loinc-cpt-mappings.json` in this folder for ingestion and tests.
