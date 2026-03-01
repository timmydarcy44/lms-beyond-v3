"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  AppliedDecisions,
  GameState,
  TurnHistoryEntry,
  TurnPipelineResult,
  WorldBible,
  appendHistory,
  defaultWorldBible,
  runTurnPipeline,
} from "@/modules/beyond-play";
import { createInitialGameState, createInitialHistory } from "../game-state/initialState";

interface GameSessionContextValue {
  worldBible: WorldBible;
  gameState: GameState;
  history: TurnHistoryEntry[];
  lastResult: TurnPipelineResult | null;
  resetSession: () => void;
  runTurn: (
    turnNumber: number,
    decisions: AppliedDecisions,
  ) => Promise<TurnPipelineResult>;
}

const GameSessionContext = createContext<GameSessionContextValue | undefined>(undefined);

function cloneGameState(state: GameState): GameState {
  return typeof structuredClone === "function"
    ? structuredClone(state)
    : (JSON.parse(JSON.stringify(state)) as GameState);
}

export function GameSessionProvider({ children }: { children: ReactNode }) {
  const [worldBible] = useState<WorldBible>(defaultWorldBible);
  const [gameState, setGameState] = useState<GameState>(() =>
    cloneGameState(createInitialGameState(defaultWorldBible)),
  );
  const [history, setHistory] = useState<TurnHistoryEntry[]>(createInitialHistory);
  const [lastResult, setLastResult] = useState<TurnPipelineResult | null>(null);

  const resetSession = useCallback(() => {
    setGameState(cloneGameState(createInitialGameState(defaultWorldBible)));
    setHistory(createInitialHistory());
    setLastResult(null);
  }, []);

  const runTurn = useCallback(
    async (turnNumber: number, decisions: AppliedDecisions) => {
      const result = await runTurnPipeline(
        {
          gameState,
          worldBible,
          history,
          templateOverride: turnNumber,
        },
        decisions,
      );

      setGameState(result.nextState);
      setHistory((current) =>
        appendHistory(current, {
          turnNumber: result.turnPackage.turnNumber,
          package: result.turnPackage,
          appliedDecisions: decisions,
          stateAfter: result.nextState,
          result,
        }),
      );
      setLastResult(result);

      return result;
    },
    [gameState, worldBible, history],
  );

  const value = useMemo<GameSessionContextValue>(
    () => ({
      worldBible,
      gameState,
      history,
      lastResult,
      resetSession,
      runTurn,
    }),
    [worldBible, gameState, history, lastResult, resetSession, runTurn],
  );

  return <GameSessionContext.Provider value={value}>{children}</GameSessionContext.Provider>;
}

export function useGameSession(): GameSessionContextValue {
  const context = useContext(GameSessionContext);
  if (!context) {
    throw new Error("useGameSession must be used within a GameSessionProvider");
  }
  return context;
}

