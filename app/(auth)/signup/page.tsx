import { SignupForm } from './signup-form';

export default function SignupPage({
  searchParams,
}: {
  searchParams: { invite?: string };
}) {
  return <SignupForm inviteToken={searchParams.invite} />;
}
