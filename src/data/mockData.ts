export type ActivityStatus =
  | "pending"
  | "completed"
  | "overdue"
  | "upcoming";

export type ActivityPriority = "low" | "medium" | "high";

export type Activity = {
  id: string;
  title: string;
  subject: string;
  unit: string;
  date: string;
  status: ActivityStatus;
  priority: ActivityPriority;
  platformUrl: string;
};

export type Subject = {
  id: string;
  name: string;
  progress: number;
  pending: number;
  currentUnit: string;
};

export type UnitActivity = {
  id: string;
  title: string;
  subject: string;
  date: string;
  status: ActivityStatus;
};

export type Unit = {
  title: string;
  pending: number;
  activities: UnitActivity[];
};

export const subjects: Subject[] = [
  {
    id: "programacion",
    name: "Programación",
    progress: 72,
    pending: 2,
    currentUnit: "Unidad 2",
  },
  {
    id: "bases-datos",
    name: "Bases de datos",
    progress: 48,
    pending: 5,
    currentUnit: "Unidad 1",
  },
  {
    id: "arquitectura",
    name: "Arquitectura",
    progress: 85,
    pending: 1,
    currentUnit: "Unidad 4",
  },
];

export const activities: Activity[] = [
  {
    id: "protocolo-u1",
    title: "Protocolo individual",
    subject: "Programación",
    unit: "Unidad 1",
    date: "Completado",
    status: "completed",
    priority: "low",
    platformUrl: "https://moodle.org",
  },
  {
    id: "evaluacion-unidad-2",
    title: "Evaluación Unidad 2",
    subject: "Programación",
    unit: "Unidad 2",
    date: "Hoy · 11:59 PM",
    status: "pending",
    priority: "high",
    platformUrl: "https://moodle.org",
  },
  {
    id: "actividad-practica",
    title: "Actividad práctica",
    subject: "Programación",
    unit: "Unidad 2",
    date: "En 3 días",
    status: "upcoming",
    priority: "medium",
    platformUrl: "https://moodle.org",
  },
  {
    id: "modelo-er",
    title: "Modelo entidad relación",
    subject: "Bases de datos",
    unit: "Unidad 1",
    date: "Mañana",
    status: "pending",
    priority: "medium",
    platformUrl: "https://moodle.org",
  },
  {
    id: "actividad-arquitectura",
    title: "Actividad práctica",
    subject: "Arquitectura",
    unit: "Unidad 4",
    date: "En 3 días",
    status: "upcoming",
    priority: "medium",
    platformUrl: "https://moodle.org",
  },
];

export const subjectUnits: Record<string, Unit[]> = {
  programacion: [
    {
      title: "Unidad 1",
      pending: 0,
      activities: [
        {
          id: "protocolo-u1",
          title: "Protocolo individual",
          subject: "Programación",
          date: "Completado",
          status: "completed",
        },
      ],
    },
    {
      title: "Unidad 2",
      pending: 2,
      activities: [
        {
          id: "evaluacion-unidad-2",
          title: "Evaluación Unidad 2",
          subject: "Programación",
          date: "Hoy · 11:59 PM",
          status: "pending",
        },
        {
          id: "actividad-practica",
          title: "Actividad práctica",
          subject: "Programación",
          date: "En 3 días",
          status: "upcoming",
        },
      ],
    },
  ],

  "bases-datos": [
    {
      title: "Unidad 1",
      pending: 1,
      activities: [
        {
          id: "modelo-er",
          title: "Modelo entidad relación",
          subject: "Bases de datos",
          date: "Mañana",
          status: "pending",
        },
      ],
    },
  ],

  arquitectura: [
    {
      title: "Unidad 4",
      pending: 1,
      activities: [
        {
          id: "actividad-arquitectura",
          title: "Actividad práctica",
          subject: "Arquitectura",
          date: "En 3 días",
          status: "upcoming",
        },
      ],
    },
  ],
};