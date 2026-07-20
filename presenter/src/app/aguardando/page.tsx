import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/dal';
import { SignOutButton } from '@/components/SignOutButton';

export default async function AguardandoPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'NONE') redirect('/lessons');

  return (
    <div className="min-h-full flex items-center justify-center bg-[#f3f4f7] px-6">
      <div className="w-full max-w-sm rounded-xl border border-[#e4e6eb] bg-white px-8 py-10 shadow-sm text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-[#fd3682]" />
          <span className="font-bold text-[#1c2027]">CCBEU Slides</span>
        </div>
        <p className="text-[13.5px] text-[#1c2027] font-medium mt-6 mb-2">Acesso ainda não liberado</p>
        <p className="text-[13px] text-[#9aa1ac] mb-8">
          Sua conta ({user.email}) foi criada, mas ainda não tem permissão de acesso. Fale com um coordenador ou
          administrador para liberar seu papel.
        </p>
        <SignOutButton />
      </div>
    </div>
  );
}
