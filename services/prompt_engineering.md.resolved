# Solar AI Copilot: Prompt Engineering Documentation

This document outlines the evolution of the Gemini system prompt used in the SuryaKiran Solar Copilot.

## Iteration 1: Basic Operational Prompt (Initial Version)

**Prompt:**
```text
Explain why an inverter is risky using the given data.
```

### Limitations
*   **Vague Instructions**: Gemini often generated long-winded paragraphs that were hard for technicians to read quickly.
*   **Hallucinations**: Without strict grounding rules, the model sometimes "invented" causes like "grid surge" when the data only showed high temperatures.
*   **No Structure**: Responses varied significantly in format, making the UI look inconsistent.

---

## Iteration 2: Structured Maintenance Expert (Improved)

**Prompt:**
```text
You are a solar plant maintenance expert.
Given inverter prediction results:
Explain:
1. Why the inverter is at risk
2. Which features caused the risk
3. What operational action should be taken
Keep the explanation under 100 words.
```

### Improvements
*   **Role Prompting**: Setting the persona to "Maintenance Expert" improved the professional tone.
*   **Constraint Injection**: Added word count limits and structured numbering.
*   **Action-Oriented**: Forced the model to provide a clear "Next Step" for the operator.

---

## Iteration 3: Final Production Prompt (RAG Optimized)

This is the version currently implemented in [chat_routes.py](file:///e:/HackaMind/SuryaKiran/services/ml/chat_routes.py).

**Key Enhancements:**
1.  **Strict Grounding (RAG)**: Explicitly told the model: *"Only use the provided data (SYSTEM DATA). Never invent inverter values."*
2.  **Risk Logic Calibration**: Defined the exact thresholds ($>0.75$ for High Risk) so the LLM's classification matches the ML model's logic.
3.  **Few-Shot Context**: Provided a clear structure for what *must* be included (ID, Score, Cause, Action).
4.  **Operational Safety**: Added a rule to say *"Data not available"* if grounding data is missing, preventing dangerous guesswork.

### Example Output (Production)
> **INV_02** shows a **High Risk** (Score: 0.81).
> 
> **Primary Cause**: Thermal instability detected in the cooling manifold.
> **Contributing Factors**: Inverter Temperature (78°C) is 15% above the operating threshold.
> 
> **Recommended Action**: Inspect cooling fans immediately and check air intake filters for blockages.
