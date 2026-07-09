import { LoginForm } from './login-form';

export default function LoginPage({ searchParams }: { searchParams: { invite?: string } }) {
  return <LoginForm inviteToken={searchParams.invite} />;
}
