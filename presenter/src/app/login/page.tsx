import { AuthError } from 'next-auth';
import { signIn } from '@/auth';
import { getCurrentUser } from '@/lib/dal';
import { redirect } from 'next/navigation';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect(user.role === 'NONE' ? '/aguardando' : '/lessons');

  const { error } = await searchParams;

  return (
    <div className="min-h-full flex items-center justify-center bg-[#f3f4f7] px-6">
      <div className="w-full max-w-sm rounded-xl border border-[#e4e6eb] bg-white px-8 py-10 shadow-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-[#fd3682]" />
          <span className="font-bold text-[#1c2027]">CCBEU Slides</span>
        </div>
        <p className="text-[13px] text-[#9aa1ac] mb-8 text-center">Entre com sua conta @ccbeuguarapuava.com.br</p>

        {error === 'CredentialsSignin' && (
          <p className="mb-4 rounded-md bg-[#fdecef] border border-[#f6c6cf] text-[#c81e3a] text-[12.5px] px-3 py-2 text-center">
            Email ou senha incorretos.
          </p>
        )}

        <form
          className="flex flex-col gap-3"
          action={async (formData: FormData) => {
            'use server';
            try {
              await signIn('credentials', {
                email: formData.get('email'),
                password: formData.get('password'),
                redirectTo: '/lessons',
              });
            } catch (err) {
              if (err instanceof AuthError) {
                redirect('/login?error=CredentialsSignin');
              }
              throw err;
            }
          }}
        >
          <div>
            <label htmlFor="email" className="block text-[12px] font-medium text-[#5b6472] mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-md border border-[#dde0e6] px-3 py-2 text-[13.5px] outline-none focus:border-[var(--ccbeu-blue)]"
              placeholder="voce@ccbeuguarapuava.com.br"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-[12px] font-medium text-[#5b6472] mb-1">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-md border border-[#dde0e6] px-3 py-2 text-[13.5px] outline-none focus:border-[var(--ccbeu-blue)]"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn primary w-full flex items-center justify-center py-2.5 text-[13.5px] mt-1">
            Entrar
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <span className="h-px flex-1 bg-[#e4e6eb]" />
          <span className="text-[11.5px] text-[#b0b6bf]">ou</span>
          <span className="h-px flex-1 bg-[#e4e6eb]" />
        </div>

        <form
          action={async () => {
            'use server';
            await signIn('google', { redirectTo: '/lessons' });
          }}
        >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-2.5 text-[13.5px] rounded-md border border-[#dde0e6] bg-white text-[#1c2027] hover:bg-[#f7f8fa] transition-colors"
          >
            <GoogleIcon />
            Entrar com Google
          </button>
        </form>
        <p className="text-[11px] text-[#b0b6bf] text-center mt-3">Login com Google só funciona em localhost.</p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4c-7.682 0-14.344 4.337-17.694 10.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}
