import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Check, Plus, Trash2, LogOut, Edit2 } from 'lucide-react-native';

type MonthlyTask = {
  id: string;
  task_template_id: string | null;
  title: string;
  category: string;
  month: number;
  year: number;
  completed: boolean;
  notes: string;
  user_id: string;
  created_at: string;
};

export default function MonthlyTasksScreen() {
  const { user, signOut } = useAuth();
  const [tasks, setTasks] = useState<MonthlyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState('');
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('monthly_tasks')
        .select('*')
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .eq('user_id', user?.id!)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleComplete = async (task: MonthlyTask) => {
    try {
      const { error } = await supabase
        .from('monthly_tasks')
        .update({ completed: !task.completed })
        .eq('id', task.id);

      if (error) throw error;
      await loadTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const updateNotes = async (taskId: string, notes: string) => {
    if (notes.length > 50) {
      Alert.alert('Error', 'Las notas no pueden exceder 50 caracteres');
      return;
    }

    try {
      const { error } = await supabase
        .from('monthly_tasks')
        .update({ notes })
        .eq('id', taskId);

      if (error) throw error;
      setEditingNotes(null);
      setNotesValue('');
      await loadTasks();
    } catch (error) {
      console.error('Error updating notes:', error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('monthly_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      await loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const renderTask = ({ item }: { item: MonthlyTask }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <TouchableOpacity
          onPress={() => toggleComplete(item)}
          style={styles.checkbox}
        >
          <View
            style={[
              styles.checkboxInner,
              item.completed && styles.checkboxChecked,
            ]}
          >
            {item.completed && <Check size={18} color="#fff" />}
          </View>
        </TouchableOpacity>

        <View style={styles.taskContent}>
          <Text
            style={[styles.taskTitle, item.completed && styles.taskCompleted]}
          >
            {item.title}
          </Text>
          <Text style={styles.taskCategory}>{item.category}</Text>
          {item.notes ? (
            <Text style={styles.taskNotes}>{item.notes}</Text>
          ) : null}
        </View>

        <View style={styles.taskActions}>
          <TouchableOpacity
            onPress={() => {
              setEditingNotes(item.id);
              setNotesValue(item.notes || '');
            }}
            style={styles.actionButton}
          >
            <Edit2 size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => deleteTask(item.id)}
            style={styles.actionButton}
          >
            <Trash2 size={20} color="#ff3b30" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.monthTitle}>
            {monthNames[currentMonth - 1]} {currentYear}
          </Text>
          <Text style={styles.taskCount}>
            {tasks.filter((t) => t.completed).length} de {tasks.length}{' '}
            completadas
          </Text>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
          <LogOut size={24} color="#ff3b30" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadTasks} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No hay tareas para este mes
            </Text>
            <Text style={styles.emptySubtext}>
              Ve a "Mis Plantillas" para crear tareas
            </Text>
          </View>
        }
      />

      <Modal
        visible={editingNotes !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingNotes(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Notas</Text>
            <TextInput
              style={styles.modalInput}
              value={notesValue}
              onChangeText={setNotesValue}
              placeholder="Agregar notas (máx. 50 caracteres)"
              maxLength={50}
              multiline
            />
            <Text style={styles.characterCount}>
              {notesValue.length}/50 caracteres
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => {
                  setEditingNotes(null);
                  setNotesValue('');
                }}
                style={[styles.modalButton, styles.modalButtonCancel]}
              >
                <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (editingNotes) {
                    updateNotes(editingNotes, notesValue);
                  }
                }}
                style={[styles.modalButton, styles.modalButtonSave]}
              >
                <Text style={styles.modalButtonTextSave}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  monthTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  taskCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  listContent: {
    padding: 16,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    marginRight: 12,
    marginTop: 2,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  taskCategory: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  taskNotes: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  taskActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f5f5f5',
  },
  modalButtonSave: {
    backgroundColor: '#007AFF',
  },
  modalButtonTextCancel: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextSave: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
