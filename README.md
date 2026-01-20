Walkthrough - Protocol Triage UI Prototype
This allows you to test the end-to-end flow of protocol selection and decision tree traversal without affecting other prototypes.


How to Run
Navigate to the new prototype directory:
`cd backend-infra/prototype/react-triage`

Install dependencies:
`npm install`

Start the development server:
`npm run dev`

Open the URL shown in the terminal (usually http://localhost:5173).

Usage Guide
    Describe Symptoms: Enter a description like "Dor no peito intensa" or "Paciente sofreu queda de moto".
    Find Protocol: Click the button. The system will suggest a protocol (e.g., "Dor Torácica" or "Trauma").
    Start Triage: Confirm the protocol to begin.
    Answer Questions:
        If the system asks for sensor data (e.g., "blood_pressure"), enter it in the provided fields.
        If it asks a Yes/No question, type your answer in the text box.
    Complete: Continue until you reach a final priority (Red, Orange, Yellow, Green, Blue).

## Authentication
This application now requires authentication. See [README_AUTH.md](./README_AUTH.md) for setup instructions.