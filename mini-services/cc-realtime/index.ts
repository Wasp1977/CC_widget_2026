import { Server } from "socket.io";

const io = new Server(3003, {
  cors: { origin: "*" },
});

// In-memory state mirrors mock-data structure
interface Queue {
  id: string;
  name: string;
  group: string;
  slaSeconds: number;
  awtDay: number;
  awt10min: number;
  awtCurrent: number;
  queueDepth: number;
  availAgents: number;
  totalAgents: number;
  idlePercent: number;
}

interface Agent {
  id: string;
  name: string;
  login: string;
  extension: string;
  queue: string;
  status: "online" | "break" | "offline" | "call";
  callsToday: number;
  talkTime: number;
  waitTime: number;
  avgCallDuration: number;
  statusSince: string;
}

const queues: Queue[] = [
  { id: "q1", name: "Продажи", group: "Входящие линии", slaSeconds: 30, awtDay: 45, awt10min: 62, awtCurrent: 28, queueDepth: 3, availAgents: 1, totalAgents: 5, idlePercent: 12 },
  { id: "q2", name: "Поддержка", group: "Входящие линии", slaSeconds: 60, awtDay: 118, awt10min: 95, awtCurrent: 72, queueDepth: 7, availAgents: 0, totalAgents: 8, idlePercent: 5 },
  { id: "q3", name: "Тех. отдел", group: "Входящие линии", slaSeconds: 90, awtDay: 32, awt10min: 15, awtCurrent: 0, queueDepth: 0, availAgents: 3, totalAgents: 4, idlePercent: 35 },
  { id: "q4", name: "Биллинг", group: "Входящие линии", slaSeconds: 30, awtDay: 22, awt10min: 18, awtCurrent: 5, queueDepth: 1, availAgents: 2, totalAgents: 3, idlePercent: 28 },
  { id: "q5", name: "VIP-клиенты", group: "Входящие линии", slaSeconds: 20, awtDay: 8, awt10min: 4, awtCurrent: 0, queueDepth: 0, availAgents: 2, totalAgents: 2, idlePercent: 40 },
  { id: "q6", name: "Мультискилл", group: "Входящие линии", slaSeconds: 60, awtDay: 88, awt10min: 120, awtCurrent: 95, queueDepth: 12, availAgents: 0, totalAgents: 6, idlePercent: 2 },
  { id: "q7", name: "Обзвон B2B", group: "Исходящие линии", slaSeconds: 0, awtDay: 0, awt10min: 0, awtCurrent: 0, queueDepth: 0, availAgents: 2, totalAgents: 4, idlePercent: 50 },
  { id: "q8", name: "Опросы", group: "Исходящие линии", slaSeconds: 0, awtDay: 0, awt10min: 0, awtCurrent: 0, queueDepth: 0, availAgents: 1, totalAgents: 2, idlePercent: 50 },
];

const agents: Agent[] = [
  { id: "a1", name: "Иванова Мария", login: "ivanova", extension: "1001", queue: "Продажи", status: "call", callsToday: 47, talkTime: 11200, waitTime: 840, avgCallDuration: 238, statusSince: "2026-08-10T06:30:00Z" },
  { id: "a2", name: "Петров Алексей", login: "petrov", extension: "1002", queue: "Продажи", status: "online", callsToday: 38, talkTime: 8500, waitTime: 620, avgCallDuration: 224, statusSince: "2026-08-10T06:45:00Z" },
  { id: "a3", name: "Сидорова Елена", login: "sidorova", extension: "1003", queue: "Поддержка", status: "call", callsToday: 52, talkTime: 14500, waitTime: 1200, avgCallDuration: 279, statusSince: "2026-08-10T06:15:00Z" },
  { id: "a4", name: "Козлов Дмитрий", login: "kozlov", extension: "1004", queue: "Поддержка", status: "break", callsToday: 41, talkTime: 10200, waitTime: 900, avgCallDuration: 249, statusSince: "2026-08-10T06:50:00Z" },
  { id: "a5", name: "Новикова Анна", login: "novikova", extension: "1005", queue: "Тех. отдел", status: "online", callsToday: 29, talkTime: 9800, waitTime: 450, avgCallDuration: 338, statusSince: "2026-08-10T07:00:00Z" },
  { id: "a6", name: "Морозов Игорь", login: "morozov", extension: "1006", queue: "Тех. отдел", status: "call", callsToday: 33, talkTime: 12000, waitTime: 500, avgCallDuration: 364, statusSince: "2026-08-10T06:20:00Z" },
  { id: "a7", name: "Волкова Ольга", login: "volkova", extension: "1007", queue: "Биллинг", status: "online", callsToday: 44, talkTime: 7600, waitTime: 380, avgCallDuration: 173, statusSince: "2026-08-10T06:40:00Z" },
  { id: "a8", name: "Соколов Андрей", login: "sokolov", extension: "1008", queue: "Биллинг", status: "offline", callsToday: 0, talkTime: 0, waitTime: 0, avgCallDuration: 0, statusSince: "2026-08-10T00:00:00Z" },
  { id: "a9", name: "Кузнецова Татьяна", login: "kuznetsova", extension: "1009", queue: "VIP-клиенты", status: "online", callsToday: 18, talkTime: 5200, waitTime: 200, avgCallDuration: 289, statusSince: "2026-08-10T06:35:00Z" },
  { id: "a10", name: "Попов Максим", login: "popov", extension: "1010", queue: "VIP-клиенты", status: "call", callsToday: 22, talkTime: 6100, waitTime: 280, avgCallDuration: 277, statusSince: "2026-08-10T06:25:00Z" },
  { id: "a11", name: "Лебедева Екатерина", login: "lebedeva", extension: "1011", queue: "Мультискилл", status: "call", callsToday: 55, talkTime: 16000, waitTime: 1500, avgCallDuration: 291, statusSince: "2026-08-10T06:10:00Z" },
  { id: "a12", name: "Федоров Сергей", login: "fedorov", extension: "1012", queue: "Мультискилл", status: "call", callsToday: 48, talkTime: 13800, waitTime: 1100, avgCallDuration: 288, statusSince: "2026-08-10T06:12:00Z" },
];

function fl(value: number, maxDelta: number, min = 0): number {
  const d = Math.round((Math.random() - 0.5) * 2 * maxDelta);
  return Math.max(min, value + d);
}

function tick() {
  for (const q of queues) {
    if (q.slaSeconds > 0) {
      q.awtCurrent = fl(q.awtCurrent, 8, 0);
      q.awt10min = fl(q.awt10min, 5, 0);
      q.awtDay = fl(q.awtDay, 2, 0);
      q.queueDepth = fl(q.queueDepth, 2, 0);
      // Occasionally change agent availability
      if (Math.random() < 0.05) {
        q.availAgents = fl(q.availAgents, 1, 0);
        q.availAgents = Math.min(q.availAgents, q.totalAgents);
      }
    }
  }

  const statuses: Array<"online" | "call" | "break" | "offline"> = ["online", "call", "break", "offline"];
  for (const a of agents) {
    if (a.status !== "offline" && Math.random() < 0.03) {
      // Simulate status transitions
      if (a.status === "call" && Math.random() < 0.4) {
        a.status = "online";
        a.callsToday += 1;
        a.talkTime += Math.round(Math.random() * 300 + 60);
      } else if (a.status === "online" && Math.random() < 0.3) {
        a.status = "call";
      } else if (a.status === "online" && Math.random() < 0.1) {
        a.status = "break";
      } else if (a.status === "break" && Math.random() < 0.5) {
        a.status = "online";
      }
    }
  }
}

io.on("connection", (socket) => {
  console.log("Client connected", socket.id);

  // Send initial state
  socket.emit("queues:update", { queues });
  socket.emit("agents:update", { agents });

  // Handle agent status change from client
  socket.on("agent:status-change", (data: { agentId: string; status: Agent["status"] }) => {
    const agent = agents.find((a) => a.id === data.agentId);
    if (agent) {
      agent.status = data.status;
      agent.statusSince = new Date().toISOString();
      io.emit("agents:update", { agents });
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected", socket.id);
  });
});

// Broadcast updates every 2 seconds
setInterval(() => {
  tick();
  io.emit("queues:update", { queues });
  io.emit("agents:update", { agents });
}, 2000);

console.log("CC Realtime service running on port 3003");
