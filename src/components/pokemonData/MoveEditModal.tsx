import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { colors } from '../../theme/color';
import { MOVES } from '../../data/pokemon/moves/moves';
import { BATTLE_MOVES } from '../../data/pokemon/moves/movesBattle';
import { SPECIES } from '../../data/pokemon/species/species';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TypeBadge } from '../TypeBadge';
import { Move, Pokemon } from '../../types/pokemon';

interface Props {
  visible: boolean;
  onClose: () => void;
  pokemon: Pokemon;
  onConfirm: (newMoves: Move[], replacedMoveId?: string) => void;
}

export const MoveEditModal: React.FC<Props> = ({ visible, onClose, pokemon, onConfirm }) => {
  const [step, setStep] = useState<1 | 2>(1); // 1: Choose move to relearn, 2: Choose move to forget
  const [selectedNewMove, setSelectedNewMove] = useState<Move | null>(null);
  const [availableMoves, setAvailableMoves] = useState<Move[]>([]);

  useEffect(() => {
    if (visible) {
      setStep(1);
      setSelectedNewMove(null);
      
      const speciesData = SPECIES[pokemon.speciesId];
      if (!speciesData) return;

      const normalize = (s: string) => s.toLowerCase().replace(/[\s-]/g, '');
      const currentMoveNorm = pokemon.moves.map(m => normalize(m.name));
      
      const learnable = speciesData.rawMoves
        .filter(m => m.levelLearned <= pokemon.level)
        .filter(m => !currentMoveNorm.includes(normalize(m.name)))
        .map(m => {
           const slug = m.name.toLowerCase();
           const battleData = BATTLE_MOVES[slug];
           
           if (!battleData || battleData.category === 'unique') return null;
           
           return {
             name: battleData.name || m.name.replace(/-/g, ' '),
             power: battleData.power || 0,
             pp: battleData.pp || 0,
             maxPp: battleData.pp || 0,
             type: battleData.type,
             accuracy: battleData.accuracy,
             damageClass: battleData.damageClass,
             description: battleData.description,
             priority: battleData.priority
           } as Move;
        })
        .filter((m): m is Move => m !== null);

      // Deduplicate by name
      const uniqueLearnable = Array.from(new Map(learnable.map(m => [m.name.toLowerCase(), m])).values());
      setAvailableMoves(uniqueLearnable);
    }
  }, [visible, pokemon]);

  const handleSelectNewMove = (move: Move) => {
    setSelectedNewMove(move);
    setStep(2);
  };

  const handleForgetMove = (index: number) => {
    if (!selectedNewMove) return;
    const newMoves = [...pokemon.moves];
    const replacedMoveId = newMoves[index].id;
    newMoves[index] = selectedNewMove;
    onConfirm(newMoves, replacedMoveId);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>
            {step === 1 ? 'Relearn a Move' : 'Forget a Move'}
          </Text>
          
          {step === 1 ? (
            <ScrollView style={styles.scroll}>
              {availableMoves.length > 0 ? (
                availableMoves.map((move, i) => (
                  <TouchableOpacity key={i} style={styles.moveItem} onPress={() => handleSelectNewMove(move)}>
                    <View style={styles.moveHeader}>
                      <Text style={styles.moveName}>{move.name.toUpperCase()}</Text>
                      <TypeBadge type={move.type || 'normal'} size="small" />
                    </View>
                    <Text style={styles.moveDetail}>PWR: {move.power || '-'} | ACC: {move.accuracy ? `${move.accuracy}%` : '-'} | PP: {move.pp}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.emptyText}>No previously learned moves to relearn.</Text>
              )}
            </ScrollView>
          ) : (
            <View>
              <View style={styles.replacingBox}>
                <Text style={styles.replacingLabel}>Relearning:</Text>
                <View style={styles.moveHeader}>
                  <Text style={styles.replacingName}>{selectedNewMove?.name.toUpperCase()}</Text>
                  <TypeBadge type={selectedNewMove?.type || 'normal'} size="small" />
                </View>
              </View>
              
              <Text style={styles.instruction}>Select which move to replace:</Text>
              
              {pokemon.moves.map((move, i) => (
                <TouchableOpacity key={i} style={styles.moveItem} onPress={() => handleForgetMove(i)}>
                  <View style={styles.moveHeader}>
                    <Text style={styles.moveName}>{move.name.toUpperCase()}</Text>
                    <TypeBadge type={move.type || 'normal'} size="small" />
                  </View>
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
                <Text style={styles.backButtonText}>Back to Selection</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.modalOverlay, justifyContent: 'center', padding: 20 },
  container: { backgroundColor: colors.modalBackgroundPrimary, padding: 20, borderRadius: 20, maxHeight: '80%', borderWidth: 1, borderColor: colors.modalBorderSubtle },
  title: { color: 'white', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  scroll: { maxHeight: 400 },
  moveItem: { backgroundColor: colors.modalContent, padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.modalBorderSubtle },
  moveHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  moveName: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  moveDetail: { color: '#9CA3AF', fontSize: 12 },
  emptyText: { color: '#9CA3AF', textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
  replacingBox: { backgroundColor: '#111827', padding: 15, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: colors.accent },
  replacingLabel: { color: colors.accent, fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  replacingName: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  instruction: { color: '#9CA3AF', marginBottom: 12, textAlign: 'center' },
  backButton: { marginTop: 10, padding: 10, alignItems: 'center' },
  backButtonText: { color: colors.accent, fontWeight: 'bold' },
  closeButton: { marginTop: 20, backgroundColor: '#374151', padding: 12, borderRadius: 12, alignItems: 'center' },
  closeButtonText: { color: 'white', fontWeight: 'bold' }
});
