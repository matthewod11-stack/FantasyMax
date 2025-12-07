/**
 * Shared Contracts for Multi-Agent Development
 *
 * This directory contains TypeScript interfaces that ALL agents must adhere to.
 * These contracts ensure that parallel development produces compatible code.
 *
 * IMPORTANT: See EXPERIMENT.md for agent assignments and coordination protocol.
 * IMPORTANT: See ROADMAP.md for feature specifications and design requirements.
 * IMPORTANT: See docs/SESSION_PROTOCOL.md for session management rules.
 *
 * Files:
 * - components.ts: UI component prop interfaces (Agent A implements, Agent C consumes)
 * - queries.ts: Database query return types (Agent B implements, Agent C consumes)
 *
 * Rules:
 * 1. Any changes to these files require coordination with all agents
 * 2. Breaking changes must be documented in EXPERIMENT.md log
 * 3. All agents should import from this index, not directly from files
 */

// Component contracts (Agent A → Agent C)
export * from './components';

// Query contracts (Agent B → Agent C)
export * from './queries';
