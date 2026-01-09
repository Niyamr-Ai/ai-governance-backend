# Google Sheets Template for LLM Risk Tier Testing

## Quick Setup Instructions

1. **Create a new Google Sheet**
2. **Name it:** `LLM Risk Tier Testing Results - [Your Name]`
3. **Copy the column headers below into Row 1**
4. **Freeze Row 1** (View → Freeze → 1 row)
5. **Share with your manager** (give edit access)

---

## Column Headers (Row 1)

Copy these exact headers into Row 1 of your Google Sheet:

```
Use Case # | Regulation | System Name | Use Case Description | Expected Risk Tier | Actual Risk Tier | Match? | Compliance Status | Key Triggers | Notes
```

**Note:** Only columns A through J are needed.

---

## Column Details

### Column A: Use Case #
- **Format:** Number (1, 2, 3... 25)
- **Purpose:** Sequential identifier

### Column B: Regulation
- **Format:** Text
- **Values:** `EU AI Act` | `UK AI Act` | `MAS`
- **Purpose:** Which regulation framework

### Column C: System Name
- **Format:** Text
- **Example:** `Social Credit Scoring System`
- **Purpose:** Name of the AI system being tested

### Column D: Use Case Description
- **Format:** Text (can be long)
- **Example:** `AI system that scores citizens based on behavior for public services`
- **Purpose:** Brief description of what the system does

### Column E: Expected Risk Tier
- **Format:** Text
- **EU Values:** `Prohibited` | `High-risk` | `Limited-risk` | `Minimal-risk` | `Unknown`
- **UK Values:** `Frontier / High-Impact Model` | `High-Risk (Sector)` | `Medium-Risk` | `Low-Risk`
- **MAS Values:** `Critical` | `High` | `Medium` | `Low`
- **Purpose:** What we expect the LLM to classify

### Column F: Actual Risk Tier
- **Format:** Text
- **Purpose:** What the LLM actually returned after form submission
- **How to fill:** Copy from the dashboard after submitting the form

### Column G: Match?
- **Format:** Text
- **Values:** `Yes` | `No`
- **Purpose:** Does actual match expected?
- **Formula suggestion:** `=IF(E2=F2,"Yes","No")` (if you want auto-calculation)

### Column H: Compliance Status
- **Format:** Text
- **Values:** `Compliant` | `Partially compliant` | `Non-compliant`
- **Purpose:** Overall compliance status from LLM response
- **How to fill:** Copy from the dashboard after submission

### Column I: Key Triggers
- **Format:** Text
- **Example:** `q4: credit_scoring, q5: social_scoring`
- **Purpose:** Which specific form answers triggered this risk tier
- **How to fill:** Reference the use case guide to note key answers

### Column J: Notes
- **Format:** Text (can be long)
- **Purpose:** Any observations, discrepancies, or unexpected results
- **Example:** `LLM correctly identified prohibited practice` or `Unexpectedly classified as High-risk instead of Medium-risk`

---

## Sample Data (First 3 Rows)

| Use Case # | Regulation | System Name | Use Case Description | Expected Risk Tier | Actual Risk Tier | Match? | Compliance Status | Key Triggers | Notes |
|------------|------------|-------------|----------------------|---------------------|------------------|--------|-------------------|--------------|-------|
| 1 | EU AI Act | Social Credit Scoring System | Scores citizens for public services | Prohibited | Prohibited | Yes | Non-compliant | q5: social_scoring | Correctly identified |
| 2 | EU AI Act | Automated Credit Decision Engine | Automated credit scoring and loan approval | High-risk | High-risk | Yes | Partially compliant | q4: credit_scoring | Correct classification |
| 3 | UK AI Act | Large Language Model API | Foundation model API service | Frontier / High-Impact Model | Frontier / High-Impact Model | Yes | Partially compliant | uk8: yes (foundation model) | Correct |

---

## Column C, D, and I Values for All 25 Use Cases

Use this table to fill columns C (System Name), D (Use Case Description), and I (Key Triggers) for each use case:

### EU AI Act (9 Use Cases)

| Use Case # | Column C: System Name | Column D: Use Case Description | Column I: Key Triggers |
|------------|----------------------|-------------------------------|------------------------|
| 1 | Social Credit Scoring System | AI system that scores citizens based on their behavior, social media activity, and public records to determine eligibility for government services and benefits | q5: social_scoring |
| 2 | Automated Credit Decision Engine | Machine learning system that analyzes applicant financial data, credit history, and transaction patterns to automatically approve or reject loan applications and assign credit scores | q4: credit_scoring |
| 3 | AI Recruitment Screening System | AI system that analyzes resumes, cover letters, and candidate profiles to automatically filter and rank job applicants, recommending top candidates for interviews | q4: job_decision |
| 4 | Facial Recognition Access Control | Facial recognition system that identifies employees and visitors to grant or deny access to secure buildings and restricted areas | q4: facial_recognition |
| 5 | Automated Student Assessment System | AI system that evaluates student assignments, exams, and projects to automatically assign grades and provide performance feedback | q4: education_eval |
| 6 | Customer Support Chatbot | AI chatbot that interacts with customers via text chat to answer questions, provide product information, and handle basic support requests | q7: Yes (transparency requirement) |
| 7 | Customer Sentiment Analyzer | AI system that analyzes facial expressions and voice tone during customer video calls to detect emotions and sentiment for improving service quality | q5: emotion_tracking, q7: Yes |
| 8 | Content Recommendation Engine | AI system that analyzes user preferences and viewing history to recommend personalized content like articles, videos, and products | None (minimal risk) |
| 9 | AI-Powered Medical Diagnostic Assistant | AI system integrated into medical imaging devices that analyzes X-rays, CT scans, and MRIs to assist radiologists in detecting abnormalities and making diagnostic recommendations | q4: machine_safety (Annex II - Medical Device) |

### UK AI Act (8 Use Cases)

| Use Case # | Column C: System Name | Column D: Use Case Description | Column I: Key Triggers |
|------------|----------------------|-------------------------------|------------------------|
| 10 | Large Language Model API | Large-scale generative AI foundation model with 100B+ parameters that provides text generation, code completion, and reasoning capabilities via API to developers and businesses | uk8: yes (foundation model) |
| 11 | Algorithmic Trading System | AI system that analyzes market data, news, and financial indicators to automatically execute trades and manage investment portfolios in real-time | uk2: finance (FCA regulated) |
| 12 | Clinical Decision Support System | AI system that analyzes patient medical records, symptoms, and test results to recommend treatment plans and medication dosages to healthcare providers | uk2: healthcare (MHRA regulated) |
| 13 | Performance Evaluation AI | AI system that analyzes employee performance data, project outcomes, and peer feedback to generate performance scores and recommend promotions or terminations | uk2: other (employment systems are high-risk) |
| 14 | Product Recommendation Engine | AI system that analyzes customer browsing history, purchase patterns, and preferences to recommend products and personalize the shopping experience | None (medium risk) |
| 15 | Automated Content Moderation System | AI system that analyzes user-generated content including text, images, and videos to detect hate speech, harassment, and inappropriate material for automated moderation | uk2: telecoms (Ofcom regulated) |
| 16 | Email Spam Filter | AI system that analyzes incoming emails to classify them as spam or legitimate messages, automatically filtering unwanted emails | None (low risk) |
| 17 | Biometric Identity Verification | AI system that uses facial recognition and fingerprint scanning to verify customer identity during account opening and transaction authentication for financial services | uk2: finance (FCA regulated) |

### MAS (8 Use Cases)

| Use Case # | Column C: System Name | Column D: Use Case Description | Column I: Key Triggers |
|------------|----------------------|-------------------------------|------------------------|
| 18 | High-Frequency Trading AI | AI system that executes thousands of trades per second based on real-time market data analysis, price movements, and algorithmic strategies | Finance sector, high-frequency trading |
| 19 | Consumer Credit Scoring System | AI system that analyzes customer financial data, credit history, and transaction patterns to generate credit scores and approve/reject loan applications | Finance sector, uses personal data, uses special category data |
| 20 | Medical Image Analysis System | AI system that analyzes medical images (X-rays, CT scans, MRIs) to detect abnormalities, tumors, and other medical conditions, providing diagnostic recommendations to radiologists | Healthcare sector, uses personal data, uses special category data (health) |
| 21 | Banking Customer Service Chatbot | AI chatbot that interacts with banking customers via text chat to answer questions about accounts, transactions, and banking services | Finance sector, uses personal data, uses third-party AI |
| 22 | Transaction Fraud Detection System | AI system that analyzes transaction patterns, user behavior, and account activity to detect and flag potentially fraudulent transactions for review | Finance sector, uses personal data |
| 23 | News Article Recommendation Engine | AI system that analyzes user reading history and preferences to recommend personalized news articles and content | Media sector, uses personal data, minimal compliance measures |
| 24 | Automated Insurance Underwriting System | AI system that analyzes applicant data, medical records, and risk factors to automatically determine insurance policy eligibility, coverage terms, and premium pricing | Insurance sector, uses personal data, uses special category data (health) |
| 25 | Resume Screening AI | AI system that analyzes resumes and job applications to automatically filter and rank candidates based on qualifications, experience, and job requirements | HR sector, uses personal data, uses third-party AI |

---

## Notes for Mismatched Use Cases (14, 15, 18, 19, 20, 23, 24)

Use these notes in Column J (Notes) for the use cases where Expected Risk Tier ≠ Actual Risk Tier:

### Use Case 14: Product Recommendation Engine (UK)
**Expected:** Medium-Risk | **Actual:** [Your actual result]

**Note to add:**
```
LLM classified as [Actual Risk Tier] instead of Medium-Risk. Issue: LLM may be weighing "Other sector" selection too heavily, or not recognizing that e-commerce recommendation systems with personal data should be Medium-Risk even without explicit sector regulation. The system processes personal browsing/purchase data which warrants Medium-Risk classification per UK AI Act principles.
```

### Use Case 15: Automated Content Moderation System (UK)
**Expected:** Medium-Risk | **Actual:** [Your actual result]

**Note to add:**
```
LLM classified as [Actual Risk Tier] instead of Medium-Risk. Issue: System operates in Telecommunications sector (Ofcom regulated) which should trigger High-Risk (Sector), but content moderation for social platforms typically falls under Medium-Risk due to transparency requirements. LLM may be incorrectly elevating to High-Risk (Sector) based solely on sector selection, or may be missing the nuanced classification for content moderation systems.
```

### Use Case 18: High-Frequency Trading AI (MAS)
**Expected:** Critical | **Actual:** Medium

**Note to add:**
```
LLM classified as Medium instead of Critical. Root Cause: Prompt lacks explicit risk classification criteria. LLM is using compliance-first approach (counting compliant pillars: 9/12 compliant) rather than risk-first approach (considering systemic market impact). High-frequency trading systems that execute thousands of trades/second pose Critical systemic risk to financial markets, regardless of pillar compliance scores. The LLM should prioritize sector impact (Finance + market disruption potential) over pillar compliance count. Recommendation: Update prompt to explicitly classify Finance sector systems with market disruption potential as Critical risk.
```

### Use Case 19: Consumer Credit Scoring System (MAS)
**Expected:** High | **Actual:** [Your actual result]

**Note to add:**
```
LLM classified as [Actual Risk Tier] instead of High. Issue: Finance sector system processing personal financial data and special category data (financial records) should be classified as High risk per MAS guidelines. LLM may be under-weighting the combination of Finance sector + personal data + special category data. The system makes critical financial decisions (loan approval/rejection) which warrants High risk classification regardless of pillar compliance status.
```

### Use Case 20: Medical Image Analysis System (MAS)
**Expected:** High | **Actual:** [Your actual result]

**Note to add:**
```
LLM classified as [Actual Risk Tier] instead of High. Issue: Healthcare sector system processing personal health data (special category data) and making diagnostic recommendations should be classified as High risk per MAS guidelines. Medical diagnostic systems have direct impact on patient health outcomes, which warrants High risk classification. LLM may be under-weighting the Healthcare sector + health data combination, or may be prioritizing pillar compliance scores over sector/impact classification.
```

### Use Case 23: News Article Recommendation Engine (MAS)
**Expected:** Low | **Actual:** [Your actual result]

**Note to add:**
```
LLM classified as [Actual Risk Tier] instead of Low. Issue: Media sector content recommendation system with minimal compliance measures (only 3/12 pillars compliant) but low-impact use case (news article recommendations) should be Low risk. LLM may be over-weighting the lack of compliance measures or personal data usage, when the actual impact of news recommendations is low. The system does not make critical decisions affecting health, finance, or safety.
```

### Use Case 24: Automated Insurance Underwriting System (MAS)
**Expected:** High | **Actual:** [Your actual result]

**Note to add:**
```
LLM classified as [Actual Risk Tier] instead of High. Issue: Insurance sector system processing personal data and special category data (health records) to make critical financial decisions (policy eligibility, pricing) should be classified as High risk per MAS guidelines. Insurance underwriting directly impacts access to coverage and premium costs, which are critical financial decisions. LLM may be under-weighting the Insurance sector + health data + financial decision combination, or may be prioritizing strong pillar compliance (11/12 compliant) over sector/impact classification.
```

---

## Google Sheets Formatting Tips

### 1. **Header Row Formatting**
- **Background Color:** Dark blue (#1a73e8)
- **Text Color:** White
- **Font:** Bold
- **Text Alignment:** Center

### 2. **Conditional Formatting for "Match?" Column**
- **If "Yes":** Green background (#c8e6c9)
- **If "No":** Red background (#ffcdd2)

### 3. **Freeze Rows/Columns**
- **Freeze Row 1** (View → Freeze → 1 row)
- **Freeze Column A** (View → Freeze → 1 column)

### 4. **Data Validation (Optional)**
- **Column B (Regulation):** Dropdown with `EU AI Act`, `UK AI Act`, `MAS`
- **Column G (Match?):** Dropdown with `Yes`, `No`
- **Column H (Compliance Status):** Dropdown with `Compliant`, `Partially compliant`, `Non-compliant`
- **Column C (System Name):** Use the values from the table above for consistency

### 5. **Filtering**
- Enable filters on Row 1 (Data → Create a filter)
- This allows filtering by Regulation, Match status, etc.

---

## Summary Sheet (Optional)

Create a second sheet called "Summary" with:

| Metric | Value |
|--------|-------|
| Total Use Cases | 25 |
| EU AI Act Cases | 9 |
| UK AI Act Cases | 8 |
| MAS Cases | 8 |
| Matches | `=COUNTIF(Sheet1!G:G,"Yes")` |
| Mismatches | `=COUNTIF(Sheet1!G:G,"No")` |
| Match Rate | `=Matches/Total Use Cases` |
| EU Match Rate | `=COUNTIFS(Sheet1!B:B,"EU AI Act",Sheet1!G:G,"Yes")/9` |
| UK Match Rate | `=COUNTIFS(Sheet1!B:B,"UK AI Act",Sheet1!G:G,"Yes")/8` |
| MAS Match Rate | `=COUNTIFS(Sheet1!B:B,"MAS",Sheet1!G:G,"Yes")/8` |

---

## Sharing with Manager

1. **Click "Share" button** (top right)
2. **Add manager's email**
3. **Set permission:** `Editor` (so they can add comments)
4. **Add message:** `LLM Risk Tier Testing Results - [Date]`
5. **Click "Send"**

---

## Quick Reference: Where to Find Data After Submission

### After submitting a form:

1. **Risk Tier:**
   - Go to Dashboard (`/dashboard`)
   - Find your assessment in the table
   - Look at the **RISK TIER** column
   - Copy the value (e.g., "High Risk", "Prohibited")

2. **Compliance Status:**
   - Same dashboard table
   - Look at the **STATUS** column
   - Copy the value (e.g., "Compliant", "Partially compliant")

3. **Full Assessment Details:**
   - Click "View details" → "View Detailed" (if available)
   - This shows the full LLM response

---

## Tips for Efficient Testing

1. **Fill forms in batches** - Do all EU cases, then UK, then MAS
2. **Copy-paste system names** - Use consistent naming from the guide
3. **Take screenshots** - Screenshot the dashboard after each submission for reference
4. **Log immediately** - Don't wait, log results right after each submission
5. **Use browser tabs** - Keep the Google Sheet open in one tab, form in another

---

## Troubleshooting

**Q: I can't find the Risk Tier in the dashboard**
- A: Check the **RISK TIER** column in the dashboard table. It should show a colored badge.

**Q: The assessment didn't save**
- A: Check browser console for errors. Make sure you're logged in and all required fields are filled.

**Q: I need to re-test a use case**
- A: Just create a new assessment with a slightly different system name (e.g., add "v2" suffix).

**Q: How do I know which answers triggered the risk tier?**
- A: Refer to the use case guide - it notes which specific questions/answers are "KEY" triggers.

