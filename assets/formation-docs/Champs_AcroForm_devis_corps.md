# Devis — corps AcroForm (2 pages, 36 champs)

Page 1 = synthèse (en-tête, total, parties, session, règlement, financement). Page 2 = récapitulatif, mentions, bon pour accord. Le détail des lignes est généré en HTML (`QuoteDetailData`) et inséré entre les deux par `assembleQuote()`.

`quote_number`, `total_ht`, `total_vat`, `total_ttc` apparaissent à plusieurs endroits : un seul `setText`. Montants passés formatés avec « € » (ex. `5 378,40 €`).

Supprimés par rapport au devis précédent : `line_N_*`, `subtotal_ht`, `discount_label`, `discount_amount`, `vat_rate`, `notes` → désormais dans `QuoteDetailData`.

| Champ | Type |
|---|---|
| `quote_number` | text |
| `course_title` | text |
| `quote_date` | text |
| `valid_until` | text |
| `client_reference` | text |
| `total_ttc` | text |
| `total_ht` | text |
| `total_vat` | text |
| `issuer_contact` | text |
| `client_name` | text multi |
| `client_address` | text multi |
| `client_siret` | text |
| `client_vat_number` | text |
| `client_contact_name` | text |
| `client_contact_details` | text |
| `session_dates` | text |
| `session_duration` | text |
| `session_hours` | text |
| `session_location` | text |
| `session_modality` | text |
| `trainees_count` | text |
| `payment_terms` | text multi |
| `deposit_amount` | text |
| `payment_method` | text |
| `bank_iban` | text |
| `bank_bic` | text |
| `funding_own` | checkbox |
| `funding_opco` | checkbox |
| `opco_name` | text |
| `funding_other` | checkbox |
| `funding_other_label` | text |
| `funding_reference` | text |
| `accept_name` | text multi |
| `accept_role` | text multi |
| `accept_city` | text multi |
| `accept_date` | text multi |
