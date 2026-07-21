import { notFound } from "next/navigation";
import { StatisticsClient } from "@/components/StatisticsClient";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function StatisticsPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  if (!UUID_V4.test(uuid)) notFound();
  return <StatisticsClient uuid={uuid} />;
}
