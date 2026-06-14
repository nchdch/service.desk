import Image from 'next/image';
import { LoginForm } from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="vds-login">
      <div className="vds-login__card">
        <div className="vds-login__header">
          <Image className="vds-login__logo" src="/logo-mark.png" alt="" width={40} height={40} />
          <h1 className="vds-login__title">Виртуальный офис SD</h1>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
