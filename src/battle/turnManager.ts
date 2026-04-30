import { getRandomMove } from "./ai";
import { dealDamage, isGameOver } from "./battleEngine";
import { BattleState } from "./battleTypes";

export function playerAttack(
  state: BattleState,
  moveIndex: number,
): BattleState {
  const move = state.player.moves[moveIndex];
  const { damage } = dealDamage(
    state.player,
    state.playerStages,
    state.enemy,
    state.enemyStages,
    move
  );

  const enemyHp = Math.max(0, state.enemy.hp - damage);

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
  const { damage } = dealDamage(
    state.enemy,
    state.enemyStages,
    state.player,
    state.playerStages,
    move
  );
  
  const playerHp = Math.max(0, state.player.hp - damage);

  let newState: BattleState = {
    ...state,
    player: { ...state.player, hp: playerHp },
    log: [...state.log, `Enemy used ${move.name}`],
  };

  const winner = isGameOver(newState);
  if (winner) return { ...newState, winner };

  return newState;
}
