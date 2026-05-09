import * as DocumentPicker from 'expo-document-picker';
import ICAL from 'ical.js';

export type ParsedCalendarActivity = {
  external_uid: string;
  title: string;
  description: string | null;
  due_at: string | null;
  source_url: string | null;
  type: string;
  unit_number: number | null;
  priority: string;
  subject_name: string;
  subject_code: string | null;
};

export async function importCalendarFile(): Promise<ParsedCalendarActivity[]> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['text/calendar', 'text/*', '*/*'],
    copyToCacheDirectory: true,
  });

  if (result.canceled) {
    return [];
  }

  const file = result.assets[0];

  const response = await fetch(file.uri);
  const icsText = await response.text();

  console.log('ICS TEXTO:', icsText.slice(0, 1000));

  return parseICS(icsText);
}

export function parseICS(icsText: string): ParsedCalendarActivity[] {
  const jcalData = ICAL.parse(icsText);
  const component = new ICAL.Component(jcalData);

  const events = component.getAllSubcomponents('vevent');
  const todos = component.getAllSubcomponents('vtodo');

  console.log('VEVENT encontrados:', events.length);
  console.log('VTODO encontrados:', todos.length);

  const parsedEvents = events.map(parseEvent);
  const parsedTodos = todos.map(parseTodo);

  return [...parsedEvents, ...parsedTodos].filter(
    (activity) => activity.title && activity.due_at
  );
}

function parseEvent(event: ICAL.Component): ParsedCalendarActivity {
  const vevent = new ICAL.Event(event);

  const title = vevent.summary || 'Actividad sin título';
  const description = vevent.description || null;
  const location = vevent.location || null;

  const subjectCode = getCategories(event);

  console.log('CATEGORIA DETECTADA:', subjectCode);

  const startDate = vevent.startDate?.toJSDate?.();
  const endDate = vevent.endDate?.toJSDate?.();

  const dueDate = endDate || startDate || null;

  return {
    external_uid: vevent.uid || crypto.randomUUID(),
    title,
    description,
    due_at: dueDate ? dueDate.toISOString() : null,
    source_url: location,
    type: inferActivityType(title),
    unit_number: inferUnitNumber(title, description),
    priority: inferPriority(title),
    subject_name: subjectCode || 'Materia sin clasificar',
    subject_code: subjectCode,
  };
}

function parseTodo(todo: ICAL.Component): ParsedCalendarActivity {
  const title =
    todo.getFirstPropertyValue('summary')?.toString() ||
    'Actividad sin título';

  const description =
    todo.getFirstPropertyValue('description')?.toString() || null;

  const uid =
    todo.getFirstPropertyValue('uid')?.toString() || crypto.randomUUID();

  const location =
    todo.getFirstPropertyValue('location')?.toString() || null;

  const subjectCode = getCategories(todo);

  console.log('CATEGORIA TODO DETECTADA:', subjectCode);

  const due =
    todo.getFirstPropertyValue('due') ||
    todo.getFirstPropertyValue('dtstart') ||
    todo.getFirstPropertyValue('completed');

  let dueAt: string | null = null;

  if (due && typeof due === 'object' && 'toJSDate' in due) {
    dueAt = due.toJSDate().toISOString();
  }

  return {
    external_uid: uid,
    title,
    description,
    due_at: dueAt,
    source_url: location,
    type: inferActivityType(title),
    unit_number: inferUnitNumber(title, description),
    priority: inferPriority(title),
    subject_name: subjectCode || 'Materia sin clasificar',
    subject_code: subjectCode,
  };
}

function getCategories(component: ICAL.Component) {
  const categoryValue = component.getFirstPropertyValue('categories');

  if (Array.isArray(categoryValue)) {
    return categoryValue.join(', ');
  }

  if (typeof categoryValue === 'string') {
    return categoryValue;
  }

  if (categoryValue) {
    return categoryValue.toString();
  }

  const categoryProperty = component.getFirstProperty('categories');

  if (categoryProperty) {
    const value = categoryProperty.getFirstValue();

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    if (typeof value === 'string') {
      return value;
    }

    if (value) {
      return value.toString();
    }
  }

  return null;
}

function inferActivityType(title: string) {
  const value = title.toLowerCase();

  if (value.includes('evaluación') || value.includes('evaluacion')) {
    return 'evaluation';
  }

  if (value.includes('examen')) {
    return 'evaluation';
  }

  if (value.includes('protocolo')) {
    return 'protocol';
  }

  if (value.includes('tcc') || value.includes('trabajo final')) {
    return 'final_project';
  }

  return 'activity';
}

function inferUnitNumber(title: string, description?: string | null) {
  const text = `${title || ''} ${description || ''}`;

  const match = text.match(/unidad\s*(\d+)/i);

  if (!match) return null;

  return Number(match[1]);
}

function inferPriority(title: string) {
  const value = title.toLowerCase();

  if (
    value.includes('final') ||
    value.includes('evaluación') ||
    value.includes('evaluacion') ||
    value.includes('examen')
  ) {
    return 'high';
  }

  return 'normal';
}