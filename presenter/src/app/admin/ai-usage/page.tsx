import { requireRole } from '@/lib/dal';
import { getAiUsageByUser } from '@/lib/aiUsage';
import { AiUsagePanel } from '@/components/AiUsagePanel';
import { Breadcrumb } from '@/components/Breadcrumb';

export default async function AdminAiUsagePage() {
  await requireRole(['ADMIN']);
  const usage = await getAiUsageByUser();

  return (
    <div className="min-h-full bg-[#f3f4f7] text-[#1c2027] px-8 py-10">
      <div className="max-w-4xl mx-auto">
        <Breadcrumb items={[{ label: 'Aulas', href: '/lessons' }, { label: 'Uso da IA' }]} />
        <h1 className="text-lg font-bold mt-2 mb-8">Uso da IA</h1>

        <div className="rounded-xl border border-[#e4e6eb] bg-white shadow-sm overflow-hidden">
          <AiUsagePanel usage={usage} />
        </div>
      </div>
    </div>
  );
}
