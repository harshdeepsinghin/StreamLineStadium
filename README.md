# SLS — StreamLineStadium
### AI Decision Copilot for Stadium Operations
**Stadium Operations Vertical Submission (FIFA World Cup Context)**

SLS is a real-time AI Decision Copilot designed for Stadium Operations managers and ground staff. It closes the loop between raw on-the-ground observations and actionable stadium responses. By converting plain-text volunteer/staff inputs into structured incident metrics, SLS utilizes Google Gemini models (via Vertex AI) to extract categories, prioritize severities, and generate ranked action recommendations with clear operational reasoning.

---

## 1. Chosen Vertical & Personas
- **Vertical:** Stadium Operations (FIFA World Cup Stadium context).
- **Ground Reporter Persona:** Any steward, medical officer, volunteer, or security guard on the stadium floor who needs a zero-friction way to report incidents.
- **Operations Manager Persona:** The coordinator in the central control room who views the live operations dashboard, reviews AI recommendations, and authorizes responders.

---

## 2. Problem Statement
Large-scale sports events suffer from fragmented, slow communication. Ground staff write verbose, unstructured descriptions of crowds or emergencies. Operators are overwhelmed by incoming feeds, lacking a centralized method to group incidents, evaluate severity, or access immediate SOP recommendations. 

---

## 3. Approach & Operational Loop
SLS solves this with a structured three-step loop:
1. **Intake & Triage:** A volunteer enters: *"Gate A is getting crowded, the scanning line is backing up."* Gemini structures the report into categories (Crowd, Medical, Security, Facility, Lost Person) and locations (stands, gates).
2. **AI Copilot Reasoning:** The engine fetches recent incident history and current match context, calling Gemini to generate a ranked list of recommended actions accompanied by clear operational reasoning (e.g. *"Deploy 2 extra stewards to Gate A because adjacent gates are underutilized"*).
3. **Dashboard Resolution:** The manager sees a live update on the stadium map, reviews the copilot's recommendations, and clicks to approve or dismiss the action.

---

## 4. System Architecture & Tech Stack
- **Framework:** Next.js 16 (App Router) + TypeScript.
- **Styling:** Tailwind CSS (v4) with modern slate-ops dark mode aesthetics.
- **Database:** Cloud Firestore (utilizing real-time client-side synchronization via `onSnapshot` for instant dashboard updates).
- **AI Engine:** Google Gen AI SDK (`@google/genai`) configured for Vertex AI (Enterprise Mode) using Application Default Credentials (ADC) to tap into `gemini-2.5-flash`.
- **Testing:** Vitest unit tests (scoring & ranking logic) and prompt evaluation integration tests (mocking Gemini response schemas).
- **Deployment:** Cloud Run (multi-stage Docker container utilizing standalone output compilation).

---

## 5. System Assumptions & Scope Cuts
- **Role Switcher:** Rather than a full auth system (which increases sign-in friction for demos), a toggle in the header switches between the **Reporter** and **Manager** view in real time.
- **Stadium Map:** Built as a customized, interactive SVG representing stands, gates, and the pitch. This avoids Google Maps API key requirements, minimizes repo weight, and enables dynamic color rendering based on incident counts.
- **Match Context:** Mocked as a live high-tension match (Minute 72, Score 1-1) to influence the urgency rating of the decision recommendations.

---

## 6. Setup Instructions

### Prerequisites
- Node.js (v20+) and npm.
- Google Cloud SDK (`gcloud` CLI) authenticated locally:
  ```bash
  gcloud auth application-default login
  gcloud config set project hack2skill-a226e
  ```

### Local Development
1. Clone the repository and navigate into it:
   ```bash
   cd StreamLineStadium
   ```
2. Copy the environment variables:
   ```bash
   cp .env.example .env.local
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

### Deploying to Google Cloud Run
To compile the standalone Docker container and deploy directly to Cloud Run:
```bash
gcloud run deploy streamlinestadium \
  --source=. \
  --region=asia-south1 \
  --project=hack2skill-a226e \
  --allow-unauthenticated
```
*(Note: Requires active GCP billing on the target project to access Artifact Registry storage).*

---

## 7. Testing
To run the automated Vitest suite (which tests pure functions, severity scoring, keyword-based fallbacks, and prompt extraction schemas):
```bash
npm run test
```

---

## 8. Future Roadmap
- **Dynamic Indoor Routing:** Integrate pathfinding algorithms on top of the stadium map coordinates to guide stewards.
- **Transit Prediction Integration:** Feed municipal bus/train schedules into the manager dashboard during post-match load out.
- **Sustainability Analytics:** Track waste bin levels and solar grid intakes as minor operational dashboards.
- **Multi-lingual Translation:** Use Gemini translation overlays to instantly translate reports submitted in foreign languages by visiting fans.
