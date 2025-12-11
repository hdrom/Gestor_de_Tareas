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
import { Plus, Trash2, Edit2, RefreshCw } from 'lucide-react-native';

type TaskTemplate = {
  id: string;
  title: string;
  category: string;
  user_id: string;
  created_at: string;
};

const CATEGORIES = [
  'Pago',
  'Recordatorio',
  'Trámite',
  'Compra',
  'Otro',
];

export default function TemplatesScreen() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(
    null
  );
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('task_templates')
        .select('*')
        .eq('user_id', user?.id!)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const openModal = (template?: TaskTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setTitle(template.title);
      setCategory(template.category);
    } else {
      setEditingTemplate(null);
      setTitle('');
      setCategory(CATEGORIES[0]);
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingTemplate(null);
    setTitle('');
    setCategory(CATEGORIES[0]);
  };

  const saveTemplate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Por favor ingresa un título para la tarea');
      return;
    }

    try {
      if (editingTemplate) {
        const { error } = await supabase
          .from('task_templates')
          .update({ title: title.trim(), category })
          .eq('id', editingTemplate.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('task_templates').insert({
          title: title.trim(),
          category,
          user_id: user?.id!,
        });

        if (error) throw error;
      }

      closeModal();
      await loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      Alert.alert('Error', 'No se pudo guardar la plantilla');
    }
  };

  const deleteTemplate = async (templateId: string) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que deseas eliminar esta plantilla?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('task_templates')
                .delete()
                .eq('id', templateId);

              if (error) throw error;
              await loadTemplates();
            } catch (error) {
              console.error('Error deleting template:', error);
            }
          },
        },
      ]
    );
  };

  const generateMonthlyTasks = async () => {
    if (templates.length === 0) {
      Alert.alert(
        'Sin plantillas',
        'Primero debes crear plantillas de tareas'
      );
      return;
    }

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    Alert.alert(
      'Generar tareas del mes',
      `¿Deseas generar tareas para este mes basadas en tus plantillas? Esto creará ${templates.length} tareas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Generar',
          onPress: async () => {
            setGenerating(true);
            try {
              const { data: existingTasks } = await supabase
                .from('monthly_tasks')
                .select('task_template_id')
                .eq('month', currentMonth)
                .eq('year', currentYear)
                .eq('user_id', user?.id!);

              const existingTemplateIds = new Set(
                existingTasks?.map((t) => t.task_template_id) || []
              );

              const tasksToCreate = templates
                .filter((template) => !existingTemplateIds.has(template.id))
                .map((template) => ({
                  task_template_id: template.id,
                  title: template.title,
                  category: template.category,
                  month: currentMonth,
                  year: currentYear,
                  completed: false,
                  notes: '',
                  user_id: user?.id!,
                }));

              if (tasksToCreate.length === 0) {
                Alert.alert(
                  'Información',
                  'Ya existen tareas creadas para este mes basadas en tus plantillas'
                );
                return;
              }

              const { error } = await supabase
                .from('monthly_tasks')
                .insert(tasksToCreate);

              if (error) throw error;

              Alert.alert(
                'Éxito',
                `Se crearon ${tasksToCreate.length} tareas para este mes`
              );
            } catch (error) {
              console.error('Error generating tasks:', error);
              Alert.alert('Error', 'No se pudieron generar las tareas');
            } finally {
              setGenerating(false);
            }
          },
        },
      ]
    );
  };

  const renderTemplate = ({ item }: { item: TaskTemplate }) => (
    <View style={styles.templateCard}>
      <View style={styles.templateContent}>
        <Text style={styles.templateTitle}>{item.title}</Text>
        <Text style={styles.templateCategory}>{item.category}</Text>
      </View>
      <View style={styles.templateActions}>
        <TouchableOpacity
          onPress={() => openModal(item)}
          style={styles.actionButton}
        >
          <Edit2 size={20} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => deleteTemplate(item.id)}
          style={styles.actionButton}
        >
          <Trash2 size={20} color="#ff3b30" />
        </TouchableOpacity>
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
        <Text style={styles.headerTitle}>
          {templates.length} plantilla{templates.length !== 1 ? 's' : ''}
        </Text>
        <TouchableOpacity
          onPress={generateMonthlyTasks}
          style={styles.generateButton}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <RefreshCw size={20} color="#fff" />
              <Text style={styles.generateButtonText}>Generar Mes</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={templates}
        renderItem={renderTemplate}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadTemplates} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No hay plantillas creadas</Text>
            <Text style={styles.emptySubtext}>
              Crea plantillas de tareas que se repiten cada mes
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => openModal()}
      >
        <Plus size={24} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingTemplate ? 'Editar' : 'Nueva'} Plantilla
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Título de la tarea"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Categoría</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[
                    styles.categoryButton,
                    category === cat && styles.categoryButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      category === cat && styles.categoryButtonTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={closeModal}
                style={[styles.modalButton, styles.modalButtonCancel]}
              >
                <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveTemplate}
                style={[styles.modalButton, styles.modalButtonSave]}
              >
                <Text style={styles.modalButtonTextSave}>
                  {editingTemplate ? 'Actualizar' : 'Crear'}
                </Text>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  generateButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  listContent: {
    padding: 16,
  },
  templateCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  templateContent: {
    flex: 1,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  templateCategory: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  templateActions: {
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
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
    marginBottom: 20,
    color: '#1a1a1a',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1a1a1a',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  categoryButtonTextActive: {
    color: '#fff',
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
