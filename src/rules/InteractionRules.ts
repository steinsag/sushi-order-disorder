import type { PlayerIndex } from "../input/PlayerInput";
import type { Vec2 } from "../math/vec2";
import type { IngredientType } from "./IngredientConfig";
import {
  DEFAULT_FRIDGE_REFILL_TIME,
  FRIDGE_INGREDIENTS,
} from "./IngredientConfig";
import {
  createDroppedItem,
  createIngredientItem,
  createPlateItem,
  type DroppedItem,
} from "../state/ItemState";
import type { WorldState } from "../state/WorldState";
import {
  createInitialRollStationState,
  type RollStationState,
} from "../state/StationState";
import {
  DEFAULT_COUNTER_MAX_ITEMS,
  DEFAULT_ROLL_STATION_MAX_ITEMS,
  type StationDefinition,
} from "./StationConfig";
import {
  DEFAULT_ORDER_SPAWN_DELAY,
  DEFAULT_RECIPE_ID,
  findMatchingRecipe,
  getRecipeDefinition,
} from "./RecipeConfig";
import {
  acceptOrderAtCounter,
  advanceActiveOrders,
  advanceOrderStationState,
} from "./OrderRules";
import { evaluateDelivery } from "./DeliveryRules";
import { advanceScoreState, applyDeliveryFeedback } from "../state/ScoreState";
import { getShiftProgression } from "./ShiftConfig";

export const DEFAULT_ITEM_PICKUP_RADIUS = 48; // World pixels

export function getFridgeIngredientForPlayerPos(
  playerPos: Vec2,
  fridgePos: Vec2 = { x: 600, y: 110 },
): IngredientType {
  const relX = playerPos.x - fridgePos.x;
  if (relX < -24) return "nori";
  if (relX < 0) return "salmon";
  if (relX < 24) return "cucumber";
  return "avocado";
}

export function findClosestDroppedItem(
  playerPos: Vec2,
  droppedItems: readonly DroppedItem[],
  maxRadius: number = DEFAULT_ITEM_PICKUP_RADIUS,
): DroppedItem | null {
  let closest: DroppedItem | null = null;
  let minDistance = maxRadius;

  for (const item of droppedItems) {
    const dist = Math.hypot(item.pos.x - playerPos.x, item.pos.y - playerPos.y);
    if (dist <= minDistance) {
      minDistance = dist;
      closest = item;
    }
  }

  return closest;
}

export function getRollStationState(
  state: WorldState,
  stationId?: string,
): RollStationState {
  if (stationId && state.rollStations && state.rollStations[stationId]) {
    return state.rollStations[stationId];
  }
  if (stationId === "station-roll-1" || stationId === "station-roll") {
    return (
      state.rollStation ??
      state.rollStations?.["station-roll-1"] ??
      state.rollStations?.["station-roll"] ??
      createInitialRollStationState()
    );
  }
  if (stationId && state.rollStations?.[stationId]) {
    return state.rollStations[stationId];
  }
  return state.rollStation ?? createInitialRollStationState();
}

export function updateRollStationInWorld(
  state: WorldState,
  stationId: string,
  newRollState: RollStationState,
): WorldState {
  const currentRollStations = state.rollStations ?? {
    "station-roll-1": state.rollStation ?? createInitialRollStationState(),
    "station-roll": state.rollStation ?? createInitialRollStationState(),
  };
  const rollStations: Record<string, RollStationState> = {
    ...currentRollStations,
    [stationId]: newRollState,
  };
  if (stationId === "station-roll-1") {
    rollStations["station-roll"] = newRollState;
  } else if (stationId === "station-roll") {
    rollStations["station-roll-1"] = newRollState;
  }

  const isPrimary =
    stationId === "station-roll-1" ||
    stationId === "station-roll" ||
    !state.rollStations ||
    Object.keys(state.rollStations)[0] === stationId;

  return {
    ...state,
    rollStations,
    rollStation: isPrimary ? newRollState : (state.rollStation ?? newRollState),
  };
}

export function advanceStationTimers(
  state: WorldState,
  dt: number,
): WorldState {
  // 1. Advance rice cooker
  let riceCooker = state.riceCooker;
  if (riceCooker.state === "cooking") {
    const newCookTime = Math.max(0, riceCooker.cookTimeRemaining - dt);
    const total = riceCooker.totalCookTime;
    const progress =
      total > 0 ? Math.min(1, Math.max(0, 1 - newCookTime / total)) : 1;

    if (newCookTime <= 0) {
      riceCooker = {
        ...riceCooker,
        state: "ready",
        portions: riceCooker.maxPortions,
        cookTimeRemaining: 0,
        cookingProgress: 1,
      };
    } else {
      riceCooker = {
        ...riceCooker,
        cookTimeRemaining: newCookTime,
        cookingProgress: progress,
      };
    }
  }

  // 2. Advance roll station(s)
  const currentRollStations: Record<string, RollStationState> = {
    ...(state.rollStations ?? {}),
  };
  if (
    state.rollStation &&
    !currentRollStations["station-roll-1"] &&
    !currentRollStations["station-roll"]
  ) {
    currentRollStations["station-roll-1"] = state.rollStation;
    currentRollStations["station-roll"] = state.rollStation;
  }

  const updatedRollStations: Record<string, RollStationState> = {};
  for (const [id, rs] of Object.entries(currentRollStations)) {
    let effectiveRs = rs;
    if (
      (id === "station-roll-1" || id === "station-roll") &&
      state.rollStation &&
      state.rollStation !== rs &&
      (state.rollStation.state === "rolling" ||
        state.rollStation.items.length > 0)
    ) {
      effectiveRs = state.rollStation;
    }

    if (effectiveRs.state === "rolling") {
      const newRollTime = Math.max(0, effectiveRs.rollingTimeRemaining - dt);
      const total = effectiveRs.totalRollingTime;
      const progress =
        total > 0 ? Math.min(1, Math.max(0, 1 - newRollTime / total)) : 1;

      if (newRollTime <= 0) {
        const recipeId = effectiveRs.rollingRecipeId ?? DEFAULT_RECIPE_ID;
        const plate = createPlateItem(recipeId);
        updatedRollStations[id] = {
          ...effectiveRs,
          state: "idle",
          items: [plate],
          rollingTimeRemaining: 0,
          rollingProgress: 0,
          rollingRecipeId: null,
        };
      } else {
        updatedRollStations[id] = {
          ...effectiveRs,
          rollingTimeRemaining: newRollTime,
          rollingProgress: progress,
        };
      }
    } else {
      updatedRollStations[id] = effectiveRs;
    }
  }

  const updatedPrimary =
    updatedRollStations["station-roll-1"] ??
    updatedRollStations["station-roll"] ??
    state.rollStation;

  // 3. Advance active orders countdown
  const activeOrders = state.activeOrders
    ? advanceActiveOrders(state.activeOrders, dt)
    : [];

  // 4. Advance order station state (spawning new orders if needed according to shift progression)
  const shiftProgress = state.shift ? state.shift.progress : 0;
  const progression = getShiftProgression(shiftProgress);
  const activeCount = activeOrders.filter((o) => o.status === "active").length;
  const orderStation = state.orderStation
    ? advanceOrderStationState(
        state.orderStation,
        activeCount,
        dt,
        progression.maxActiveOrders,
        {
          availableRecipes: progression.availableRecipes,
          expressChance: progression.expressChance,
          patienceMultiplier: progression.orderPatienceMultiplier,
        },
      )
    : state.orderStation;

  // 5. Advance score feedback timer
  const scoreState = state.scoreState
    ? advanceScoreState(state.scoreState, dt)
    : state.scoreState;

  // 6. Advance fridge compartment refill timers
  let fridge = state.fridge;
  if (fridge && fridge.compartments) {
    let fridgeChanged = false;
    const updatedCompartments = { ...fridge.compartments };
    for (const ing of FRIDGE_INGREDIENTS) {
      const comp = fridge.compartments[ing];
      if (!comp) continue;
      if (comp.stock < comp.maxStock) {
        fridgeChanged = true;
        let timeRemaining = comp.refillTimeRemaining;
        const totalTime =
          comp.totalRefillTime > 0
            ? comp.totalRefillTime
            : DEFAULT_FRIDGE_REFILL_TIME;
        if (timeRemaining <= 0) {
          timeRemaining = totalTime;
        }
        const newTime = Math.max(0, timeRemaining - dt);
        const progress =
          totalTime > 0 ? Math.min(1, Math.max(0, 1 - newTime / totalTime)) : 1;

        if (newTime <= 0) {
          const nextStock = comp.stock + 1;
          const isStillRefilling = nextStock < comp.maxStock;
          updatedCompartments[ing] = {
            ...comp,
            stock: nextStock,
            refillTimeRemaining: isStillRefilling ? totalTime : 0,
            refillProgress: 0,
          };
        } else {
          updatedCompartments[ing] = {
            ...comp,
            refillTimeRemaining: newTime,
            refillProgress: progress,
          };
        }
      } else if (comp.refillTimeRemaining !== 0 || comp.refillProgress !== 0) {
        fridgeChanged = true;
        updatedCompartments[ing] = {
          ...comp,
          refillTimeRemaining: 0,
          refillProgress: 0,
        };
      }
    }
    if (fridgeChanged) {
      fridge = {
        ...fridge,
        compartments: updatedCompartments,
      };
    }
  }

  return {
    ...state,
    riceCooker,
    fridge,
    rollStation: updatedPrimary,
    rollStations: updatedRollStations,
    activeOrders,
    orderStation,
    scoreState,
  };
}

export function processPlayerInteractions(
  state: WorldState,
  slot: PlayerIndex,
): WorldState {
  const player = state.players[slot];
  if (!player.joined) {
    return state;
  }

  let nextState = state;
  const input = player.input;
  const targetStation = state.stations.find(
    (s) => s.id === player.targetStationId,
  );

  // 1. Process action1Pressed (Interact / Take / Place / Cook)
  if (input.action1Pressed) {
    nextState = handleAction1(nextState, slot, targetStation);
  }

  // 2. Process action2Pressed (Drop / Cancel)
  if (input.action2Pressed) {
    nextState = handleAction2(nextState, slot, targetStation);
  }

  return nextState;
}

function handleAction1(
  state: WorldState,
  slot: PlayerIndex,
  targetStation?: StationDefinition,
): WorldState {
  const player = state.players[slot];
  const carried = player.carriedItem;

  // --- Order Station interaction (accept pending order) ---
  if (targetStation?.type === "order" && state.orderStation) {
    const shiftProgress = state.shift ? state.shift.progress : 0;
    const progression = getShiftProgression(shiftProgress);
    const result = acceptOrderAtCounter(
      state.orderStation,
      state.activeOrders,
      progression.maxActiveOrders,
      progression.orderSpawnDelay,
    );
    if (result.accepted) {
      return {
        ...state,
        orderStation: result.orderStation,
        activeOrders: result.activeOrders,
      };
    }
  }

  if (carried) {
    // --- Player is carrying an item ---
    if (targetStation?.type === "roll") {
      const stationId = targetStation.id;
      const currentRollState = getRollStationState(state, stationId);

      // If roll station is actively rolling, player cannot place item onto it
      if (currentRollState.state === "rolling") {
        return state;
      }

      // Check capacity limit
      const maxItems =
        currentRollState.maxItems ?? DEFAULT_ROLL_STATION_MAX_ITEMS;
      if (currentRollState.items.length >= maxItems) {
        return state;
      }

      // Place item onto Roll Station
      const updatedRollItems = [...currentRollState.items, carried];
      const updatedPlayers = [...state.players] as typeof state.players;
      updatedPlayers[slot] = { ...player, carriedItem: null };

      const updatedRollState: RollStationState = {
        ...currentRollState,
        items: updatedRollItems,
      };

      return updateRollStationInWorld(
        { ...state, players: updatedPlayers },
        stationId,
        updatedRollState,
      );
    }

    if (targetStation?.type === "counter") {
      // Place item onto Counter
      const counterId = targetStation.id;
      const counterState = state.counters[counterId];
      const counterItems = counterState?.items ?? [];
      const maxItems = counterState?.maxItems ?? DEFAULT_COUNTER_MAX_ITEMS;

      if (counterItems.length >= maxItems) {
        return state;
      }

      const updatedCounters = {
        ...state.counters,
        [counterId]: {
          ...counterState,
          items: [...counterItems, carried],
        },
      };
      const updatedPlayers = [...state.players] as typeof state.players;
      updatedPlayers[slot] = { ...player, carriedItem: null };

      return {
        ...state,
        players: updatedPlayers,
        counters: updatedCounters,
      };
    }

    if (targetStation?.type === "fridge") {
      const targetIng = getFridgeIngredientForPlayerPos(
        player.pos,
        targetStation.pos,
      );

      const fridge = state.fridge;
      if (!fridge || !fridge.compartments) {
        // Fallback swap if no compartments
        const updatedPlayers = [...state.players] as typeof state.players;
        updatedPlayers[slot] = {
          ...player,
          carriedItem: createIngredientItem(targetIng),
        };
        return {
          ...state,
          players: updatedPlayers,
        };
      }

      if (carried.type === "ingredient") {
        const carriedIng = carried.ingredient;

        // If carried ingredient matches target compartment, return it to fridge
        if (carriedIng === targetIng) {
          const comp = fridge.compartments[targetIng];
          if (comp && comp.stock < comp.maxStock) {
            const nextStock = comp.stock + 1;
            const isFull = nextStock >= comp.maxStock;
            const updatedComp = {
              ...comp,
              stock: nextStock,
              refillTimeRemaining: isFull ? 0 : comp.refillTimeRemaining,
              refillProgress: isFull ? 0 : comp.refillProgress,
            };
            const updatedFridge = {
              ...fridge,
              compartments: {
                ...fridge.compartments,
                [targetIng]: updatedComp,
              },
            };
            const updatedPlayers = [...state.players] as typeof state.players;
            updatedPlayers[slot] = {
              ...player,
              carriedItem: null,
            };
            return {
              ...state,
              players: updatedPlayers,
              fridge: updatedFridge,
            };
          }
          // Already full, cannot return same ingredient further
          return state;
        }

        // Different ingredient: Swap if target compartment has stock
        const targetComp = fridge.compartments[targetIng];
        if (!targetComp || targetComp.stock <= 0) {
          // Cannot take from empty compartment
          return state;
        }

        const nextTargetStock = targetComp.stock - 1;
        const totalTime =
          targetComp.totalRefillTime > 0
            ? targetComp.totalRefillTime
            : DEFAULT_FRIDGE_REFILL_TIME;
        const startRefill =
          targetComp.refillTimeRemaining === 0 &&
          nextTargetStock < targetComp.maxStock;

        const updatedTargetComp = {
          ...targetComp,
          stock: nextTargetStock,
          refillTimeRemaining: startRefill
            ? totalTime
            : targetComp.refillTimeRemaining,
          refillProgress: startRefill ? 0 : targetComp.refillProgress,
        };

        const updatedCompartments = {
          ...fridge.compartments,
          [targetIng]: updatedTargetComp,
        };

        // If carried ingredient is one of fridge ingredients, deposit it back
        const carriedComp = fridge.compartments[carriedIng];
        if (carriedComp && carriedComp.stock < carriedComp.maxStock) {
          const nextCarriedStock = carriedComp.stock + 1;
          const isCarriedFull = nextCarriedStock >= carriedComp.maxStock;
          updatedCompartments[carriedIng] = {
            ...carriedComp,
            stock: nextCarriedStock,
            refillTimeRemaining: isCarriedFull
              ? 0
              : carriedComp.refillTimeRemaining,
            refillProgress: isCarriedFull ? 0 : carriedComp.refillProgress,
          };
        }

        const updatedFridge = {
          ...fridge,
          compartments: updatedCompartments,
        };

        const updatedPlayers = [...state.players] as typeof state.players;
        updatedPlayers[slot] = {
          ...player,
          carriedItem: createIngredientItem(targetIng),
        };

        return {
          ...state,
          players: updatedPlayers,
          fridge: updatedFridge,
        };
      }

      // If carrying a plate at fridge: no-op (fridge rejects plates)
      return state;
    }

    if (targetStation?.type === "delivery") {
      if (carried.type === "plate") {
        const outcome = evaluateDelivery(carried, state.activeOrders);
        const updatedScoreState = applyDeliveryFeedback(
          state.scoreState,
          outcome.result.type,
          outcome.result.message,
          outcome.result.scoreDelta,
          outcome.result.recipeId,
        );

        const updatedPlayers = [...state.players] as typeof state.players;
        updatedPlayers[slot] = { ...player, carriedItem: null };

        let orderStation = state.orderStation;
        if (
          outcome.result.matchedOrder &&
          orderStation &&
          orderStation.pendingOrder === null &&
          orderStation.nextSpawnTimer === 0
        ) {
          orderStation = {
            ...orderStation,
            nextSpawnTimer: DEFAULT_ORDER_SPAWN_DELAY,
          };
        }

        return {
          ...state,
          players: updatedPlayers,
          activeOrders: outcome.updatedActiveOrders,
          scoreState: updatedScoreState,
          orderStation,
        };
      }

      // If carried item is an ingredient, delivery station rejects it (no-op)
      return state;
    }

    if (targetStation?.type === "rice") {
      // Carrying an item at rice cooker does not return it (prevents accidental take/return cycle)
      return state;
    }

    // No valid station interaction with carried item
    return state;
  }

  // --- Player is empty-handed ---
  if (targetStation?.type === "fridge") {
    // Take ingredient from Fridge
    const ing = getFridgeIngredientForPlayerPos(player.pos, targetStation.pos);
    const fridge = state.fridge;
    if (fridge && fridge.compartments) {
      const comp = fridge.compartments[ing];
      if (!comp || comp.stock <= 0) {
        // Empty / refilling compartment -> cannot take
        return state;
      }
      const nextStock = comp.stock - 1;
      const totalTime =
        comp.totalRefillTime > 0
          ? comp.totalRefillTime
          : DEFAULT_FRIDGE_REFILL_TIME;
      const startRefill =
        comp.refillTimeRemaining === 0 && nextStock < comp.maxStock;
      const updatedCompartment = {
        ...comp,
        stock: nextStock,
        refillTimeRemaining: startRefill ? totalTime : comp.refillTimeRemaining,
        refillProgress: startRefill ? 0 : comp.refillProgress,
      };
      const updatedFridge = {
        ...fridge,
        compartments: {
          ...fridge.compartments,
          [ing]: updatedCompartment,
        },
      };
      const updatedPlayers = [...state.players] as typeof state.players;
      updatedPlayers[slot] = {
        ...player,
        carriedItem: createIngredientItem(ing),
      };

      return {
        ...state,
        players: updatedPlayers,
        fridge: updatedFridge,
      };
    }

    const updatedPlayers = [...state.players] as typeof state.players;
    updatedPlayers[slot] = {
      ...player,
      carriedItem: createIngredientItem(ing),
    };

    return {
      ...state,
      players: updatedPlayers,
    };
  }

  if (targetStation?.type === "rice") {
    // Rice Cooker interaction
    if (state.riceCooker.state === "ready" && state.riceCooker.portions > 0) {
      // Dispense 1 rice portion
      const nextPortions = state.riceCooker.portions - 1;
      const nextRiceState = nextPortions <= 0 ? "empty" : "ready";
      const updatedPlayers = [...state.players] as typeof state.players;
      updatedPlayers[slot] = {
        ...player,
        carriedItem: createIngredientItem("rice"),
      };

      return {
        ...state,
        players: updatedPlayers,
        riceCooker: {
          ...state.riceCooker,
          portions: nextPortions,
          state: nextRiceState,
        },
      };
    }

    if (state.riceCooker.state === "empty") {
      // Start cooking a new batch
      return {
        ...state,
        riceCooker: {
          ...state.riceCooker,
          state: "cooking",
          cookTimeRemaining: state.riceCooker.totalCookTime,
          cookingProgress: 0,
        },
      };
    }

    return state;
  }

  if (targetStation?.type === "roll") {
    const stationId = targetStation.id;
    const currentRollState = getRollStationState(state, stationId);

    // If roll station is actively rolling, player cannot interact with it
    if (currentRollState.state === "rolling") {
      return state;
    }

    // Check if current ingredients on roll station form a valid recipe
    const matchingRecipe = findMatchingRecipe(currentRollState.items);
    if (matchingRecipe) {
      // Start rolling recipe
      const updatedRollState: RollStationState = {
        ...currentRollState,
        state: "rolling",
        rollingRecipeId: matchingRecipe.id,
        rollingTimeRemaining: currentRollState.totalRollingTime,
        rollingProgress: 0,
        items: [],
      };
      return updateRollStationInWorld(state, stationId, updatedRollState);
    }

    // If no matching recipe (e.g. partial ingredients, invalid combination, or finished plate), pick up top item
    if (currentRollState.items.length > 0) {
      const remainingItems = [...currentRollState.items];
      const itemToTake = remainingItems.pop()!;
      const updatedPlayers = [...state.players] as typeof state.players;
      updatedPlayers[slot] = {
        ...player,
        carriedItem: itemToTake,
      };

      const updatedRollState: RollStationState = {
        ...currentRollState,
        items: remainingItems,
      };

      return updateRollStationInWorld(
        { ...state, players: updatedPlayers },
        stationId,
        updatedRollState,
      );
    }
  }

  if (targetStation?.type === "counter") {
    // Take top item from Counter
    const counterId = targetStation.id;
    const counterItems = state.counters[counterId]?.items ?? [];
    if (counterItems.length > 0) {
      const remainingItems = [...counterItems];
      const itemToTake = remainingItems.pop()!;
      const updatedPlayers = [...state.players] as typeof state.players;
      updatedPlayers[slot] = {
        ...player,
        carriedItem: itemToTake,
      };

      return {
        ...state,
        players: updatedPlayers,
        counters: {
          ...state.counters,
          [counterId]: { items: remainingItems },
        },
      };
    }
  }

  // If no station interaction took place, try picking up a dropped item on the floor
  const closestFloorItem = findClosestDroppedItem(
    player.pos,
    state.droppedItems,
  );
  if (closestFloorItem) {
    const remainingDropped = state.droppedItems.filter(
      (d) => d.id !== closestFloorItem.id,
    );
    const updatedPlayers = [...state.players] as typeof state.players;
    updatedPlayers[slot] = {
      ...player,
      carriedItem: closestFloorItem.item,
    };

    return {
      ...state,
      players: updatedPlayers,
      droppedItems: remainingDropped,
    };
  }

  return state;
}

function handleAction2(
  state: WorldState,
  slot: PlayerIndex,
  targetStation?: StationDefinition,
): WorldState {
  const player = state.players[slot];

  if (player.carriedItem) {
    // If targeting delivery station with a carried plate, deliver it via action2 (Abgeben / Ablegen)
    if (
      targetStation?.type === "delivery" &&
      player.carriedItem.type === "plate"
    ) {
      return handleAction1(state, slot, targetStation);
    }

    // Drop carried item onto the kitchen floor
    const dropOffset = 22;
    const dropX = Math.min(
      state.bounds.maxX - 10,
      Math.max(
        state.bounds.minX + 10,
        player.pos.x + player.facing.x * dropOffset,
      ),
    );
    const dropY = Math.min(
      state.bounds.maxY - 10,
      Math.max(
        state.bounds.minY + 10,
        player.pos.y + player.facing.y * dropOffset,
      ),
    );

    const dropped = createDroppedItem(player.carriedItem, {
      x: dropX,
      y: dropY,
    });
    const updatedPlayers = [...state.players] as typeof state.players;
    updatedPlayers[slot] = { ...player, carriedItem: null };

    return {
      ...state,
      players: updatedPlayers,
      droppedItems: [...state.droppedItems, dropped],
    };
  }

  // If empty-handed and targeting rice cooker while cooking, cancel cooking
  if (targetStation?.type === "rice" && state.riceCooker.state === "cooking") {
    return {
      ...state,
      riceCooker: {
        ...state.riceCooker,
        state: "empty",
        cookTimeRemaining: 0,
        cookingProgress: 0,
      },
    };
  }

  // If empty-handed and targeting roll station while rolling, cancel rolling
  if (targetStation?.type === "roll") {
    const stationId = targetStation.id;
    const currentRollState = getRollStationState(state, stationId);
    if (currentRollState.state === "rolling") {
      const cancelledRecipeId =
        currentRollState.rollingRecipeId ?? DEFAULT_RECIPE_ID;
      const recipe = getRecipeDefinition(cancelledRecipeId);
      const restoredItems = recipe.ingredients.map((ing) =>
        createIngredientItem(ing),
      );
      const updatedRollState: RollStationState = {
        ...currentRollState,
        state: "idle",
        items: restoredItems,
        rollingRecipeId: null,
        rollingTimeRemaining: 0,
        rollingProgress: 0,
      };
      return updateRollStationInWorld(state, stationId, updatedRollState);
    }
  }

  return state;
}
