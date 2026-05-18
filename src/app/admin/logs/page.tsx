import { prisma } from "@/lib/prisma";
import LogsClient from "./LogsClient";

export const dynamic = "force-dynamic";

export default async function AdminLogsPage() {
  // Query all system audit logs directly from the database
  const dbLogs = await prisma.log.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: true,
    },
  });

  const formattedLogs = dbLogs.map((log) => ({
    id: log.id,
    action: log.action,
    details: log.details,
    createdAt: log.createdAt.toISOString(),
    userEmail: log.user?.email || "System/Guest",
  }));

  return <LogsClient logs={formattedLogs} />;
}
