import { getRandomMove } from "./ai";
import { dealDamage, isGameOver } from "./battleEngine";
import { BattleState } from "./battleTypes";

export function playerAttack(
  state: BattleState,
  moveIndex: number,
): BattleState {
  const move = state.player.moves[moveIndex];
  const enemyHp = dealDamage(state.enemy.hp, move, state.enemy.type);

  let newState: BattleState = {
    ...state,
    enemy: { ...state.enemy, hp: enemyHp },
    log: [...state.log, `Player used ${move.name}`],
  };

  const winner = isGameOver(newState);
  if (winner) return { ...newState, winner };

  return enemyTurn(newState);
}

export function enemyTurn(state: BattleState): BattleState {
  const move = getRandomMove(state.enemy);
  const playerHp = dealDamage(state.player.hp, move, state.player.type);

  let newState: BattleState = {
    ...state,
    player: { ...state.player, hp: playerHp },
    log: [...state.log, `Enemy used ${move.name}`],
  };

  const winner = isGameOver(newState);
  if (winner) return { ...newState, winner };

  return newState;
}
