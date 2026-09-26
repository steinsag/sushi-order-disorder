import type { PlayerIndex } from "../input/PlayerInput";
import type { Vec2 } from "../math/vec2";
import type { IngredientType } from "./IngredientConfig";
import {
  createDroppedItem,
  createIngredientItem,
  createPlateItem,
  type DroppedItem,
} from "../state/ItemState";
import type { WorldState } from "../state/WorldState";
import type { StationDefinition } from "./StationConfig";
import {
  DEFAULT_RECIPE_ID,
  findMatchingRecipe,
  getRecipeDefinition,
} from "./RecipeConfig";
import {
  acceptOrderAtCounter,
  advanceActiveOrders,
  advanceOrderStationState,
} from "./OrderRules";

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

  // 2. Advance roll station
  let rollStation = state.rollStation;
  if (rollStation.state === "rolling") {
    const newRollTime = Math.max(0, rollStation.rollingTimeRemaining - dt);
    const total = rollStation.totalRollingTime;
    const progress =
      total > 0 ? Math.min(1, Math.max(0, 1 - newRollTime / total)) : 1;

    if (newRollTime <= 0) {
      const recipeId = rollStation.rollingRecipeId ?? DEFAULT_RECIPE_ID;
      const plate = createPlateItem(recipeId);
      rollStation = {
        ...rollStation,
        state: "idle",
        items: [plate],
        rollingTimeRemaining: 0,
        rollingProgress: 0,
        rollingRecipeId: null,
      };
    } else {
      rollStation = {
        ...rollStation,
        rollingTimeRemaining: newRollTime,
        rollingProgress: progress,
      };
    }
  }

  // 3. Advance active orders countdown
  const activeOrders = state.activeOrders
    ? advanceActiveOrders(state.activeOrders, dt)
    : [];

  // 4. Advance order station state (spawning new orders if needed)
  const activeCount = activeOrders.filter((o) => o.status === "active").length;
  const orderStation = state.orderStation
    ? advanceOrderStationState(state.orderStation, activeCount, dt)
    : state.orderStation;

  return {
    ...state,
    riceCooker,
    rollStation,
    activeOrders,
    orderStation,
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
    const result = acceptOrderAtCounter(state.orderStation, state.activeOrders);
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
      // If roll station is actively rolling, player cannot place item onto it
      if (state.rollStation.state === "rolling") {
        return state;
      }

      // Place item onto Roll Station
      const updatedRollItems = [...state.rollStation.items, carried];
      const updatedPlayers = [...state.players] as typeof state.players;
      updatedPlayers[slot] = { ...player, carriedItem: null };

      return {
        ...state,
        players: updatedPlayers,
        rollStation: { ...state.rollStation, items: updatedRollItems },
      };
    }

    if (targetStation?.type === "counter") {
      // Place item onto Counter
      const counterId = targetStation.id;
      const counterItems = state.counters[counterId]?.items ?? [];
      const updatedCounters = {
        ...state.counters,
        [counterId]: { items: [...counterItems, carried] },
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
      // Swap carried ingredient with selected fridge ingredient
      const nextIng = getFridgeIngredientForPlayerPos(
        player.pos,
        targetStation.pos,
      );
      const updatedPlayers = [...state.players] as typeof state.players;
      updatedPlayers[slot] = {
        ...player,
        carriedItem: createIngredientItem(nextIng),
      };

      return {
        ...state,
        players: updatedPlayers,
      };
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
    // If roll station is actively rolling, player cannot interact with it
    if (state.rollStation.state === "rolling") {
      return state;
    }

    // Check if current ingredients on roll station form a valid recipe
    const matchingRecipe = findMatchingRecipe(state.rollStation.items);
    if (matchingRecipe) {
      // Start rolling recipe
      return {
        ...state,
        rollStation: {
          ...state.rollStation,
          state: "rolling",
          rollingRecipeId: matchingRecipe.id,
          rollingTimeRemaining: state.rollStation.totalRollingTime,
          rollingProgress: 0,
          items: [],
        },
      };
    }

    // If no matching recipe (e.g. partial ingredients, invalid combination, or finished plate), pick up top item
    if (state.rollStation.items.length > 0) {
      const remainingItems = [...state.rollStation.items];
      const itemToTake = remainingItems.pop()!;
      const updatedPlayers = [...state.players] as typeof state.players;
      updatedPlayers[slot] = {
        ...player,
        carriedItem: itemToTake,
      };

      return {
        ...state,
        players: updatedPlayers,
        rollStation: { ...state.rollStation, items: remainingItems },
      };
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
  if (targetStation?.type === "roll" && state.rollStation.state === "rolling") {
    const cancelledRecipeId =
      state.rollStation.rollingRecipeId ?? DEFAULT_RECIPE_ID;
    const recipe = getRecipeDefinition(cancelledRecipeId);
    const restoredItems = recipe.ingredients.map((ing) =>
      createIngredientItem(ing),
    );
    return {
      ...state,
      rollStation: {
        ...state.rollStation,
        state: "idle",
        items: restoredItems,
        rollingRecipeId: null,
        rollingTimeRemaining: 0,
        rollingProgress: 0,
      },
    };
  }

  return state;
}
