"use client";

import { useEffect, useMemo, useState } from "react";

type CalendarMode = "business" | "calendar";
type ScheduleMode = "end" | "duration";
type ViewMode =
  | "overview"
  | "schedule"
  | "resources"
  | "costs"
  | "abc"
  | "help";
type ResourceType = "work" | "material" | "cost";
type WorkUnit = "diária" | "hora" | "mensal";
type CostAggregation = "resource" | "task";
type SortDirection = "asc" | "desc";
type PaymentMethod =
  | "Escritório"
  | "VExpenses"
  | "Faturamento"
  | "Cartão corporativo"
  | "Outro";
type PaymentTiming = "Início" | "Final" | "Rateado" | "15 dias" | "30 dias";
type ResourceSortKey =
  | "name"
  | "type"
  | "unit"
  | "rate"
  | "category"
  | "costCenter"
  | "payment"
  | "paymentTiming"
  | "costAggregation"
  | "total";
type AssignmentSortKey =
  | "resource"
  | "type"
  | "category"
  | "costCenter"
  | "amount"
  | "cost";
type CostSortKey =
  | "task"
  | "resource"
  | "type"
  | "category"
  | "costCenter"
  | "basis"
  | "payment"
  | "cost";

type Task = {
  id: number;
  name: string;
  start: string;
  end: string;
  duration: number;
  calendar: CalendarMode;
  scheduleBy: ScheduleMode;
  progress: number;
  predecessors: number[];
};

const COST_CATEGORIES = [
  "Transporte",
  "Combustível",
  "Alimentação",
  "Hospedagem",
  "Equipamentos",
  "Materiais",
  "Serviço Tereirizado Indígena",
  "Serviços Terceirizados",
  "Diversos",
] as const;

const CATEGORY_TONES = [
  "#173d2c",
  "#245b40",
  "#327451",
  "#4b8b65",
  "#6aa17b",
  "#8db79a",
  "#abcbb2",
  "#c8ddcd",
  "#dfeae1",
];

type CostCategory = (typeof COST_CATEGORIES)[number];

const WORK_UNITS: WorkUnit[] = ["diária", "hora", "mensal"];

type Resource = {
  id: number;
  name: string;
  type: ResourceType;
  unit: string;
  rate: number;
  category: CostCategory;
  costCenter: string;
  payment: PaymentMethod;
  paymentTiming: PaymentTiming;
  costAggregation: CostAggregation;
};

type Assignment = {
  taskId: number;
  resourceId: number;
  amount: number;
};

type ResourceDraft = Omit<Resource, "id">;

const DAY_WIDTH = 42;
const ROW_HEIGHT = 52;
const WORKDAY_HOURS = 8.8;
const WORKDAYS_PER_MONTH = 22;

const initialTasks: Task[] = [
  {
    id: 1,
    name: "Mobilização e logística",
    start: "2026-09-01",
    end: "2026-09-02",
    duration: 2,
    calendar: "business",
    scheduleBy: "end",
    progress: 100,
    predecessors: [],
  },
  {
    id: 2,
    name: "Alinhamento com a comunidade",
    start: "2026-09-03",
    end: "2026-09-04",
    duration: 2,
    calendar: "business",
    scheduleBy: "end",
    progress: 75,
    predecessors: [1],
  },
  {
    id: 3,
    name: "Coleta de amostras",
    start: "2026-09-05",
    end: "2026-09-11",
    duration: 7,
    calendar: "calendar",
    scheduleBy: "duration",
    progress: 38,
    predecessors: [2],
  },
  {
    id: 4,
    name: "Inventário florestal",
    start: "2026-09-08",
    end: "2026-09-15",
    duration: 6,
    calendar: "business",
    scheduleBy: "end",
    progress: 20,
    predecessors: [2],
  },
  {
    id: 5,
    name: "Consolidação de dados",
    start: "2026-09-16",
    end: "2026-09-18",
    duration: 3,
    calendar: "business",
    scheduleBy: "duration",
    progress: 0,
    predecessors: [3, 4],
  },
  {
    id: 6,
    name: "Desmobilização e entrega",
    start: "2026-09-19",
    end: "2026-09-20",
    duration: 2,
    calendar: "calendar",
    scheduleBy: "end",
    progress: 0,
    predecessors: [5],
  },
];

const initialResources: Resource[] = [
  {
    id: 1,
    name: "Augusto",
    type: "work",
    unit: "hora",
    rate: 46,
    category: "Serviços Terceirizados",
    costCenter: "Projeto ACC Field Survey 2026",
    payment: "Escritório",
    paymentTiming: "Final",
    costAggregation: "resource",
  },
  {
    id: 2,
    name: "Raphael",
    type: "work",
    unit: "hora",
    rate: 38,
    category: "Serviços Terceirizados",
    costCenter: "Projeto ACC Field Survey 2026",
    payment: "Escritório",
    paymentTiming: "Final",
    costAggregation: "resource",
  },
  {
    id: 3,
    name: "Liriann",
    type: "work",
    unit: "hora",
    rate: 42,
    category: "Serviços Terceirizados",
    costCenter: "Projeto ACC Field Survey 2026",
    payment: "Escritório",
    paymentTiming: "Final",
    costAggregation: "resource",
  },
  {
    id: 4,
    name: "Diesel",
    type: "material",
    unit: "litro",
    rate: 8.29,
    category: "Combustível",
    costCenter: "Projeto ACC Field Survey 2026",
    payment: "VExpenses",
    paymentTiming: "Rateado",
    costAggregation: "task",
  },
  {
    id: 5,
    name: "Saco 30 kg",
    type: "material",
    unit: "unidade",
    rate: 3,
    category: "Materiais",
    costCenter: "Projeto ACC Field Survey 2026",
    payment: "VExpenses",
    paymentTiming: "Rateado",
    costAggregation: "task",
  },
  {
    id: 6,
    name: "Trado holandês",
    type: "material",
    unit: "unidade",
    rate: 350,
    category: "Equipamentos",
    costCenter: "Projeto ACC Field Survey 2026",
    payment: "Escritório",
    paymentTiming: "Início",
    costAggregation: "task",
  },
  {
    id: 7,
    name: "Veículo de campo",
    type: "cost",
    unit: "valor",
    rate: 1780,
    category: "Transporte",
    costCenter: "Operações ACC",
    payment: "Faturamento",
    paymentTiming: "30 dias",
    costAggregation: "resource",
  },
  {
    id: 8,
    name: "Hotel Marabá",
    type: "cost",
    unit: "valor",
    rate: 1920,
    category: "Hospedagem",
    costCenter: "Projeto ACC Field Survey 2026",
    payment: "VExpenses",
    paymentTiming: "Final",
    costAggregation: "task",
  },
];

const initialAssignments: Assignment[] = [
  { taskId: 1, resourceId: 1, amount: 100 },
  { taskId: 1, resourceId: 7, amount: 1780 },
  { taskId: 2, resourceId: 3, amount: 75 },
  { taskId: 3, resourceId: 2, amount: 100 },
  { taskId: 3, resourceId: 4, amount: 180 },
  { taskId: 3, resourceId: 5, amount: 60 },
  { taskId: 4, resourceId: 1, amount: 100 },
  { taskId: 4, resourceId: 3, amount: 50 },
  { taskId: 4, resourceId: 6, amount: 2 },
  { taskId: 6, resourceId: 8, amount: 1920 },
];

const emptyResourceDraft: ResourceDraft = {
  name: "",
  type: "work",
  unit: "hora",
  rate: 0,
  category: "Serviços Terceirizados",
  costCenter: "Projeto ACC Field Survey 2026",
  payment: "Escritório",
  paymentTiming: "Final",
  costAggregation: "resource",
};

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addCalendarDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + amount);
  return next;
}

function isBusinessDay(date: Date) {
  const day = date.getUTCDay();
  return day !== 0 && day !== 6;
}

function nextBusinessDay(date: Date) {
  let cursor = new Date(date);
  while (!isBusinessDay(cursor)) cursor = addCalendarDays(cursor, 1);
  return cursor;
}

function calculateEnd(start: string, duration: number, calendar: CalendarMode) {
  let cursor = parseDate(start);
  let remaining = Math.max(1, Math.round(duration));

  if (calendar === "business") cursor = nextBusinessDay(cursor);
  while (remaining > 1) {
    cursor = addCalendarDays(cursor, 1);
    if (calendar === "calendar" || isBusinessDay(cursor)) remaining -= 1;
  }
  return toDateKey(cursor);
}

function calculateDuration(start: string, end: string, calendar: CalendarMode) {
  const first = parseDate(start);
  const last = parseDate(end);
  if (last < first) return 0;

  let duration = 0;
  let cursor = first;
  while (cursor <= last) {
    if (calendar === "calendar" || isBusinessDay(cursor)) duration += 1;
    cursor = addCalendarDays(cursor, 1);
  }
  return duration;
}

function scheduledTaskDays(task: Task) {
  const days: string[] = [];
  let cursor = parseDate(task.start);
  const last = parseDate(task.end);
  while (cursor <= last) {
    if (task.calendar === "calendar" || isBusinessDay(cursor)) {
      days.push(toDateKey(cursor));
    }
    cursor = addCalendarDays(cursor, 1);
  }
  return days;
}

function offsetDate(value: string, amount: number) {
  return toDateKey(addCalendarDays(parseDate(value), amount));
}

function dependencyStart(end: string, calendar: CalendarMode) {
  const followingDay = addCalendarDays(parseDate(end), 1);
  return toDateKey(
    calendar === "business" ? nextBusinessDay(followingDay) : followingDay,
  );
}

function applyPredecessorConstraints(items: Task[]) {
  let scheduled = items.map((task) => ({
    ...task,
    predecessors: task.predecessors ?? [],
  }));

  for (let pass = 0; pass < scheduled.length; pass += 1) {
    let changed = false;
    scheduled = scheduled.map((task) => {
      const predecessorEnds = task.predecessors
        .map((id) => scheduled.find((candidate) => candidate.id === id)?.end)
        .filter((value): value is string => Boolean(value));
      if (!predecessorEnds.length) return task;

      const latestEnd = predecessorEnds.sort().at(-1);
      if (!latestEnd) return task;
      const earliestStart = dependencyStart(latestEnd, task.calendar);
      if (task.start >= earliestStart) return task;

      changed = true;
      return {
        ...task,
        start: earliestStart,
        end: calculateEnd(
          earliestStart,
          Math.max(1, task.duration),
          task.calendar,
        ),
      };
    });
    if (!changed) break;
  }

  return scheduled;
}

function dateDistance(start: string, end: string) {
  return Math.round(
    (parseDate(end).getTime() - parseDate(start).getTime()) / 86_400_000,
  );
}

function formatDate(value: string, month: "short" | "long" = "short") {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month,
    timeZone: "UTC",
  }).format(parseDate(value));
}

function formatWeekday(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    timeZone: "UTC",
  })
    .format(parseDate(value))
    .replace(".", "");
}

function formatFullDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(parseDate(value));
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

function compareSortValues(
  left: string | number,
  right: string | number,
  direction: SortDirection,
) {
  const factor = direction === "asc" ? 1 : -1;
  if (typeof left === "number" && typeof right === "number") {
    return (left - right) * factor;
  }
  return (
    String(left).localeCompare(String(right), "pt-BR", {
      numeric: true,
      sensitivity: "base",
    }) * factor
  );
}

function aggregationLabel(value: CostAggregation) {
  return value === "resource" ? "Consolidado" : "Por tarefa";
}

function SortControl({
  label,
  activeDirection,
  onSort,
}: {
  label: string;
  activeDirection: SortDirection | null;
  onSort: (direction: SortDirection) => void;
}) {
  return (
    <span className="sortable-heading">
      <span>{label}</span>
      <span className="sort-arrows">
        <button
          className={activeDirection === "asc" ? "is-active" : ""}
          type="button"
          onClick={() => onSort("asc")}
          aria-label={`Classificar ${label} em ordem crescente`}
          aria-pressed={activeDirection === "asc"}
          title="Ordem crescente"
        >
          ↑
        </button>
        <button
          className={activeDirection === "desc" ? "is-active" : ""}
          type="button"
          onClick={() => onSort("desc")}
          aria-label={`Classificar ${label} em ordem decrescente`}
          aria-pressed={activeDirection === "desc"}
          title="Ordem decrescente"
        >
          ↓
        </button>
      </span>
    </span>
  );
}

function resourceTypeLabel(type: ResourceType) {
  if (type === "work") return "Trabalho";
  if (type === "material") return "Material";
  return "Custo";
}

function workQuantity(task: Task, resource: Resource, allocation: number) {
  const share = allocation / 100;
  if (resource.unit === "diária") {
    return { value: task.duration * share, label: "diária" };
  }
  if (resource.unit === "mensal") {
    return {
      value: (task.duration / WORKDAYS_PER_MONTH) * share,
      label: "mês",
    };
  }
  return {
    value: task.duration * WORKDAY_HOURS * share,
    label: "h",
  };
}

function assignmentCost(assignment: Assignment, task: Task, resource: Resource) {
  if (resource.type === "work") {
    return workQuantity(task, resource, assignment.amount).value * resource.rate;
  }
  if (resource.type === "material") return assignment.amount * resource.rate;
  return assignment.amount;
}

function assignmentBasis(assignment: Assignment, task: Task, resource: Resource) {
  if (resource.type === "work") {
    const quantity = workQuantity(task, resource, assignment.amount);
    const unit =
      quantity.label === "diária" && quantity.value !== 1
        ? "diárias"
        : quantity.label;
    return `${assignment.amount}% · ${quantity.value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} ${unit}`;
  }
  if (resource.type === "material") {
    return `${assignment.amount.toLocaleString("pt-BR")} ${resource.unit}${assignment.amount === 1 ? "" : "s"}`;
  }
  return "Valor informado";
}

export default function Home() {
  const [activeView, setActiveView] = useState<ViewMode>("schedule");
  const [activityTitle, setActivityTitle] = useState("Incursão Field Survey");
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [assignments, setAssignments] =
    useState<Assignment[]>(initialAssignments);
  const [resourceDraft, setResourceDraft] =
    useState<ResourceDraft>(emptyResourceDraft);
  const [assignmentResourceId, setAssignmentResourceId] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState(3);
  const [saved, setSaved] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [resourceSort, setResourceSort] = useState<{
    key: ResourceSortKey;
    direction: SortDirection;
  } | null>(null);
  const [assignmentSort, setAssignmentSort] = useState<{
    key: AssignmentSortKey;
    direction: SortDirection;
  } | null>(null);
  const [costSort, setCostSort] = useState<{
    key: CostSortKey;
    direction: SortDirection;
  } | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const stored =
          localStorage.getItem("acc-ordo-pm-v4") ??
          localStorage.getItem("acc-ordo-pm-v3") ??
          localStorage.getItem("acc-ordo-pm-v2");
        if (stored) {
          const parsed = JSON.parse(stored) as {
            activityTitle?: string;
            tasks?: Array<
              Omit<Task, "predecessors"> & { predecessors?: number[] }
            >;
            resources?: Array<
              Omit<Resource, "category" | "costAggregation"> & {
                category: string;
                costAggregation?: CostAggregation;
              }
            >;
            assignments?: Assignment[];
          };
          if (parsed.activityTitle) setActivityTitle(parsed.activityTitle);
          if (parsed.tasks?.length) {
            const normalizedTasks = applyPredecessorConstraints(
              parsed.tasks.map((task) => ({
                ...task,
                predecessors:
                  task.predecessors ??
                  initialTasks.find((initial) => initial.id === task.id)
                    ?.predecessors ??
                  [],
              })),
            );
            setTasks(normalizedTasks);
            setSelectedTaskId(parsed.tasks[0].id);
          }
          if (parsed.resources?.length) {
            setResources(
              parsed.resources.map((resource) => ({
                ...resource,
                unit:
                  resource.type === "work" &&
                  !WORK_UNITS.includes(resource.unit as WorkUnit)
                    ? "hora"
                    : resource.unit,
                category:
                  COST_CATEGORIES.find(
                    (category) => category === resource.category,
                  ) ??
                  (resource.type === "work"
                    ? "Serviços Terceirizados"
                    : "Diversos"),
                costAggregation:
                  resource.costAggregation ??
                  (resource.type === "work" ||
                  resource.category === "Transporte"
                    ? "resource"
                    : "task"),
              })),
            );
          }
          if (parsed.assignments) setAssignments(parsed.assignments);
        }
      } catch {
        // A versão inicial permanece disponível se o armazenamento local falhar.
      }
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timeout = window.setTimeout(() => {
      localStorage.setItem(
        "acc-ordo-pm-v4",
        JSON.stringify({ activityTitle, tasks, resources, assignments }),
      );
      setSaved(true);
    }, 450);
    return () => window.clearTimeout(timeout);
  }, [activityTitle, assignments, hydrated, resources, tasks]);

  const selectedTask =
    tasks.find((task) => task.id === selectedTaskId) ?? tasks[0];

  const projectStart = useMemo(
    () => tasks.map((task) => task.start).sort()[0],
    [tasks],
  );
  const projectEnd = useMemo(
    () => tasks.map((task) => task.end).sort().at(-1) ?? projectStart,
    [projectStart, tasks],
  );

  const timelineDays = useMemo(() => {
    const start = parseDate(projectStart);
    const end = parseDate(projectEnd);
    const days: string[] = [];
    let cursor = start;
    while (cursor <= end) {
      days.push(toDateKey(cursor));
      cursor = addCalendarDays(cursor, 1);
    }
    return days;
  }, [projectEnd, projectStart]);

  const completedTasks = tasks.filter((task) => task.progress === 100).length;
  const overallProgress = Math.round(
    tasks.reduce((total, task) => total + task.progress, 0) / tasks.length,
  );
  const plannedHours = tasks.reduce(
    (total, task) => total + task.duration * WORKDAY_HOURS,
    0,
  );

  const selectedAssignments = useMemo(
    () =>
      assignments.filter(
        (assignment) => assignment.taskId === selectedTask.id,
      ),
    [assignments, selectedTask.id],
  );
  const selectedTaskCost = selectedAssignments.reduce((total, assignment) => {
    const resource = resources.find((item) => item.id === assignment.resourceId);
    return resource
      ? total + assignmentCost(assignment, selectedTask, resource)
      : total;
  }, 0);
  const availableResources = resources.filter(
    (resource) =>
      !selectedAssignments.some(
        (assignment) => assignment.resourceId === resource.id,
      ),
  );

  const sortedSelectedAssignments = useMemo(() => {
    if (!assignmentSort) return selectedAssignments;
    return [...selectedAssignments].sort((left, right) => {
      const leftResource = resources.find(
        (resource) => resource.id === left.resourceId,
      );
      const rightResource = resources.find(
        (resource) => resource.id === right.resourceId,
      );
      if (!leftResource || !rightResource) return 0;

      const valueFor = (
        assignment: Assignment,
        resource: Resource,
      ): string | number => {
        switch (assignmentSort.key) {
          case "resource":
            return resource.name;
          case "type":
            return resourceTypeLabel(resource.type);
          case "category":
            return resource.category;
          case "costCenter":
            return resource.costCenter;
          case "amount":
            return assignment.amount;
          case "cost":
            return assignmentCost(assignment, selectedTask, resource);
        }
      };

      return compareSortValues(
        valueFor(left, leftResource),
        valueFor(right, rightResource),
        assignmentSort.direction,
      );
    });
  }, [assignmentSort, resources, selectedAssignments, selectedTask]);

  const costRows = useMemo(
    () =>
      assignments.flatMap((assignment) => {
        const task = tasks.find((item) => item.id === assignment.taskId);
        const resource = resources.find(
          (item) => item.id === assignment.resourceId,
        );
        if (!task || !resource) return [];
        return [
          {
            assignment,
            task,
            resource,
            cost: assignmentCost(assignment, task, resource),
          },
        ];
      }),
    [assignments, resources, tasks],
  );

  const resourceTotals = useMemo(() => {
    const totals = new Map<number, number>();
    costRows.forEach((row) =>
      totals.set(
        row.resource.id,
        (totals.get(row.resource.id) ?? 0) + row.cost,
      ),
    );
    return totals;
  }, [costRows]);

  const sortedResources = useMemo(() => {
    if (!resourceSort) return resources;
    return [...resources].sort((left, right) => {
      const valueFor = (resource: Resource): string | number => {
        switch (resourceSort.key) {
          case "name":
            return resource.name;
          case "type":
            return resourceTypeLabel(resource.type);
          case "unit":
            return resource.unit;
          case "rate":
            return resource.rate;
          case "category":
            return resource.category;
          case "costCenter":
            return resource.costCenter;
          case "payment":
            return resource.payment;
          case "paymentTiming":
            return resource.paymentTiming;
          case "costAggregation":
            return aggregationLabel(resource.costAggregation);
          case "total":
            return resourceTotals.get(resource.id) ?? 0;
        }
      };

      return compareSortValues(
        valueFor(left),
        valueFor(right),
        resourceSort.direction,
      );
    });
  }, [resourceSort, resourceTotals, resources]);

  const sortedCostRows = useMemo(() => {
    if (!costSort) return costRows;
    return [...costRows].sort((left, right) => {
      const valueFor = (row: (typeof costRows)[number]): string | number => {
        switch (costSort.key) {
          case "task":
            return `${row.task.start} ${row.task.name}`;
          case "resource":
            return row.resource.name;
          case "type":
            return resourceTypeLabel(row.resource.type);
          case "category":
            return row.resource.category;
          case "costCenter":
            return row.resource.costCenter;
          case "basis":
            return assignmentBasis(row.assignment, row.task, row.resource);
          case "payment":
            return `${row.resource.payment} ${row.resource.paymentTiming}`;
          case "cost":
            return row.cost;
        }
      };

      return compareSortValues(
        valueFor(left),
        valueFor(right),
        costSort.direction,
      );
    });
  }, [costRows, costSort]);

  const totalCost = costRows.reduce((total, row) => total + row.cost, 0);
  const laborCost = costRows
    .filter((row) => row.resource.type === "work")
    .reduce((total, row) => total + row.cost, 0);
  const materialCost = costRows
    .filter((row) => row.resource.type === "material")
    .reduce((total, row) => total + row.cost, 0);
  const directCost = costRows
    .filter((row) => row.resource.type === "cost")
    .reduce((total, row) => total + row.cost, 0);

  const abcRows = useMemo(() => {
    const totals = new Map<
      number,
      { resource: Resource; value: number; taskIds: Set<number> }
    >();
    costRows.forEach((row) => {
      const current = totals.get(row.resource.id) ?? {
        resource: row.resource,
        value: 0,
        taskIds: new Set<number>(),
      };
      current.value += row.cost;
      current.taskIds.add(row.task.id);
      totals.set(row.resource.id, current);
    });

    const sorted = Array.from(totals.values()).sort(
      (a, b) => b.value - a.value,
    );
    return sorted.map((item, index) => {
        const participation = totalCost ? (item.value / totalCost) * 100 : 0;
        const previousValue = sorted
          .slice(0, index)
          .reduce((sum, previous) => sum + previous.value, 0);
        const previousCumulative = totalCost
          ? (previousValue / totalCost) * 100
          : 0;
        const cumulative = previousCumulative + participation;
        const abcClass: "A" | "B" | "C" =
          previousCumulative < 80
            ? "A"
            : previousCumulative < 95
              ? "B"
              : "C";
        return {
          ...item,
          rank: index + 1,
          participation,
          cumulative: Math.min(100, cumulative),
          abcClass,
        };
      });
  }, [costRows, totalCost]);

  const abcClassSummary = (["A", "B", "C"] as const).map((abcClass) => {
    const rows = abcRows.filter((row) => row.abcClass === abcClass);
    const value = rows.reduce((total, row) => total + row.value, 0);
    return {
      abcClass,
      count: rows.length,
      value,
      participation: totalCost ? (value / totalCost) * 100 : 0,
    };
  });
  const abcMaxValue = Math.max(1, ...abcRows.map((row) => row.value));
  const abcChartStep = abcRows.length ? 850 / abcRows.length : 850;
  const abcCurvePoints = abcRows
    .map((row, index) => {
      const x = 80 + abcChartStep * (index + 0.5);
      const y = 280 - (row.cumulative / 100) * 210;
      return `${x},${y}`;
    })
    .join(" ");

  const costsByCategory = useMemo(() => {
    const totals = new Map<string, number>();
    costRows.forEach((row) =>
      totals.set(
        row.resource.category,
        (totals.get(row.resource.category) ?? 0) + row.cost,
      ),
    );
    return Array.from(totals, ([label, value]) => ({ label, value })).sort(
      (a, b) => b.value - a.value,
    );
  }, [costRows]);

  const costsByCenter = useMemo(() => {
    const totals = new Map<string, number>();
    costRows.forEach((row) =>
      totals.set(
        row.resource.costCenter,
        (totals.get(row.resource.costCenter) ?? 0) + row.cost,
      ),
    );
    return Array.from(totals, ([label, value]) => ({ label, value })).sort(
      (a, b) => b.value - a.value,
    );
  }, [costRows]);

  const disbursementEntries = useMemo(() => {
    const rowsByResource = new Map<number, typeof costRows>();
    costRows
      .filter((row) => row.cost > 0)
      .forEach((row) => {
        const current = rowsByResource.get(row.resource.id) ?? [];
        current.push(row);
        rowsByResource.set(row.resource.id, current);
      });

    return Array.from(rowsByResource.values()).flatMap((resourceRows) => {
      const resource = resourceRows[0].resource;
      const groups =
        resource.costAggregation === "resource"
          ? [resourceRows]
          : resourceRows.map((row) => [row]);

      return groups.flatMap((group) => {
        const tasksInGroup = Array.from(
          new Map(group.map((row) => [row.task.id, row.task])).values(),
        ).sort((left, right) => left.start.localeCompare(right.start));
        const base = {
          resource,
          payment: resource.payment,
          timing: resource.paymentTiming,
          aggregation: resource.costAggregation,
        };

        if (resource.paymentTiming === "Rateado") {
          return group.flatMap((row) => {
            const usageDays = scheduledTaskDays(row.task);
            if (!usageDays.length) return [];
            const installment = row.cost / usageDays.length;
            return usageDays.map((usageDate, index) => ({
              ...base,
              tasks: [row.task],
              allocationCount: 1,
              date: offsetDate(usageDate, -1),
              value:
                index === usageDays.length - 1
                  ? row.cost - installment * (usageDays.length - 1)
                  : installment,
            }));
          });
        }

        const firstStart = tasksInGroup[0].start;
        const lastEnd = [...tasksInGroup]
          .sort((left, right) => right.end.localeCompare(left.end))[0].end;
        const offset =
          resource.paymentTiming === "15 dias"
            ? 15
            : resource.paymentTiming === "30 dias"
              ? 30
              : 0;
        const date =
          resource.paymentTiming === "Início"
            ? offsetDate(firstStart, -1)
            : offsetDate(lastEnd, offset);

        return [
          {
            ...base,
            tasks: tasksInGroup,
            allocationCount: group.length,
            date,
            value: group.reduce((total, row) => total + row.cost, 0),
          },
        ];
      });
    });
  }, [costRows]);

  const disbursementSchedule = useMemo(() => {
    const dates = Array.from(
      new Set(disbursementEntries.map((entry) => entry.date)),
    ).sort();
    return dates.map((date) => {
      const entries = disbursementEntries.filter(
        (entry) => entry.date === date,
      );
      const resourcesById = new Map<
        number,
        {
          resource: Resource;
          value: number;
          taskNames: Set<string>;
          allocationCount: number;
          aggregation: CostAggregation;
        }
      >();
      entries.forEach((entry) => {
        const current = resourcesById.get(entry.resource.id) ?? {
          resource: entry.resource,
          value: 0,
          taskNames: new Set<string>(),
          allocationCount: 0,
          aggregation: entry.aggregation,
        };
        current.value += entry.value;
        current.allocationCount += entry.allocationCount;
        entry.tasks.forEach((task) => current.taskNames.add(task.name));
        resourcesById.set(entry.resource.id, current);
      });
      return {
        date,
        entries,
        value: entries.reduce((total, entry) => total + entry.value, 0),
        methods: Array.from(new Set(entries.map((entry) => entry.payment))),
        timings: Array.from(new Set(entries.map((entry) => entry.timing))),
        resources: Array.from(resourcesById.values())
          .map((item) => ({
            ...item,
            taskNames: Array.from(item.taskNames),
          }))
          .sort((left, right) => right.value - left.value),
      };
    });
  }, [disbursementEntries]);

  const scheduledDisbursementTotal = disbursementSchedule.reduce(
    (total, item) => total + item.value,
    0,
  );
  const peakDisbursement = disbursementSchedule.reduce<
    (typeof disbursementSchedule)[number] | null
  >(
    (peak, item) => (!peak || item.value > peak.value ? item : peak),
    null,
  );
  const firstDisbursement = disbursementSchedule[0] ?? null;
  const teamNames = resources
    .filter((resource) => resource.type === "work")
    .map((resource) => resource.name);

  const categoryDonutStops = costsByCategory.length
    ? costsByCategory
        .map((item, index) => {
          const previousValue = costsByCategory
            .slice(0, index)
            .reduce((total, previous) => total + previous.value, 0);
          const start = totalCost ? (previousValue / totalCost) * 100 : 0;
          const end = totalCost
            ? ((previousValue + item.value) / totalCost) * 100
            : 0;
          return `${CATEGORY_TONES[index % CATEGORY_TONES.length]} ${start}% ${end}%`;
        })
        .join(", ")
    : "#e3ebe5 0% 100%";

  function updateTask(id: number, patch: Partial<Task>) {
    setSaved(false);
    setTasks((current) => {
      const updated = current.map((task) => {
        if (task.id !== id) return task;
        const next = { ...task, ...patch };
        if (!next.start || !next.end) return task;

        if (patch.calendar === "business" && !isBusinessDay(parseDate(next.start))) {
          next.start = toDateKey(nextBusinessDay(parseDate(next.start)));
        }

        if (next.scheduleBy === "duration") {
          next.duration = Math.max(1, Math.round(Number(next.duration) || 1));
          next.end = calculateEnd(next.start, next.duration, next.calendar);
        } else {
          if (next.end < next.start) next.end = next.start;
          next.duration = calculateDuration(next.start, next.end, next.calendar);
        }
        return next;
      });
      return applyPredecessorConstraints(updated);
    });
  }

  function togglePredecessor(predecessorId: number) {
    setSaved(false);
    setTasks((current) => {
      const updated = current.map((task) => {
        if (task.id !== selectedTask.id) return task;
        const predecessors = task.predecessors.includes(predecessorId)
          ? task.predecessors.filter((id) => id !== predecessorId)
          : [...task.predecessors, predecessorId].sort((a, b) => a - b);
        return { ...task, predecessors };
      });
      return applyPredecessorConstraints(updated);
    });
  }

  function addTask() {
    setSaved(false);
    const id = Math.max(0, ...tasks.map((task) => task.id)) + 1;
    const start = toDateKey(
      nextBusinessDay(addCalendarDays(parseDate(projectEnd), 1)),
    );
    const task: Task = {
      id,
      name: "Nova tarefa",
      start,
      end: start,
      duration: 1,
      calendar: "business",
      scheduleBy: "duration",
      progress: 0,
      predecessors: tasks.length ? [tasks[tasks.length - 1].id] : [],
    };
    setTasks((current) => [...current, task]);
    setSelectedTaskId(id);
    setActiveView("schedule");
  }

  function removeSelectedTask() {
    if (tasks.length === 1) return;
    setSaved(false);
    const remaining = tasks
      .filter((task) => task.id !== selectedTask.id)
      .map((task) => ({
        ...task,
        predecessors: task.predecessors.filter(
          (id) => id !== selectedTask.id,
        ),
      }));
    setTasks(remaining);
    setAssignments((current) =>
      current.filter((assignment) => assignment.taskId !== selectedTask.id),
    );
    setSelectedTaskId(remaining[0].id);
  }

  function updateResource(id: number, patch: Partial<Resource>) {
    setSaved(false);
    setResources((current) =>
      current.map((resource) => {
        if (resource.id !== id) return resource;
        const next = { ...resource, ...patch };
        if (patch.type === "work") {
          next.unit = "hora";
          if (resource.type !== "work") next.costAggregation = "resource";
        }
        if (patch.type === "cost") next.unit = "valor";
        if (patch.type === "material" && resource.type !== "material") {
          next.unit = "unidade";
        }
        return next;
      }),
    );
  }

  function addResource() {
    if (!resourceDraft.name.trim()) return;
    const id = Math.max(0, ...resources.map((resource) => resource.id)) + 1;
    setSaved(false);
    setResources((current) => [
      ...current,
      { ...resourceDraft, id, name: resourceDraft.name.trim() },
    ]);
    setResourceDraft(emptyResourceDraft);
  }

  function removeResource(id: number) {
    setSaved(false);
    setResources((current) => current.filter((resource) => resource.id !== id));
    setAssignments((current) =>
      current.filter((assignment) => assignment.resourceId !== id),
    );
  }

  function addAssignment() {
    const selectedId = Number(assignmentResourceId);
    const resource =
      availableResources.find((item) => item.id === selectedId) ??
      availableResources[0];
    if (!resource) return;
    const amount =
      resource.type === "work" ? 100 : resource.type === "material" ? 1 : resource.rate;
    setSaved(false);
    setAssignments((current) => [
      ...current,
      { taskId: selectedTask.id, resourceId: resource.id, amount },
    ]);
    setAssignmentResourceId("");
  }

  function updateAssignment(resourceId: number, amount: number) {
    setSaved(false);
    setAssignments((current) =>
      current.map((assignment) =>
        assignment.taskId === selectedTask.id &&
        assignment.resourceId === resourceId
          ? { ...assignment, amount: Math.max(0, amount || 0) }
          : assignment,
      ),
    );
  }

  function removeAssignment(resourceId: number) {
    setSaved(false);
    setAssignments((current) =>
      current.filter(
        (assignment) =>
          assignment.taskId !== selectedTask.id ||
          assignment.resourceId !== resourceId,
      ),
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            <span />
          </span>
          <span className="brand-name">ACC Ordo</span>
          <span className="brand-separator" />
          <span className="product-name">Project Manager</span>
          <span className="version-pill">v4</span>
        </div>

        <div className="topbar-actions">
          <span className={`save-state ${saved ? "is-saved" : ""}`}>
            <span aria-hidden="true">{saved ? "✓" : "•"}</span>
            {saved ? "Salvo neste dispositivo" : "Salvando…"}
          </span>
          <button className="avatar" type="button" aria-label="Perfil de Augusto">
            AN
          </button>
        </div>
      </header>

      <section className="project-heading">
        <div>
          <p className="eyebrow">PLANO DE CAMPO · SETEMBRO 2026</p>
          <div className="editable-title-wrap">
            <input
              className="editable-title"
              value={activityTitle}
              onChange={(event) => {
                setSaved(false);
                setActivityTitle(event.target.value);
              }}
              aria-label="Título da atividade"
            />
            <span className="edit-indicator" aria-hidden="true">✎</span>
          </div>
        </div>
        <button className="primary-button" type="button" onClick={addTask}>
          <span aria-hidden="true">＋</span>
          Nova tarefa
        </button>
      </section>

      <nav className="section-tabs" aria-label="Seções do projeto">
        <button
          className={`tab ${activeView === "overview" ? "is-active" : ""}`}
          type="button"
          onClick={() => setActiveView("overview")}
        >
          Visão geral
        </button>
        <button
          className={`tab ${activeView === "schedule" ? "is-active" : ""}`}
          type="button"
          onClick={() => setActiveView("schedule")}
        >
          Cronograma
        </button>
        <button
          className={`tab ${activeView === "resources" ? "is-active" : ""}`}
          type="button"
          onClick={() => setActiveView("resources")}
        >
          Recursos
        </button>
        <button
          className={`tab ${activeView === "costs" ? "is-active" : ""}`}
          type="button"
          onClick={() => setActiveView("costs")}
        >
          Custos
        </button>
        <button
          className={`tab ${activeView === "abc" ? "is-active" : ""}`}
          type="button"
          onClick={() => setActiveView("abc")}
        >
          Curva ABC
        </button>
        <button
          className={`tab ${activeView === "help" ? "is-active" : ""}`}
          type="button"
          onClick={() => setActiveView("help")}
        >
          Ajuda
        </button>
        <span className="tab-separator" />
        <span className="tab-context">
          {activeView === "overview" && "Painel do projeto"}
          {activeView === "schedule" && "Visão Gantt"}
          {activeView === "resources" && "Cadastro e taxas"}
          {activeView === "costs" && "Categorias e centros"}
          {activeView === "abc" && "Priorização por impacto"}
          {activeView === "help" && "Guia rápido"}
        </span>
      </nav>

      {activeView === "schedule" && (
        <>
      <section className="summary-grid" aria-label="Resumo do cronograma">
        <article className="metric-card metric-card-wide">
          <p>Período planejado</p>
          <strong>{formatDate(projectStart, "long")} — {formatDate(projectEnd, "long")}</strong>
          <span>{dateDistance(projectStart, projectEnd) + 1} dias corridos no projeto</span>
        </article>
        <article className="metric-card">
          <p>Tarefas</p>
          <strong>{tasks.length}</strong>
          <span>{completedTasks} concluída{completedTasks === 1 ? "" : "s"}</span>
        </article>
        <article className="metric-card">
          <p>Esforço-base</p>
          <strong>{plannedHours.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} h</strong>
          <span>8h48 por dia de trabalho</span>
        </article>
        <article className="metric-card">
          <p>Calendário</p>
          <strong>Seg — Sex</strong>
          <span>08:12–12:00 · 13:00–18:00</span>
        </article>
      </section>

      <section className="workspace-card">
        <div className="workspace-toolbar">
          <div>
            <p className="workspace-kicker">CRONOGRAMA (GANTT)</p>
            <h2>{activityTitle || "Atividade sem título"}</h2>
          </div>
          <div className="toolbar-legend" aria-label="Legenda">
            <span><i className="legend-swatch is-progress" /> Realizado</span>
            <span><i className="legend-swatch" /> Planejado</span>
            <span><i className="weekend-swatch" /> Fim de semana</span>
          </div>
        </div>

        <div className="gantt-scroll" role="region" aria-label="Cronograma de tarefas" tabIndex={0}>
          <div className="gantt-board">
            <div className="task-grid">
              <div className="task-grid-header">
                <span>#</span>
                <span>Tarefa</span>
                <span>Início</span>
                <span>Término</span>
                <span>Duração</span>
                <span>Predec.</span>
              </div>
              {tasks.map((task) => (
                <button
                  className={`task-row ${selectedTask.id === task.id ? "is-selected" : ""}`}
                  key={task.id}
                  type="button"
                  onClick={() => setSelectedTaskId(task.id)}
                >
                  <span className="row-number">{String(task.id).padStart(2, "0")}</span>
                  <span className="task-name-cell">
                    <i className={`calendar-dot ${task.calendar}`} />
                    <span>{task.name}</span>
                  </span>
                  <span>{formatDate(task.start)}</span>
                  <span>{formatDate(task.end)}</span>
                  <span>{task.duration}d</span>
                  <span className="predecessor-cell">
                    {task.predecessors.length
                      ? task.predecessors.join("; ")
                      : "—"}
                  </span>
                </button>
              ))}
            </div>

            <div
              className="timeline"
              style={{ width: timelineDays.length * DAY_WIDTH }}
            >
              <div className="timeline-header">
                {timelineDays.map((day) => {
                  const weekend = !isBusinessDay(parseDate(day));
                  return (
                    <div className={`day-heading ${weekend ? "is-weekend" : ""}`} key={day}>
                      <span>{formatWeekday(day)}</span>
                      <strong>{parseDate(day).getUTCDate()}</strong>
                    </div>
                  );
                })}
              </div>
              <div className="timeline-body" style={{ height: tasks.length * ROW_HEIGHT }}>
                {timelineDays.map((day, index) => (
                  <span
                    className={`day-column ${!isBusinessDay(parseDate(day)) ? "is-weekend" : ""}`}
                    key={day}
                    style={{ left: index * DAY_WIDTH, width: DAY_WIDTH }}
                  />
                ))}
                <svg
                  className="dependency-layer"
                  width={timelineDays.length * DAY_WIDTH}
                  height={tasks.length * ROW_HEIGHT}
                  aria-hidden="true"
                >
                  <defs>
                    <marker
                      id="dependency-arrow"
                      viewBox="0 0 8 8"
                      refX="7"
                      refY="4"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 0 L 8 4 L 0 8 z" />
                    </marker>
                  </defs>
                  {tasks.flatMap((task, taskIndex) =>
                    task.predecessors.map((predecessorId) => {
                      const predecessorIndex = tasks.findIndex(
                        (candidate) => candidate.id === predecessorId,
                      );
                      const predecessor = tasks[predecessorIndex];
                      if (!predecessor || predecessorIndex < 0) return null;
                      const startX =
                        (dateDistance(projectStart, predecessor.end) + 1) *
                          DAY_WIDTH -
                        5;
                      const endX =
                        dateDistance(projectStart, task.start) * DAY_WIDTH + 4;
                      const startY =
                        predecessorIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
                      const endY = taskIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
                      const elbowX = startX + 10;
                      return (
                        <path
                          className={
                            selectedTask.id === task.id ||
                            selectedTask.id === predecessor.id
                              ? "is-active"
                              : ""
                          }
                          key={`${predecessorId}-${task.id}`}
                          d={`M ${startX} ${startY} H ${elbowX} V ${endY} H ${endX}`}
                          markerEnd="url(#dependency-arrow)"
                        />
                      );
                    }),
                  )}
                </svg>
                {tasks.map((task, index) => {
                  const left = dateDistance(projectStart, task.start) * DAY_WIDTH + 5;
                  const width = (dateDistance(task.start, task.end) + 1) * DAY_WIDTH - 10;
                  return (
                    <button
                      className={`gantt-bar ${selectedTask.id === task.id ? "is-selected" : ""}`}
                      key={task.id}
                      type="button"
                      onClick={() => setSelectedTaskId(task.id)}
                      style={{
                        left,
                        top: index * ROW_HEIGHT + 12,
                        width: Math.max(32, width),
                      }}
                      aria-label={`${task.name}, ${task.progress}% concluída`}
                    >
                      <span style={{ width: `${task.progress}%` }} />
                      <em>{task.progress}%</em>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="task-inspector" aria-label="Planejamento da tarefa selecionada">
        <div className="inspector-heading">
          <div>
            <p className="workspace-kicker">PLANEJAMENTO DA TAREFA</p>
            <h2>{selectedTask.name}</h2>
          </div>
          <button
            className="text-button danger"
            type="button"
            onClick={removeSelectedTask}
            disabled={tasks.length === 1}
          >
            Excluir tarefa
          </button>
        </div>

        <div className="inspector-content">
          <div className="task-form">
            <label className="field field-wide">
              <span>Nome da tarefa</span>
              <input
                value={selectedTask.name}
                onChange={(event) => updateTask(selectedTask.id, { name: event.target.value })}
              />
            </label>

            <fieldset className="field field-wide segmented-field">
              <legend>Calcular planejamento por</legend>
              <div className="segmented-control">
                <button
                  className={selectedTask.scheduleBy === "end" ? "is-active" : ""}
                  type="button"
                  onClick={() => updateTask(selectedTask.id, { scheduleBy: "end" })}
                >
                  Data de término
                </button>
                <button
                  className={selectedTask.scheduleBy === "duration" ? "is-active" : ""}
                  type="button"
                  onClick={() => updateTask(selectedTask.id, { scheduleBy: "duration" })}
                >
                  Duração
                </button>
              </div>
            </fieldset>

            <label className="field">
              <span>Início</span>
              <input
                type="date"
                value={selectedTask.start}
                onChange={(event) => updateTask(selectedTask.id, { start: event.target.value })}
              />
            </label>

            {selectedTask.scheduleBy === "end" ? (
              <label className="field">
                <span>Término</span>
                <input
                  type="date"
                  min={selectedTask.start}
                  value={selectedTask.end}
                  onChange={(event) => updateTask(selectedTask.id, { end: event.target.value })}
                />
                <small>Duração calculada: {selectedTask.duration} dia{selectedTask.duration === 1 ? "" : "s"}</small>
              </label>
            ) : (
              <label className="field">
                <span>Duração</span>
                <div className="input-with-suffix">
                  <input
                    type="number"
                    min="1"
                    value={selectedTask.duration}
                    onChange={(event) => updateTask(selectedTask.id, { duration: Number(event.target.value) })}
                  />
                  <span>dias</span>
                </div>
                <small>Término calculado: {formatDate(selectedTask.end, "long")}</small>
              </label>
            )}

            <label className="field">
              <span>Contagem</span>
              <select
                value={selectedTask.calendar}
                onChange={(event) =>
                  updateTask(selectedTask.id, { calendar: event.target.value as CalendarMode })
                }
              >
                <option value="business">Dias úteis</option>
                <option value="calendar">Dias corridos</option>
              </select>
              <small>{selectedTask.calendar === "business" ? "Ignora sábados e domingos" : "Inclui sábados e domingos"}</small>
            </label>

            <label className="field">
              <span>Progresso</span>
              <div className="progress-input">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={selectedTask.progress}
                  onChange={(event) => updateTask(selectedTask.id, { progress: Number(event.target.value) })}
                />
                <strong>{selectedTask.progress}%</strong>
              </div>
            </label>

            <fieldset className="field field-full predecessor-field">
              <legend>Predecessoras · relação Término–Início</legend>
              <div className="predecessor-picker">
                {tasks.filter((task) => task.id < selectedTask.id).length ? (
                  tasks
                    .filter((task) => task.id < selectedTask.id)
                    .map((task) => (
                      <label key={task.id}>
                        <input
                          type="checkbox"
                          checked={selectedTask.predecessors.includes(task.id)}
                          onChange={() => togglePredecessor(task.id)}
                        />
                        <span>{task.id}</span>
                        <strong>{task.name}</strong>
                      </label>
                    ))
                ) : (
                  <span className="no-predecessors">
                    Esta é a primeira tarefa do cronograma.
                  </span>
                )}
              </div>
              <small>
                Ao vincular uma predecessora, a tarefa não poderá iniciar antes
                do término dela.
              </small>
            </fieldset>
          </div>

          <aside className="calendar-card">
            <span className="calendar-icon" aria-hidden="true">08:12</span>
            <div>
              <p>Calendário de trabalho ACC</p>
              <strong>8 horas e 48 minutos por dia</strong>
              <span>Segunda a sexta · 08:12–12:00 e 13:00–18:00</span>
            </div>
          </aside>
        </div>

        <div className="assignment-section">
          <div className="assignment-heading">
            <div>
              <p className="workspace-kicker">RECURSOS ALOCADOS</p>
              <h3>Custo calculado na tarefa: {formatMoney(selectedTaskCost)}</h3>
            </div>
            <div className="assignment-adder">
              <select
                aria-label="Recurso para alocar"
                value={assignmentResourceId}
                onChange={(event) => setAssignmentResourceId(event.target.value)}
                disabled={availableResources.length === 0}
              >
                <option value="">
                  {availableResources.length ? "Selecionar recurso" : "Todos os recursos alocados"}
                </option>
                {availableResources.map((resource) => (
                  <option key={resource.id} value={resource.id}>
                    {resource.name} · {resourceTypeLabel(resource.type)}
                  </option>
                ))}
              </select>
              <button
                className="secondary-button"
                type="button"
                onClick={addAssignment}
                disabled={availableResources.length === 0}
              >
                Alocar
              </button>
            </div>
          </div>

          {selectedAssignments.length ? (
            <div className="assignment-list">
              <div className="assignment-list-header">
                <SortControl label="Recurso" activeDirection={assignmentSort?.key === "resource" ? assignmentSort.direction : null} onSort={(direction) => setAssignmentSort({ key: "resource", direction })} />
                <SortControl label="Tipo" activeDirection={assignmentSort?.key === "type" ? assignmentSort.direction : null} onSort={(direction) => setAssignmentSort({ key: "type", direction })} />
                <SortControl label="Categoria" activeDirection={assignmentSort?.key === "category" ? assignmentSort.direction : null} onSort={(direction) => setAssignmentSort({ key: "category", direction })} />
                <SortControl label="Centro de custo" activeDirection={assignmentSort?.key === "costCenter" ? assignmentSort.direction : null} onSort={(direction) => setAssignmentSort({ key: "costCenter", direction })} />
                <SortControl label="Alocação" activeDirection={assignmentSort?.key === "amount" ? assignmentSort.direction : null} onSort={(direction) => setAssignmentSort({ key: "amount", direction })} />
                <SortControl label="Custo" activeDirection={assignmentSort?.key === "cost" ? assignmentSort.direction : null} onSort={(direction) => setAssignmentSort({ key: "cost", direction })} />
                <span className="sr-only">Ações</span>
              </div>
              {sortedSelectedAssignments.map((assignment) => {
                const resource = resources.find(
                  (item) => item.id === assignment.resourceId,
                );
                if (!resource) return null;
                return (
                  <article className="assignment-row" key={resource.id}>
                    <div className="assignment-resource">
                      <span className={`resource-type-mark ${resource.type}`}>
                        {resource.type === "work" ? "T" : resource.type === "material" ? "M" : "C"}
                      </span>
                      <div>
                        <strong>{resource.name}</strong>
                        <span>{aggregationLabel(resource.costAggregation)}</span>
                      </div>
                    </div>
                    <span className={`type-pill assignment-type ${resource.type}`}>
                      {resourceTypeLabel(resource.type)}
                    </span>
                    <span className="assignment-category">{resource.category}</span>
                    <span className="assignment-center" title={resource.costCenter}>{resource.costCenter}</span>
                    <label className="compact-field">
                      <span>
                        {resource.type === "work"
                          ? "Alocação"
                          : resource.type === "material"
                            ? `Quantidade (${resource.unit})`
                            : "Valor da despesa"}
                      </span>
                      <div>
                        <input
                          type="number"
                          min="0"
                          max={resource.type === "work" ? 100 : undefined}
                          step={resource.type === "work" ? 5 : resource.type === "material" ? 1 : 10}
                          value={assignment.amount}
                          onChange={(event) =>
                            updateAssignment(resource.id, Number(event.target.value))
                          }
                        />
                        {resource.type === "work" && <span>%</span>}
                      </div>
                    </label>
                    <div className="assignment-cost">
                      <span>{assignmentBasis(assignment, selectedTask, resource)}</span>
                      <strong>{formatMoney(assignmentCost(assignment, selectedTask, resource))}</strong>
                    </div>
                    <button
                      className="icon-button danger"
                      type="button"
                      onClick={() => removeAssignment(resource.id)}
                      aria-label={`Remover ${resource.name} da tarefa`}
                    >
                      ×
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="empty-message">Nenhum recurso alocado nesta tarefa.</p>
          )}
        </div>
      </section>
        </>
      )}

      {activeView === "overview" && (
        <section className="view-container dashboard-view">
          <article className="dashboard-hero">
            <div className="dashboard-hero-copy">
              <p className="workspace-kicker light">PAINEL DO PROJETO</p>
              <h2>{activityTitle || "Atividade sem título"}</h2>
              <div className="dashboard-project-context">
                <p>
                  <strong>Integrantes:</strong>{" "}
                  {teamNames.length ? teamNames.join(", ") : "Equipe não definida"}
                </p>
                <p>
                  <strong>Período de atividade:</strong>{" "}
                  {formatFullDate(projectStart)} até {formatFullDate(projectEnd)}
                </p>
                <span>{tasks.length} tarefas · {resources.length} recursos cadastrados</span>
              </div>
              <button type="button" onClick={() => setActiveView("schedule")}>
                Abrir cronograma <span aria-hidden="true">→</span>
              </button>
            </div>
            <div className="progress-orbit" aria-label={`${overallProgress}% de progresso médio`}>
              <div
                className="progress-orbit-ring"
                style={{
                  background: `conic-gradient(#bcd4c4 ${overallProgress * 3.6}deg, rgba(255,255,255,.13) 0deg)`,
                }}
              >
                <div>
                  <strong>{overallProgress}%</strong>
                  <span>progresso</span>
                </div>
              </div>
            </div>
            <div className="hero-stat-list">
              <div><span>Custo planejado</span><strong>{formatMoney(totalCost)}</strong></div>
              <div><span>Horas-base</span><strong>{plannedHours.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} h</strong></div>
              <div><span>Concluídas</span><strong>{completedTasks}/{tasks.length}</strong></div>
            </div>
          </article>

          <div className="dashboard-grid">
            <article className="panel-card task-health-panel">
              <div className="panel-heading">
                <div>
                  <p className="workspace-kicker">ANDAMENTO</p>
                  <h3>Saúde do cronograma</h3>
                </div>
                <span>{dateDistance(projectStart, projectEnd) + 1} dias corridos</span>
              </div>
              <div className="task-health-list">
                {tasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => {
                      setSelectedTaskId(task.id);
                      setActiveView("schedule");
                    }}
                  >
                    <span className="task-health-number">{String(task.id).padStart(2, "0")}</span>
                    <span className="task-health-name">
                      <strong>{task.name}</strong>
                      <small>{formatDate(task.start)} — {formatDate(task.end)}</small>
                    </span>
                    <span className="mini-progress"><i style={{ width: `${task.progress}%` }} /></span>
                    <em>{task.progress}%</em>
                  </button>
                ))}
              </div>
            </article>

            <article className="panel-card">
              <div className="panel-heading">
                <div>
                  <p className="workspace-kicker">CUSTOS</p>
                  <h3>Por categoria</h3>
                </div>
                <button type="button" onClick={() => setActiveView("costs")}>Detalhar</button>
              </div>
              <div className="bar-list">
                {costsByCategory.slice(0, 6).map((item) => (
                  <div className="bar-list-row" key={item.label}>
                    <div><span>{item.label}</span><strong>{formatMoney(item.value)}</strong></div>
                    <i><span style={{ width: `${totalCost ? (item.value / totalCost) * 100 : 0}%` }} /></i>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel-card">
              <div className="panel-heading">
                <div>
                  <p className="workspace-kicker">EQUIPE</p>
                  <h3>Recursos de trabalho</h3>
                </div>
                <button type="button" onClick={() => setActiveView("resources")}>Gerenciar</button>
              </div>
              <div className="people-list">
                {resources.filter((resource) => resource.type === "work").map((resource) => {
                  const resourceAssignments = costRows.filter(
                    (row) => row.resource.id === resource.id,
                  );
                  const quantity = resourceAssignments.reduce(
                    (total, row) =>
                      total +
                      workQuantity(
                        row.task,
                        resource,
                        row.assignment.amount,
                      ).value,
                    0,
                  );
                  const quantityLabel =
                    resource.unit === "diária"
                      ? quantity === 1
                        ? "diária"
                        : "diárias"
                      : resource.unit === "mensal"
                        ? "mês"
                        : "h";
                  return (
                    <div key={resource.id}>
                      <span className="person-monogram">{resource.name.slice(0, 2).toUpperCase()}</span>
                      <span><strong>{resource.name}</strong><small>{resource.category}</small></span>
                      <em>{quantity.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} {quantityLabel}</em>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="panel-card definition-panel">
              <p className="workspace-kicker">ESTRUTURA FINANCEIRA</p>
              <h3>Categoria ≠ centro de custo</h3>
              <p>
                A <strong>categoria</strong> explica a natureza da despesa. O <strong>centro de custo</strong> identifica o projeto, contrato ou unidade de onde sairá o recurso.
              </p>
              <button type="button" onClick={() => setActiveView("help")}>Ver conceitos</button>
            </article>
          </div>

          <section className="overview-financial-section" aria-label="Resumo financeiro e cronograma de desembolso">
            <div className="overview-financial-heading">
              <div>
                <p className="workspace-kicker">CRONOGRAMA DE DESEMBOLSO</p>
                <h2>Orçamento, composição e fluxo financeiro</h2>
                <p>Datas recalculadas automaticamente conforme as tarefas e as regras de desembolso dos recursos.</p>
              </div>
              <div className="disbursement-rules" aria-label="Regras de desembolso">
                <span><b>Início</b> véspera da tarefa</span>
                <span><b>Final</b> término da tarefa</span>
                <span><b>Rateado</b> véspera de cada uso</span>
                <span><b>15/30 dias</b> após o término</span>
                <span><b>Consolidado</b> soma todas as tarefas do recurso</span>
              </div>
            </div>

            <div className="disbursement-metrics">
              <article>
                <span>Orçamento total</span>
                <strong>{formatMoney(totalCost)}</strong>
                <small>{costsByCategory.length} categorias com valor</small>
              </article>
              <article>
                <span>Total programado</span>
                <strong>{formatMoney(scheduledDisbursementTotal)}</strong>
                <small>{disbursementSchedule.length} datas de desembolso</small>
              </article>
              <article>
                <span>Primeiro desembolso</span>
                <strong>{firstDisbursement ? formatFullDate(firstDisbursement.date) : "—"}</strong>
                <small>{firstDisbursement ? formatMoney(firstDisbursement.value) : "Sem programação"}</small>
              </article>
              <article>
                <span>Pico diário</span>
                <strong>{peakDisbursement ? formatMoney(peakDisbursement.value) : "—"}</strong>
                <small>{peakDisbursement ? formatFullDate(peakDisbursement.date) : "Sem programação"}</small>
              </article>
            </div>

            <div className="finance-sheet-grid">
              <div className="finance-table-stack">
                <article className="financial-sheet-card category-sheet-card">
                  <div className="financial-card-heading">
                    <div><p className="workspace-kicker">ORÇADO</p><h3>Custos por categoria</h3></div>
                    <span>{formatMoney(totalCost)}</span>
                  </div>
                  <div className="compact-finance-table-wrap">
                    <table className="compact-finance-table">
                      <thead><tr><th>Categoria</th><th>Participação</th><th>Orçado</th></tr></thead>
                      <tbody>
                        {costsByCategory.map((item) => (
                          <tr key={item.label}>
                            <td>{item.label}</td>
                            <td>{totalCost ? ((item.value / totalCost) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : 0}%</td>
                            <td>{formatMoney(item.value)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot><tr><th>Total geral</th><th>100%</th><th>{formatMoney(totalCost)}</th></tr></tfoot>
                    </table>
                  </div>
                </article>

                <article className="financial-sheet-card disbursement-sheet-card">
                  <div className="financial-card-heading">
                    <div><p className="workspace-kicker">FLUXO PREVISTO</p><h3>Datas de desembolso</h3></div>
                    <span>{disbursementSchedule.length} datas</span>
                  </div>
                  <div className="compact-finance-table-wrap schedule-scroll">
                    <table className="compact-finance-table disbursement-table">
                      <thead><tr><th>Data</th><th>Recursos e somatórios</th><th>Regra</th><th>Pagamento</th><th>Valor</th></tr></thead>
                      <tbody>
                        {disbursementSchedule.map((item) => (
                          <tr key={item.date}>
                            <td><strong>{formatFullDate(item.date)}</strong></td>
                            <td>
                              <div className="disbursement-resource-list">
                                {item.resources.map((resourceItem) => (
                                  <span key={resourceItem.resource.id}>
                                    <span>
                                      <strong>{resourceItem.resource.name}</strong>
                                      <small>
                                        {resourceItem.aggregation === "resource"
                                          ? `${resourceItem.taskNames.length} tarefa${resourceItem.taskNames.length === 1 ? "" : "s"} · consolidado`
                                          : resourceItem.taskNames.join(", ")}
                                      </small>
                                    </span>
                                    <em>{formatMoney(resourceItem.value)}</em>
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td>{item.timings.join(" · ")}</td>
                            <td>{item.methods.join(" · ")}</td>
                            <td><strong>{formatMoney(item.value)}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot><tr><th colSpan={4}>Total programado</th><th>{formatMoney(scheduledDisbursementTotal)}</th></tr></tfoot>
                    </table>
                  </div>
                </article>
              </div>

              <article className="financial-sheet-card composition-card">
                <div className="financial-card-heading">
                  <div><p className="workspace-kicker">COMPOSIÇÃO</p><h3>Participação no orçamento</h3></div>
                  <button type="button" onClick={() => setActiveView("abc")}>Ver Curva ABC</button>
                </div>
                <div className="donut-composition">
                  <div
                    className="cost-donut"
                    style={{ background: `conic-gradient(${categoryDonutStops})` }}
                    role="img"
                    aria-label="Distribuição percentual do orçamento por categoria"
                  >
                    <div><span>Total orçado</span><strong>{formatMoney(totalCost)}</strong><small>{costsByCategory.length} categorias</small></div>
                  </div>
                  <div className="donut-legend">
                    {costsByCategory.map((item, index) => (
                      <div key={item.label}>
                        <i style={{ background: CATEGORY_TONES[index % CATEGORY_TONES.length] }} />
                        <span><strong>{item.label}</strong><small>{formatMoney(item.value)}</small></span>
                        <em>{totalCost ? ((item.value / totalCost) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : 0}%</em>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="composition-insight">
                  <span>Maior categoria</span>
                  <strong>{costsByCategory[0]?.label ?? "—"}</strong>
                  <em>{costsByCategory[0] ? formatMoney(costsByCategory[0].value) : "Sem custos"}</em>
                </div>
              </article>
            </div>
          </section>
        </section>
      )}

      {activeView === "resources" && (
        <section className="view-container resources-view">
          <div className="view-intro">
            <div>
              <p className="workspace-kicker">BIBLIOTECA DE RECURSOS</p>
              <h2>Cadastre uma vez, aloque dentro das tarefas</h2>
              <p>A classificação segue a lógica do Project e acrescenta “Custo” para despesas que não são mão de obra nem material consumível.</p>
            </div>
            <span>{resources.length} recursos ativos</span>
          </div>

          <div className="resource-type-grid">
            <article><span className="resource-type-mark work">T</span><div><strong>Trabalho</strong><p>Pessoas calculadas por hora, diária ou mensalidade, sempre considerando a alocação.</p></div></article>
            <article><span className="resource-type-mark material">M</span><div><strong>Material</strong><p>Item quantificável: quantidade alocada × preço por unidade.</p></div></article>
            <article><span className="resource-type-mark cost">C</span><div><strong>Custo</strong><p>Despesa direta cujo valor é informado na tarefa, como hotel ou fornecedor.</p></div></article>
          </div>

          <div className="aggregation-note">
            <span aria-hidden="true">Σ</span>
            <div>
              <strong>Consolidação por recurso</strong>
              <p>Use em veículos alugados e mão de obra contínua. O sistema soma todas as alocações do recurso e aplica a regra de desembolso uma única vez entre a primeira e a última tarefa.</p>
            </div>
          </div>

          <article className="workspace-card resource-workspace">
            <div className="workspace-toolbar">
              <div><p className="workspace-kicker">CADASTRO</p><h2>Planilha de recursos</h2></div>
              <span className="table-hint">Campos editáveis · alterações salvas automaticamente</span>
            </div>
            <div className="resource-table-scroll">
              <table className="resource-table">
                <thead>
                  <tr>
                    <th><SortControl label="Recurso" activeDirection={resourceSort?.key === "name" ? resourceSort.direction : null} onSort={(direction) => setResourceSort({ key: "name", direction })} /></th>
                    <th><SortControl label="Tipo" activeDirection={resourceSort?.key === "type" ? resourceSort.direction : null} onSort={(direction) => setResourceSort({ key: "type", direction })} /></th>
                    <th><SortControl label="Unidade" activeDirection={resourceSort?.key === "unit" ? resourceSort.direction : null} onSort={(direction) => setResourceSort({ key: "unit", direction })} /></th>
                    <th><SortControl label="Consolidação" activeDirection={resourceSort?.key === "costAggregation" ? resourceSort.direction : null} onSort={(direction) => setResourceSort({ key: "costAggregation", direction })} /></th>
                    <th><SortControl label="Taxa / valor-base" activeDirection={resourceSort?.key === "rate" ? resourceSort.direction : null} onSort={(direction) => setResourceSort({ key: "rate", direction })} /></th>
                    <th><SortControl label="Categoria de custo" activeDirection={resourceSort?.key === "category" ? resourceSort.direction : null} onSort={(direction) => setResourceSort({ key: "category", direction })} /></th>
                    <th><SortControl label="Centro de custo" activeDirection={resourceSort?.key === "costCenter" ? resourceSort.direction : null} onSort={(direction) => setResourceSort({ key: "costCenter", direction })} /></th>
                    <th><SortControl label="Pagamento" activeDirection={resourceSort?.key === "payment" ? resourceSort.direction : null} onSort={(direction) => setResourceSort({ key: "payment", direction })} /></th>
                    <th><SortControl label="Desembolso" activeDirection={resourceSort?.key === "paymentTiming" ? resourceSort.direction : null} onSort={(direction) => setResourceSort({ key: "paymentTiming", direction })} /></th>
                    <th><SortControl label="Total previsto" activeDirection={resourceSort?.key === "total" ? resourceSort.direction : null} onSort={(direction) => setResourceSort({ key: "total", direction })} /></th>
                    <th><span className="sr-only">Ações</span></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedResources.map((resource) => (
                    <tr key={resource.id}>
                      <td><input aria-label={`Nome do recurso ${resource.id}`} value={resource.name} onChange={(event) => updateResource(resource.id, { name: event.target.value })} /></td>
                      <td>
                        <select aria-label={`Tipo de ${resource.name}`} value={resource.type} onChange={(event) => updateResource(resource.id, { type: event.target.value as ResourceType })}>
                          <option value="work">Trabalho</option>
                          <option value="material">Material</option>
                          <option value="cost">Custo</option>
                        </select>
                      </td>
                      <td>
                        {resource.type === "work" ? (
                          <select aria-label={`Unidade de ${resource.name}`} value={resource.unit} onChange={(event) => updateResource(resource.id, { unit: event.target.value as WorkUnit })}>
                            {WORK_UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                          </select>
                        ) : (
                          <input aria-label={`Unidade de ${resource.name}`} value={resource.unit} disabled={resource.type === "cost"} onChange={(event) => updateResource(resource.id, { unit: event.target.value })} />
                        )}
                      </td>
                      <td>
                        <select aria-label={`Consolidação de ${resource.name}`} value={resource.costAggregation} onChange={(event) => updateResource(resource.id, { costAggregation: event.target.value as CostAggregation })}>
                          <option value="resource">Consolidar recurso</option>
                          <option value="task">Por tarefa</option>
                        </select>
                      </td>
                      <td><div className="money-input"><span>R$</span><input aria-label={`Taxa de ${resource.name}`} type="number" min="0" step="0.01" value={resource.rate} onChange={(event) => updateResource(resource.id, { rate: Number(event.target.value) })} /></div></td>
                      <td>
                        <select aria-label={`Categoria de ${resource.name}`} value={resource.category} onChange={(event) => updateResource(resource.id, { category: event.target.value as CostCategory })}>
                          {COST_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                        </select>
                      </td>
                      <td><input aria-label={`Centro de custo de ${resource.name}`} value={resource.costCenter} onChange={(event) => updateResource(resource.id, { costCenter: event.target.value })} /></td>
                      <td>
                        <select aria-label={`Pagamento de ${resource.name}`} value={resource.payment} onChange={(event) => updateResource(resource.id, { payment: event.target.value as PaymentMethod })}>
                          <option>Escritório</option><option>VExpenses</option><option>Faturamento</option><option>Cartão corporativo</option><option>Outro</option>
                        </select>
                      </td>
                      <td>
                        <select aria-label={`Prazo de ${resource.name}`} value={resource.paymentTiming} onChange={(event) => updateResource(resource.id, { paymentTiming: event.target.value as PaymentTiming })}>
                          <option>Início</option><option>Final</option><option>Rateado</option><option>15 dias</option><option>30 dias</option>
                        </select>
                      </td>
                      <td><strong className="resource-total">{formatMoney(resourceTotals.get(resource.id) ?? 0)}</strong></td>
                      <td><button className="icon-button danger" type="button" onClick={() => removeResource(resource.id)} aria-label={`Excluir ${resource.name}`}>×</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="resource-creator">
              <div><p className="workspace-kicker">NOVO RECURSO</p><h3>Adicionar à biblioteca</h3></div>
              <label><span>Nome</span><input placeholder="Ex.: Engenheira florestal" value={resourceDraft.name} onChange={(event) => setResourceDraft((draft) => ({ ...draft, name: event.target.value }))} /></label>
              <label><span>Tipo</span><select value={resourceDraft.type} onChange={(event) => {
                const type = event.target.value as ResourceType;
                setResourceDraft((draft) => ({ ...draft, type, unit: type === "work" ? "hora" : type === "cost" ? "valor" : "unidade", costAggregation: type === "work" ? "resource" : "task" }));
              }}><option value="work">Trabalho</option><option value="material">Material</option><option value="cost">Custo</option></select></label>
              <label><span>Unidade</span>{resourceDraft.type === "work" ? <select value={resourceDraft.unit} onChange={(event) => setResourceDraft((draft) => ({ ...draft, unit: event.target.value as WorkUnit }))}>{WORK_UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}</select> : <input value={resourceDraft.unit} disabled={resourceDraft.type === "cost"} onChange={(event) => setResourceDraft((draft) => ({ ...draft, unit: event.target.value }))} />}</label>
              <label><span>Consolidação</span><select value={resourceDraft.costAggregation} onChange={(event) => setResourceDraft((draft) => ({ ...draft, costAggregation: event.target.value as CostAggregation }))}><option value="resource">Consolidar recurso</option><option value="task">Por tarefa</option></select></label>
              <label><span>Taxa / valor-base</span><input type="number" min="0" step="0.01" value={resourceDraft.rate} onChange={(event) => setResourceDraft((draft) => ({ ...draft, rate: Number(event.target.value) }))} /></label>
              <label><span>Categoria</span><select value={resourceDraft.category} onChange={(event) => setResourceDraft((draft) => ({ ...draft, category: event.target.value as CostCategory }))}>{COST_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
              <label><span>Centro de custo</span><input value={resourceDraft.costCenter} onChange={(event) => setResourceDraft((draft) => ({ ...draft, costCenter: event.target.value }))} /></label>
              <button className="primary-button" type="button" onClick={addResource} disabled={!resourceDraft.name.trim()}>Adicionar recurso</button>
            </div>
          </article>
        </section>
      )}

      {activeView === "costs" && (
        <section className="view-container costs-view">
          <div className="view-intro">
            <div>
              <p className="workspace-kicker">PLANO DE CUSTOS</p>
              <h2>De onde vem — e para onde vai — cada valor</h2>
              <p>Categoria organiza a natureza da despesa; centro de custo identifica a origem orçamentária.</p>
            </div>
            <span>{costRows.length} alocações calculadas</span>
          </div>

          <div className="cost-metric-grid">
            <article><span>Custo total</span><strong>{formatMoney(totalCost)}</strong><small>todas as alocações</small></article>
            <article><span>Trabalho</span><strong>{formatMoney(laborCost)}</strong><small>{totalCost ? Math.round((laborCost / totalCost) * 100) : 0}% do total</small></article>
            <article><span>Materiais</span><strong>{formatMoney(materialCost)}</strong><small>{totalCost ? Math.round((materialCost / totalCost) * 100) : 0}% do total</small></article>
            <article><span>Custos diretos</span><strong>{formatMoney(directCost)}</strong><small>{totalCost ? Math.round((directCost / totalCost) * 100) : 0}% do total</small></article>
          </div>

          <div className="finance-grid">
            <article className="panel-card">
              <div className="panel-heading"><div><p className="workspace-kicker">DESTINO</p><h3>Categoria de custo</h3></div><span>O que foi comprado</span></div>
              <div className="bar-list large">
                {costsByCategory.map((item, index) => (
                  <div className="bar-list-row" key={item.label}>
                    <div><span><b>{String(index + 1).padStart(2, "0")}</b>{item.label}</span><strong>{formatMoney(item.value)}</strong></div>
                    <i><span style={{ width: `${totalCost ? (item.value / totalCost) * 100 : 0}%` }} /></i>
                  </div>
                ))}
              </div>
            </article>
            <article className="panel-card">
              <div className="panel-heading"><div><p className="workspace-kicker">ORIGEM</p><h3>Centro de custo</h3></div><span>Quem financia</span></div>
              <div className="center-list">
                {costsByCenter.map((item) => (
                  <div key={item.label}><span className="center-icon">CC</span><span><strong>{item.label}</strong><small>{totalCost ? Math.round((item.value / totalCost) * 100) : 0}% do orçamento</small></span><em>{formatMoney(item.value)}</em></div>
                ))}
              </div>
            </article>
          </div>

          <article className="workspace-card cost-detail-card">
            <div className="workspace-toolbar"><div><p className="workspace-kicker">MEMÓRIA DE CÁLCULO</p><h2>Alocações por tarefa</h2></div><span className="table-hint">Atualizado a partir do cronograma</span></div>
            <div className="cost-table-scroll">
              <table className="cost-table">
                <thead><tr>
                  <th><SortControl label="Tarefa" activeDirection={costSort?.key === "task" ? costSort.direction : null} onSort={(direction) => setCostSort({ key: "task", direction })} /></th>
                  <th><SortControl label="Recurso" activeDirection={costSort?.key === "resource" ? costSort.direction : null} onSort={(direction) => setCostSort({ key: "resource", direction })} /></th>
                  <th><SortControl label="Tipo" activeDirection={costSort?.key === "type" ? costSort.direction : null} onSort={(direction) => setCostSort({ key: "type", direction })} /></th>
                  <th><SortControl label="Categoria" activeDirection={costSort?.key === "category" ? costSort.direction : null} onSort={(direction) => setCostSort({ key: "category", direction })} /></th>
                  <th><SortControl label="Centro de custo" activeDirection={costSort?.key === "costCenter" ? costSort.direction : null} onSort={(direction) => setCostSort({ key: "costCenter", direction })} /></th>
                  <th><SortControl label="Base de cálculo" activeDirection={costSort?.key === "basis" ? costSort.direction : null} onSort={(direction) => setCostSort({ key: "basis", direction })} /></th>
                  <th><SortControl label="Pagamento" activeDirection={costSort?.key === "payment" ? costSort.direction : null} onSort={(direction) => setCostSort({ key: "payment", direction })} /></th>
                  <th><SortControl label="Total" activeDirection={costSort?.key === "cost" ? costSort.direction : null} onSort={(direction) => setCostSort({ key: "cost", direction })} /></th>
                </tr></thead>
                <tbody>
                  {sortedCostRows.map((row) => (
                    <tr key={`${row.task.id}-${row.resource.id}`}>
                      <td><strong>{row.task.name}</strong><span>{formatDate(row.task.start)} — {formatDate(row.task.end)}</span></td>
                      <td>{row.resource.name}</td>
                      <td><span className={`type-pill ${row.resource.type}`}>{resourceTypeLabel(row.resource.type)}</span></td>
                      <td>{row.resource.category}</td>
                      <td>{row.resource.costCenter}</td>
                      <td>{assignmentBasis(row.assignment, row.task, row.resource)}</td>
                      <td>{row.resource.payment}<span>{row.resource.paymentTiming}</span></td>
                      <td><strong>{formatMoney(row.cost)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      )}

      {activeView === "abc" && (
        <section className="view-container abc-view">
          <div className="view-intro">
            <div>
              <p className="workspace-kicker">CURVA ABC</p>
              <h2>Priorize os recursos de maior impacto financeiro</h2>
              <p>
                Os recursos são ordenados pelo custo acumulado. A classe A
                concentra aproximadamente 80% do valor, B leva o acumulado até
                95% e C reúne o saldo restante.
              </p>
            </div>
            <span>{abcRows.length} recursos classificados</span>
          </div>

          <div className="abc-summary-grid">
            {abcClassSummary.map((item) => (
              <article
                className={`abc-summary-card class-${item.abcClass.toLowerCase()}`}
                key={item.abcClass}
              >
                <span className="abc-class-badge">{item.abcClass}</span>
                <div>
                  <p>
                    {item.abcClass === "A"
                      ? "Alta prioridade"
                      : item.abcClass === "B"
                        ? "Atenção intermediária"
                        : "Baixo impacto individual"}
                  </p>
                  <strong>{formatMoney(item.value)}</strong>
                  <small>
                    {item.count} recurso{item.count === 1 ? "" : "s"} ·{" "}
                    {item.participation.toLocaleString("pt-BR", {
                      maximumFractionDigits: 1,
                    })}
                    % do custo
                  </small>
                </div>
              </article>
            ))}
          </div>

          <article className="panel-card abc-chart-card">
            <div className="panel-heading">
              <div>
                <p className="workspace-kicker">PARETO DE CUSTOS</p>
                <h3>Participação por recurso e percentual acumulado</h3>
              </div>
              <div className="abc-legend" aria-label="Legenda da curva ABC">
                <span><i className="abc-bar-legend" /> Custo</span>
                <span><i className="abc-line-legend" /> Acumulado</span>
              </div>
            </div>

            {abcRows.length ? (
              <div className="abc-chart-scroll">
                <div className="abc-chart-canvas">
                  <svg
                    viewBox="0 0 1000 330"
                    role="img"
                    aria-label="Gráfico da curva ABC de recursos por custo acumulado"
                    preserveAspectRatio="none"
                  >
                    <rect className="abc-zone zone-a" x="80" y="112" width="850" height="168" />
                    <rect className="abc-zone zone-b" x="80" y="80.5" width="850" height="31.5" />
                    <rect className="abc-zone zone-c" x="80" y="70" width="850" height="10.5" />
                    {[0, 25, 50, 75, 100].map((percentage) => {
                      const y = 280 - (percentage / 100) * 210;
                      return (
                        <g key={percentage}>
                          <line className="abc-grid-line" x1="80" x2="930" y1={y} y2={y} />
                          <text className="abc-axis-text" x="68" y={y + 4} textAnchor="end">
                            {percentage}%
                          </text>
                        </g>
                      );
                    })}
                    <line className="abc-threshold-line" x1="80" x2="930" y1="112" y2="112" />
                    <line className="abc-threshold-line" x1="80" x2="930" y1="80.5" y2="80.5" />
                    <text className="abc-threshold-label" x="936" y="116">80%</text>
                    <text className="abc-threshold-label" x="936" y="84.5">95%</text>
                    {abcRows.map((row, index) => {
                      const x = 80 + abcChartStep * (index + 0.5);
                      const barHeight = (row.value / abcMaxValue) * 175;
                      return (
                        <rect
                          className={`abc-cost-bar class-${row.abcClass.toLowerCase()}`}
                          key={row.resource.id}
                          x={x - Math.min(29, abcChartStep * 0.23)}
                          y={280 - barHeight}
                          width={Math.min(58, abcChartStep * 0.46)}
                          height={barHeight}
                          rx="5"
                        />
                      );
                    })}
                    <polyline className="abc-curve-line" points={abcCurvePoints} />
                    {abcRows.map((row, index) => {
                      const x = 80 + abcChartStep * (index + 0.5);
                      const y = 280 - (row.cumulative / 100) * 210;
                      return <circle className="abc-curve-point" key={row.resource.id} cx={x} cy={y} r="4" />;
                    })}
                    <line className="abc-axis-line" x1="80" x2="930" y1="280" y2="280" />
                  </svg>
                  <div
                    className="abc-chart-labels"
                    style={{ gridTemplateColumns: `repeat(${abcRows.length}, minmax(90px, 1fr))` }}
                  >
                    {abcRows.map((row) => (
                      <span key={row.resource.id} title={row.resource.name}>
                        {row.resource.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="empty-message">
                Aloque recursos às tarefas para formar a Curva ABC.
              </p>
            )}
          </article>

          <article className="workspace-card abc-detail-card">
            <div className="workspace-toolbar">
              <div>
                <p className="workspace-kicker">CLASSIFICAÇÃO DETALHADA</p>
                <h2>Ranking de impacto financeiro</h2>
              </div>
              <span className="table-hint">Recalculado automaticamente</span>
            </div>
            <div className="abc-table-scroll">
              <table className="abc-table">
                <thead>
                  <tr>
                    <th>Posição</th>
                    <th>Recurso</th>
                    <th>Tipo</th>
                    <th>Categoria</th>
                    <th>Tarefas</th>
                    <th>Custo</th>
                    <th>Participação</th>
                    <th>Acumulado</th>
                    <th>Classe</th>
                  </tr>
                </thead>
                <tbody>
                  {abcRows.map((row) => (
                    <tr key={row.resource.id}>
                      <td><span className="abc-rank">{String(row.rank).padStart(2, "0")}</span></td>
                      <td><strong>{row.resource.name}</strong><span>{row.resource.costCenter}</span></td>
                      <td><span className={`type-pill ${row.resource.type}`}>{resourceTypeLabel(row.resource.type)}</span></td>
                      <td>{row.resource.category}</td>
                      <td>{row.taskIds.size}</td>
                      <td><strong>{formatMoney(row.value)}</strong></td>
                      <td>{row.participation.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</td>
                      <td>{row.cumulative.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</td>
                      <td><span className={`abc-table-badge class-${row.abcClass.toLowerCase()}`}>{row.abcClass}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      )}

      {activeView === "help" && (
        <section className="view-container help-view">
          <article className="help-hero">
            <div><p className="workspace-kicker light">GUIA RÁPIDO</p><h2>Planeje do prazo ao custo, sem planilhas paralelas.</h2><p>O ACC Ordo transforma datas, calendários e alocações em um cronograma financeiro legível.</p></div>
            <div className="help-calendar"><span>SEG — SEX</span><strong>08:12 — 12:00</strong><i>intervalo de 1h</i><strong>13:00 — 18:00</strong><small>8h48 por dia útil</small></div>
          </article>

          <div className="help-steps">
            <article><span>01</span><div><strong>Defina a tarefa</strong><p>Informe início + término para calcular a duração, ou início + duração para calcular o término.</p></div></article>
            <article><span>02</span><div><strong>Conecte predecessoras</strong><p>Use a relação Término–Início para impedir que uma tarefa comece antes da anterior.</p></div></article>
            <article><span>03</span><div><strong>Escolha o calendário</strong><p>Dias úteis ignoram sábados e domingos. Dias corridos incluem todos os dias do intervalo.</p></div></article>
            <article><span>04</span><div><strong>Cadastre recursos</strong><p>Em Trabalho, escolha taxa por hora, diária ou mensal; Material usa quantidade.</p></div></article>
            <article><span>05</span><div><strong>Aloque e priorize</strong><p>O custo e a Curva ABC são recalculados automaticamente a cada alocação.</p></div></article>
          </div>

          <div className="help-grid">
            <article className="panel-card glossary-card">
              <div className="panel-heading"><div><p className="workspace-kicker">GLOSSÁRIO</p><h3>Categoria e centro de custo</h3></div></div>
              <dl>
                <div><dt>Categoria de custo</dt><dd>Natureza da despesa escolhida na lista padronizada: transporte, combustível, alimentação, hospedagem, equipamentos, materiais, serviços ou diversos.</dd></div>
                <div><dt>Centro de custo</dt><dd>Origem orçamentária: projeto, contrato, cliente, programa ou unidade administrativa de onde sairá o recurso.</dd></div>
              </dl>
            </article>
            <article className="panel-card formula-card">
              <div className="panel-heading"><div><p className="workspace-kicker">CÁLCULOS</p><h3>Como o custo é formado</h3></div></div>
              <div><span>Trabalho</span><code>hora: dias × 8,8 h · diária: dias · mensal: dias ÷ 22</code></div>
              <div><span>Material</span><code>quantidade × preço unitário</code></div>
              <div><span>Custo</span><code>valor direto informado na tarefa</code></div>
            </article>
          </div>
        </section>
      )}

      <footer className="site-footer">
        <span>ACC Ordo Project Manager</span>
        <span>Calendário base · América/São Paulo</span>
      </footer>
    </main>
  );
}
