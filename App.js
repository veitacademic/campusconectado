import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@campus-conectado/agenda-v1';

const palette = {
  paper: '#F5F3FA',
  sheet: '#FFFFFF',
  ink: '#302D42',
  softInk: '#666477',
  quiet: '#8D8A9E',
  line: '#E5E2ED',
  accent: '#7B68AD',
  accentDark: '#5B4A8E',
  blush: '#F0ECF8',
  blue: '#E8EAF6',
  blueInk: '#5D5F91',
  marker: '#DCEFE7',
  green: '#E1EFE7',
  greenInk: '#47705A',
  red: '#A04448',
  white: '#FFFFFF',
};

const blankActivity = { title: '', discipline: '', description: '', dueDate: '' };

function formatDateInput(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function toIsoDate(value) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return `${yyyy}-${mm}-${dd}`;
}

function fromIsoDate(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function InputField({ label, value, onChangeText, placeholder, error, multiline, keyboardType, maxLength }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9A9E9A"
        multiline={multiline}
        keyboardType={keyboardType || 'default'}
        maxLength={maxLength}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[styles.input, multiline && styles.multilineInput, error && styles.inputInvalid]}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function ActivityCard({ activity, onToggle, onEdit, onDelete }) {
  const done = activity.completed;
  return (
    <View style={[styles.activityCard, done && styles.activityCardDone]}>
      <View style={[styles.cardRule, { backgroundColor: done ? '#8CA28E' : palette.accent }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeading}>
          <View style={styles.activityCopy}>
            <Text style={styles.discipline}>{activity.discipline}</Text>
            <Text style={[styles.activityTitle, done && styles.doneTitle]}>{activity.title}</Text>
          </View>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: done }}
            accessibilityLabel={done ? 'Marcar atividade como pendente' : 'Marcar atividade como concluída'}
            onPress={onToggle}
            style={[styles.checkbox, done && styles.checkboxDone]}
          >
            {done ? <Text style={styles.checkmark}>✓</Text> : null}
          </Pressable>
        </View>

        <Text style={[styles.activityDescription, done && styles.doneDescription]}>{activity.description}</Text>

        <View style={styles.cardFooter}>
          <View style={styles.deadlineRow}>
            <View style={[styles.deadlineDot, done && styles.deadlineDotDone]} />
            <Text style={styles.deadlineLabel}>{done ? 'Concluída' : 'Prazo'}</Text>
            <Text style={styles.deadlineDate}>{fromIsoDate(activity.dueDate)}</Text>
          </View>
          <View style={styles.cardActions}>
            <Pressable onPress={onEdit} accessibilityRole="button" style={styles.textAction}>
              <Text style={styles.editAction}>Editar</Text>
            </Pressable>
            <Text style={styles.actionSeparator}>·</Text>
            <Pressable onPress={onDelete} accessibilityRole="button" style={styles.textAction}>
              <Text style={styles.deleteAction}>Excluir</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function App() {
  const [activities, setActivities] = useState([]);
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState('list');
  const [filter, setFilter] = useState('Tudo');
  const [form, setForm] = useState(blankActivity);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!mounted) return;
        const parsed = stored ? JSON.parse(stored) : [];
        setActivities(Array.isArray(parsed) ? parsed : []);
      })
      .catch(() => {
        if (mounted) setActivities([]);
      })
      .finally(() => {
        if (mounted) setReady(true);
      });
    return () => { mounted = false; };
  }, []);

  const visibleActivities = useMemo(() => {
    const filtered = activities.filter((activity) => {
      if (filter === 'Pendentes') return !activity.completed;
      if (filter === 'Concluídas') return activity.completed;
      return true;
    });
    return filtered.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [activities, filter]);

  async function saveActivities(next) {
    setActivities(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      Alert.alert('Não foi possível salvar', 'Confira o armazenamento do aparelho e tente novamente.');
    }
  }

  function startNewActivity() {
    setEditingId(null);
    setForm(blankActivity);
    setErrors({});
    setScreen('form');
  }

  function startEditing(activity) {
    setEditingId(activity.id);
    setForm({
      title: activity.title,
      discipline: activity.discipline,
      description: activity.description,
      dueDate: fromIsoDate(activity.dueDate),
    });
    setErrors({});
    setScreen('form');
  }

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: '' }));
  }

  async function submitActivity() {
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = 'Escreva um título.';
    if (!form.discipline.trim()) nextErrors.discipline = 'Informe a disciplina.';
    if (!form.description.trim()) nextErrors.description = 'Acrescente uma descrição.';
    const dueDate = toIsoDate(form.dueDate);
    if (!form.dueDate.trim()) nextErrors.dueDate = 'Informe o prazo.';
    else if (!dueDate) nextErrors.dueDate = 'Use uma data válida no formato DD/MM/AAAA.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const current = activities.find((activity) => activity.id === editingId);
    const nextActivity = {
      id: editingId || `${Date.now()}`,
      title: form.title.trim(),
      discipline: form.discipline.trim(),
      description: form.description.trim(),
      dueDate,
      completed: current ? current.completed : false,
    };
    const next = current
      ? activities.map((activity) => activity.id === editingId ? nextActivity : activity)
      : [nextActivity, ...activities];
    await saveActivities(next);
    setScreen('list');
  }

  async function toggleActivity(activity) {
    await saveActivities(activities.map((item) => (
      item.id === activity.id ? { ...item, completed: !item.completed } : item
    )));
  }

  function askToDelete(activity) {
    Alert.alert(
      'Apagar esta atividade?',
      `“${activity.title}” será retirada da sua lista.`,
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: () => saveActivities(activities.filter((item) => item.id !== activity.id)),
        },
      ],
    );
  }

  if (!ready) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor={palette.paper} barStyle="dark-content" />
        <View style={styles.loading}>
          <ActivityIndicator color={palette.accent} style={{ marginTop: 14 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={palette.paper} barStyle="dark-content" />
      <View style={styles.app}>
        {screen === 'list' ? (
          <>
            <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
              <View style={styles.pageHeading}>
                <View style={styles.helloNote}>
                  <Text style={styles.helloNoteText}>Oi! Que bom ter você por aqui.</Text>
                </View>
                <Text style={styles.pageTitle}>O que tem pra fazer?</Text>
                <Text style={styles.pageSubtitle}>Seus trabalhos e prazos da faculdade, sem complicação.</Text>
              </View>

              <View style={styles.listMeta}>
                <Text style={styles.listMetaLabel}>SUAS ATIVIDADES</Text>
                <Text style={styles.listMetaCount}>
                  {activities.length} {activities.length === 1 ? 'atividade' : 'atividades'}
                </Text>
              </View>

              <View style={styles.filterRow}>
                {['Tudo', 'Pendentes', 'Concluídas'].map((option) => {
                  const active = filter === option;
                  return (
                    <Pressable
                      key={option}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => setFilter(option)}
                      style={[styles.filterTab, active && styles.filterTabActive]}
                    >
                      <Text style={[styles.filterText, active && styles.filterTextActive]}>{option}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {visibleActivities.length ? (
                <View style={styles.activityList}>
                  {visibleActivities.map((activity) => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      onToggle={() => toggleActivity(activity)}
                      onEdit={() => startEditing(activity)}
                      onDelete={() => askToDelete(activity)}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <View style={styles.emptyHeader}>
                    <View style={styles.emptyMarker}>
                      <Text style={styles.emptyMarkerText}>01</Text>
                    </View>
                    <Text style={styles.emptyEyebrow}>COMECE POR AQUI</Text>
                  </View>
                  <Text style={styles.emptyTitle}>
                    {activities.length ? 'Nada nessa lista por enquanto.' : 'Ainda não tem nada por aqui.'}
                  </Text>
                  <Text style={styles.emptyText}>
                    {activities.length
                      ? 'Escolha outra categoria para ver suas atividades.'
                      : 'Quando aparecer um trabalho ou uma entrega, anote aqui. Depois você acompanha o prazo.'}
                  </Text>
                  {!activities.length ? (
                    <Pressable onPress={startNewActivity} style={styles.emptyLink} accessibilityRole="button">
                      <Text style={styles.emptyLinkText}>Adicionar a primeira</Text>
                      <Text style={styles.emptyLinkArrow}>→</Text>
                    </Pressable>
                  ) : null}
                </View>
              )}

              <Text style={styles.listFootnote}>Tudo o que você adicionar fica salvo neste aparelho.</Text>
            </ScrollView>

            <View style={styles.bottomBar}>
              <Pressable onPress={startNewActivity} style={styles.addButton} accessibilityRole="button">
                <Text style={styles.addPlus}>＋</Text>
                <Text style={styles.addButtonText}>Adicionar atividade</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <KeyboardAvoidingView style={styles.formShell} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.formHeader}>
              <Pressable
                onPress={() => setScreen('list')}
                style={styles.backButton}
                accessibilityRole="button"
                accessibilityLabel="Voltar para suas atividades"
              >
                <Text style={styles.backText}>←</Text>
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={styles.formEyebrow}>CAMPUS CONECTADO</Text>
                <Text style={styles.formTitle}>{editingId ? 'Editar atividade' : 'Nova atividade'}</Text>
              </View>
              <Text style={styles.formIndex}>01 / 04</Text>
            </View>

            <ScrollView
              style={styles.formScroll}
              contentContainerStyle={styles.formContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.formIntro}>Deixe as informações por escrito para achar tudo depois.</Text>
              <InputField
                label="O que você precisa fazer?"
                value={form.title}
                onChangeText={(value) => updateField('title', value)}
                placeholder="Ex.: Entregar o trabalho final"
                maxLength={80}
                error={errors.title}
              />
              <InputField
                label="Disciplina"
                value={form.discipline}
                onChangeText={(value) => updateField('discipline', value)}
                placeholder="Ex.: Desenvolvimento Mobile"
                maxLength={60}
                error={errors.discipline}
              />
              <InputField
                label="Descrição"
                value={form.description}
                onChangeText={(value) => updateField('description', value)}
                placeholder="O que você precisa lembrar?"
                multiline
                maxLength={240}
                error={errors.description}
              />
              <InputField
                label="Prazo de entrega"
                value={form.dueDate}
                onChangeText={(value) => updateField('dueDate', formatDateInput(value))}
                placeholder="DD/MM/AAAA"
                keyboardType="number-pad"
                maxLength={10}
                error={errors.dueDate}
              />
              <Text style={styles.dateHint}>Dia / mês / ano</Text>
            </ScrollView>

            <View style={styles.formBottomBar}>
              <Pressable onPress={submitActivity} style={styles.saveButton} accessibilityRole="button">
                <Text style={styles.saveButtonText}>{editingId ? 'Salvar alterações' : 'Salvar atividade'}</Text>
                <Text style={styles.saveArrow}>→</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.paper },
  app: { flex: 1, backgroundColor: palette.paper },
  listContent: { paddingHorizontal: 21, paddingTop: 14, paddingBottom: 24 },
  pageHeading: { paddingTop: 22, paddingBottom: 20 },
  helloNote: { alignSelf: 'flex-start', backgroundColor: palette.blush, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9, marginBottom: 12, transform: [{ rotate: '-1deg' }] },
  helloNoteText: { color: palette.accentDark, fontSize: 11, fontStyle: 'italic', fontWeight: '600' },
  pageTitle: { color: palette.ink, fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.8 },
  pageSubtitle: { color: palette.softInk, fontSize: 13, lineHeight: 19, marginTop: 6, maxWidth: 290 },
  listMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 13, marginBottom: 8, borderTopWidth: 1, borderTopColor: palette.line },
  listMetaLabel: { color: palette.blueInk, fontSize: 9, fontWeight: '800', letterSpacing: 1.3 },
  listMetaCount: { color: palette.softInk, fontSize: 12, fontWeight: '600' },
  filterRow: { flexDirection: 'row', marginBottom: 14, borderBottomWidth: 1, borderBottomColor: palette.line },
  filterTab: { paddingVertical: 10, paddingHorizontal: 11, marginRight: 5, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  filterTabActive: { borderBottomColor: palette.accent },
  filterText: { color: palette.quiet, fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: palette.ink, fontWeight: '800' },
  activityList: { marginTop: 1 },
  activityCard: { flexDirection: 'row', backgroundColor: palette.sheet, borderWidth: 1, borderColor: '#E7E4EE', borderRadius: 15, marginBottom: 10, overflow: 'hidden' },
  activityCardDone: { backgroundColor: '#EFF4F0' },
  cardRule: { width: 4 },
  cardContent: { flex: 1, paddingHorizontal: 13, paddingTop: 12, paddingBottom: 10 },
  cardHeading: { flexDirection: 'row', alignItems: 'flex-start' },
  activityCopy: { flex: 1, paddingRight: 12 },
  discipline: { color: palette.blueInk, fontSize: 10, fontWeight: '800', letterSpacing: 0.4, marginBottom: 4 },
  activityTitle: { color: palette.ink, fontSize: 16, lineHeight: 21, fontWeight: '700' },
  doneTitle: { color: '#777D7A', textDecorationLine: 'line-through' },
  checkbox: { width: 23, height: 23, borderWidth: 1.5, borderColor: '#B2AEC2', borderRadius: 7, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxDone: { backgroundColor: palette.greenInk, borderColor: palette.greenInk },
  checkmark: { color: palette.white, fontSize: 14, fontWeight: '800', lineHeight: 16 },
  activityDescription: { color: palette.softInk, fontSize: 12, lineHeight: 18, marginTop: 9 },
  doneDescription: { color: palette.quiet },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 11, paddingTop: 9, borderTopWidth: 1, borderTopColor: '#EAE8F0' },
  deadlineRow: { flexDirection: 'row', alignItems: 'center' },
  deadlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.accent, marginRight: 6 },
  deadlineDotDone: { backgroundColor: palette.greenInk },
  deadlineLabel: { color: palette.quiet, fontSize: 10, marginRight: 5 },
  deadlineDate: { color: palette.ink, fontSize: 10, fontWeight: '700' },
  cardActions: { flexDirection: 'row', alignItems: 'center' },
  textAction: { paddingVertical: 4, paddingHorizontal: 3 },
  editAction: { color: palette.blueInk, fontSize: 10, fontWeight: '700' },
  deleteAction: { color: palette.red, fontSize: 10, fontWeight: '700' },
  actionSeparator: { color: '#B5B2BA', fontSize: 12, marginHorizontal: 4 },
  emptyState: { backgroundColor: '#F0EDF7', borderWidth: 1, borderColor: '#DBD5EA', borderStyle: 'dashed', borderRadius: 16, padding: 17, marginTop: 2 },
  emptyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 13 },
  emptyMarker: { width: 27, height: 27, borderRadius: 8, backgroundColor: palette.marker, alignItems: 'center', justifyContent: 'center', marginRight: 10, transform: [{ rotate: '3deg' }] },
  emptyMarkerText: { color: palette.blueInk, fontSize: 9, fontWeight: '900' },
  emptyEyebrow: { color: palette.accentDark, fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  emptyTitle: { color: palette.ink, fontSize: 17, lineHeight: 23, fontWeight: '700' },
  emptyText: { color: palette.softInk, fontSize: 12, lineHeight: 18, marginTop: 6, maxWidth: 275 },
  emptyLink: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderBottomWidth: 1, borderBottomColor: palette.accent, paddingBottom: 4, marginTop: 14 },
  emptyLinkText: { color: palette.accentDark, fontSize: 12, fontWeight: '800' },
  emptyLinkArrow: { color: palette.accentDark, fontSize: 16, marginLeft: 8, marginTop: -2 },
  listFootnote: { color: palette.quiet, fontSize: 10, marginTop: 14 },
  bottomBar: { paddingHorizontal: 21, paddingTop: 10, paddingBottom: 13, backgroundColor: palette.paper, borderTopWidth: 1, borderTopColor: palette.line },
  addButton: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: palette.accent, borderRadius: 14 },
  addPlus: { color: palette.white, fontSize: 21, fontWeight: '400', marginRight: 8, marginTop: -2 },
  addButtonText: { color: palette.white, fontSize: 14, fontWeight: '800' },
  formShell: { flex: 1 },
  formHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 21, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: palette.line },
  backButton: { width: 38, height: 38, borderWidth: 1, borderColor: palette.line, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: palette.sheet },
  backText: { color: palette.ink, fontSize: 19 },
  formEyebrow: { color: palette.quiet, fontSize: 9, fontWeight: '800', letterSpacing: 1.4 },
  formTitle: { color: palette.ink, fontSize: 18, fontWeight: '800', marginTop: 3 },
  formIndex: { color: palette.quiet, fontSize: 10, letterSpacing: 0.7 },
  formScroll: { flex: 1 },
  formContent: { paddingHorizontal: 21, paddingTop: 20, paddingBottom: 20 },
  formIntro: { color: palette.softInk, fontSize: 13, lineHeight: 19, marginBottom: 21 },
  field: { marginBottom: 17 },
  fieldLabel: { color: palette.ink, fontSize: 12, fontWeight: '700', marginBottom: 7 },
  input: { minHeight: 49, borderWidth: 1, borderColor: '#DDD9E8', borderRadius: 11, backgroundColor: palette.sheet, paddingHorizontal: 12, color: palette.ink, fontSize: 13 },
  multilineInput: { minHeight: 92, paddingTop: 11, paddingBottom: 10 },
  inputInvalid: { borderColor: palette.red },
  errorText: { color: palette.red, fontSize: 10, marginTop: 5 },
  dateHint: { color: palette.quiet, fontSize: 10, marginTop: -9 },
  formBottomBar: { paddingHorizontal: 21, paddingTop: 10, paddingBottom: 13, borderTopWidth: 1, borderTopColor: palette.line },
  saveButton: { minHeight: 50, backgroundColor: palette.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderRadius: 14 },
  saveButtonText: { color: palette.white, fontSize: 13, fontWeight: '800' },
  saveArrow: { color: '#B9EBCF', fontSize: 18 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.paper },
});
