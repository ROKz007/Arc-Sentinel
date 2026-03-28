## ## Arc-Sentinel

**Arc-Sentinel** is an AI-driven Structural Health Monitoring (SHM) ecosystem designed for the early detection of micro-failures in critical urban infrastructure. By synthesizing real-time sensor telemetry with predictive AI, Arc-Sentinel transitions maintenance from reactive physical inspections to a proactive digital-first strategy, identifying structural risks months before they become visible to the human eye.

---

## ### Key Features

### 1. The Vigilance Dashboard (Frontend)

A high-fidelity "Command Center" that translates complex sensor data into actionable insights for city engineers and stakeholders.

- **Infrastructure Health Index (IHI):** A real-time "Pulse" score ($0$ to $100$) derived from multi-sensor data fusion.
    
- **Emergency Maintenance Broadcast (EMB):** A high-priority "Ticker" that pushes automated alerts when the AI detects a threshold breach (e.g., _“Anomalous vibration detected on Pier 4. Structural Integrity down 12%.”_).
    
- **3D Digital Twin Viewer:** A simplified 3D model (built with Three.js) that dynamically highlights specific stress zones in red when sensors report anomalies.
    

### 2. Argus AI (Integrated Chatbot)

The "Intelligence Layer" of the platform—a specialized LLM-powered interface that allows users to query the state of the infrastructure in plain English.

- **Natural Language Diagnostics:** _"Argus, what is the current strain on the eastern suspension cable?"_ or _"Compare today’s vibration levels with the last storm event."_
    
- **Maintenance Summarization:** Provides instant summaries of all yellow-level alerts from the last 48 hours for quick briefings.
    
- **Protocol Dispatch:** Argus can suggest immediate safety protocols or repair steps based on the specific failure type detected.
    

### 3. Predictive Failure Engine (Backend)

The "Brain" of Arc-Sentinel that differentiates between everyday wear-and-tear and catastrophic degradation.

- **Anomaly Detection:** Uses an **Isolation Forest** or **One-Class SVM** algorithm to flag outliers in vibration and tilt data.
    
- **Threshold Triggering:** Automated Webhooks that push data to the Dashboard and the EMB system the moment a "Critical" state is identified.
    

---

## ### Functional Dependencies

1. **Telemetry Stream (Data Source):**
    
    - _Requirement:_ A constant stream of JSON data representing Accelerometer (Vibration) and Strain Gauge (Deformation) inputs.
        
    - _Hackathon approach:_ A Python script acting as a "Virtual Sensor" to push real-time data into the database.
        
2. **RAG Pipeline for Argus AI:**
    
    - _Requirement:_ To answer questions about _current_ health, the chatbot needs a Retrieval-Augmented Generation (RAG) setup.
        
    - _Hackathon approach:_ Use **LangChain** to feed the most recent `sensor_logs` and `anomaly_reports` from Supabase into the LLM’s context window.
        
3. **Supabase Realtime:**
    
    - _Requirement:_ The Dashboard must reflect changes without a page refresh.
        
    - _Hackathon approach:_ Implement **Supabase Realtime Subscriptions** to listen for new rows in the `anomalies` table and push them instantly to the Next.js frontend.
        

---

## ### Proposed System Architecture

|**Layer**|**Technology**|**Role**|
|---|---|---|
|**Edge / Simulation**|Python (NumPy/Pandas)|Generates synthetic "Stress" vs. "Healthy" sensor telemetry.|
|**Data Warehouse**|Supabase (PostgreSQL)|Stores time-series logs, anomaly flags, and maintenance history.|
|**Intelligence**|OpenAI API / LangChain|Powers **Argus AI** for natural language querying and diagnostics.|
|**User Interface**|Next.js + Tailwind CSS|The central hub for broadcasts, 3D visualization, and monitoring.|

---

## ### Scalability & Future Roadmap

- **Drone Integration:** Automated dispatch of inspection drones to specific GPS coordinates when the IHI falls below $60\%$.
    
- **InSAR Satellite Data:** Cross-referencing ground movement around the infrastructure to detect sinkholes or soil liquefaction.
    
- **Blockchain Ledger:** Creating an immutable record of structural health and repair logs to prevent "data tampering" in public safety audits.