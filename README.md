# Empathetic AI Agent - "mIA" on ElizaOS

**An empathetic AI agent for mental health support, designed for children and adolescents and built on the extensible `elizaOS` framework.**

[![ElizaOS](https://img.shields.io/badge/built%20on-elizaOS-blue.svg)](https://elizaos.ai)

---

## Overview

`empathetic-ai-agent-elizaos` is a project that embodies the creation of "mIA," an AI agent with a mission to provide a safe and supportive space for young individuals to express themselves. mIA is designed to be an empathetic listener, offering evidence-based coping strategies and identifying situations where professional help is needed.

This project is not a replacement for professional medical advice but aims to be a first point of contact, a digital companion that can guide users toward the right resources in moments of need.

## Key Features

- **Empathetic Persona**: "mIA" is crafted with a specific personality—empathetic, clear, and supportive. Her communication style is based on non-violent communication, emotional validation, and age-appropriate language.
- **Advanced Risk Evaluation**: A sophisticated `riskEvaluator` analyzes conversations in real-time to classify mental health risk as `low`, `medium`, or `high`. This system is built to be robust, incorporating caching, throttling, and a retry mechanism to handle API rate limits and temporary failures gracefully.
- **Crisis Management Protocol**: When the conversation contains keywords indicating a potential crisis (e.g., self-harm, abuse), the `crisisAction` is immediately triggered. This action provides the user with resources for immediate help, such as crisis hotlines, and can be configured to notify external systems via a webhook.
- **Knowledge Base Integration**: mIA's knowledge can be expanded with a local knowledge base of documents, allowing her to provide more specific and relevant information.
- **Extensible Plugin Architecture**: Built on `elizaOS`, the project is highly modular and extensible. New capabilities can be easily added through custom plugins, actions, and evaluators.

## Technology Stack

- **Framework**: [elizaOS](https://github.com/eliza-os/eliza-os)
- **Language**: `TypeScript`
- **LLM Integration**: The project is configured to use Google's Generative AI (`@elizaos/plugin-google-genai`) but is also compatible with:
  - OpenAI
  - Anthropic
  - Ollama
  - OpenRouter
- **Frontend**: `React` for building custom UI panels for the agent.
- **Testing**:
  - `Bun`'s native test runner for fast component and integration tests.
  - `Cypress` for end-to-end testing scenarios.
- **Database**: `@elizaos/plugin-sql` for persistent memory and conversational history.

## How it Works

The agent's logic is orchestrated by `elizaOS`, with a core loop that involves receiving a message, evaluating it, selecting an action, and generating a response.

1.  **Message Reception**: A new message from a user is received.
2.  **Risk Evaluation**: The `riskEvaluator` is one of the first components to process the message. It analyzes the conversation history and the latest message to determine a risk level.
3.  **Action Selection**: Based on the content of the message and the result of the evaluators, the agent decides which action to take. For example:
    - If crisis-related keywords are detected, the `crisisAction` is triggered.
    - In other cases, the agent might decide to simply reply, using its LLM integration to generate an empathetic and helpful response based on its persona and system prompt.
4.  **Response Generation**: The selected action is executed, and a response is generated and sent back to the user.
5.  **Memory**: The conversation is saved to the database, allowing the agent to have context in future interactions.

## Project Structure

```
├── src
│   ├── plugins
│   │   └── mental-health      # Core logic for the agent's mental health capabilities
│   │       ├── riskEvaluator.ts # The risk evaluation logic
│   │       ├── crisisAction.ts  # The crisis management action
│   │       └── index.ts         # The mental health plugin definition
│   ├── __tests__              # Unit, integration, and e2e tests
│   ├── frontend               # React components for the agent's UI panels
│   ├── character.ts           # Definition of mIA's persona, style, and system prompt
│   └── index.ts               # Main project entry point, agent and plugin registration
├── docs                     # Folder for the knowledge base documents
├── package.json             # Project dependencies and scripts
└── README.md                # You are here!
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed on your machine.
- API keys for the desired LLM provider (e.g., `GOOGLE_GENERATIVE_AI_API_KEY`) set up in a `.env` file. You can use the `.env.example` as a template.

### Installation and Running

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd empathetic-ai-agent-elizaos
    ```

2.  **Install dependencies:**
    The `elizaos` CLI handles this automatically when you run a command for the first time, but you can also do it manually.

    ```bash
    bun install
    ```

3.  **Run the development server:**
    This command will start the agent with hot-reloading.
    ```bash
    bunx elizaos dev
    ```

The agent will be running, and you can interact with it through the interfaces provided by `elizaOS`.

## Development & Testing

### Development

- **`bunx elizaos dev`**: Starts the development server with hot-reloading. This is the recommended way to work on the project.
- **`bunx elizaos start`**: Starts the server without hot-reloading. You will need to rebuild the project (`bun run build`) after making changes.

### Testing

The project has a comprehensive testing setup.

- **Run all tests:**
  ```bash
  bun test
  ```
- **Run only component/integration tests:**
  ```bash
  bun test:component
  ```
- **Run only end-to-end tests:**
  ```bash
  bun test:e2e
  ```

---

This project is a starting point for building sophisticated, empathetic AI agents. Feel free to expand on it, add new plugins, and refine mIA's capabilities.
