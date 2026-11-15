# CARETRACE Synthetic Demo Seed Dataset

All records in this package are fictional and created solely for software development, testing, and hackathon demonstrations. They do not describe real people and must never be used to make healthcare decisions.

## Files
- patients.csv
- care_circle_members.csv
- medications.csv
- medication_events.csv
- appointments.csv
- care_instructions.csv
- care_tasks.csv
- notifications.csv
- care_gaps.csv
- handover_records.csv

## Import guidance
1. Inspect the existing Supabase schema and migrations before importing.
2. Map these CSV columns to the actual database columns; do not assume names or types match.
3. Import parent records before child records, preserving the IDs and relationships.
4. Use a dedicated demo environment or clearly isolated demo tenant.
5. Never import these records into a real patient's account or production tenant by default.
6. Enforce existing authentication, consent, authorization, and Row Level Security policies.
7. Do not create authentication users by importing email addresses from these CSV files.
8. Do not treat a `verified_demo` status as real clinical verification. It is only a synthetic demonstration label.
9. Medication event statuses represent user-reported or unconfirmed demo states, not proof of ingestion.
10. Do not use these sample medication names or schedules as prescribing instructions.

All phone numbers and email addresses are reserved example values. The dataset uses `Asia/Kolkata` timestamps for demonstration consistency.
