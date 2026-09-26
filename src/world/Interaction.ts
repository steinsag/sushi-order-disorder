import type { Vec2 } from "../math/vec2";
import type { PlayerState } from "../state/PlayerState";
import type { StationDefinition } from "../rules/StationConfig";

export interface InteractionCandidate {
  station: StationDefinition;
  distance: number;
  dot: number;
  score: number;
}

/**
 * Calculates candidate interaction metrics for a given player and station.
 */
export function evaluateInteractionCandidate(
  playerPos: Vec2,
  playerFacing: Vec2,
  station: StationDefinition,
): InteractionCandidate | null {
  if (!station.isInteractable) {
    return null;
  }

  const dx = station.interactionPoint.x - playerPos.x;
  const dy = station.interactionPoint.y - playerPos.y;
  const distance = Math.hypot(dx, dy);

  if (distance > station.interactionRadius) {
    return null;
  }

  const nx = distance > 1e-6 ? dx / distance : 0;
  const ny = distance > 1e-6 ? dy / distance : 0;

  const facingLen = Math.hypot(playerFacing.x, playerFacing.y);
  const fx = facingLen > 1e-6 ? playerFacing.x / facingLen : 0;
  const fy = facingLen > 1e-6 ? playerFacing.y / facingLen : 0;

  const dot = fx * nx + fy * ny;

  // If player is looking directly away and not point-blank close, reject candidate
  if (dot < -0.4 && distance > 32) {
    return null;
  }

  // Weight facing alignment significantly (up to ~80 world px equivalent) over pure distance
  const score = (dot + 1) * 40 - distance;

  return {
    station,
    distance,
    dot,
    score,
  };
}

/**
 * Finds the single best unambiguous interaction target for a player.
 * Uses distance, facing alignment, and a deterministic tie-breaker.
 */
export function findInteractionTarget(
  player: Pick<PlayerState, "pos" | "facing" | "joined">,
  stations: readonly StationDefinition[],
): StationDefinition | null {
  if (!player.joined) {
    return null;
  }

  let bestCandidate: InteractionCandidate | null = null;

  for (let i = 0; i < stations.length; i++) {
    const candidate = evaluateInteractionCandidate(
      player.pos,
      player.facing,
      stations[i],
    );

    if (!candidate) {
      continue;
    }

    if (!bestCandidate) {
      bestCandidate = candidate;
      continue;
    }

    if (candidate.score > bestCandidate.score + 0.001) {
      bestCandidate = candidate;
    } else if (
      Math.abs(candidate.score - bestCandidate.score) <= 0.001 &&
      candidate.station.id < bestCandidate.station.id
    ) {
      // Deterministic tie-breaker by station ID
      bestCandidate = candidate;
    }
  }

  return bestCandidate ? bestCandidate.station : null;
}
