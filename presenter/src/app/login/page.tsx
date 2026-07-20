import { signIn } from '@/auth';
import { getCurrentUser } from '@/lib/dal';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === 'NONE' ? '/aguardando' : '/lessons');

  return (
    <div className="min-h-full flex items-center justify-center bg-[#f3f4f7] px-6">
      <div className="w-full max-w-sm rounded-xl border border-[#e4e6eb] bg-white px-8 py-10 shadow-sm text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-[#fd3682]" />
          <span className="font-bold text-[#1c2027]">CCBEU Slides</span>
        </div>
        <p className="text-[13px] text-[#9aa1ac] mb-8">Entre com sua conta @ccbeuguarapuava.com.br</p>

        <form
          action={async () => {
            'use server';
            await signIn('google', { redirectTo: '/lessons' });
          }}
        >
          <button type="submit" className="btn primary w-full flex items-center justify-center py-2.5 text-[13.5px]">
            Entrar com Google
          </button>
        </form>
      </div>
    </div>
  );
}
