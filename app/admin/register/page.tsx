import { RegisterPanel } from "@/features/admin-auth";
import { BackButton } from "@/components/ui";

export default function AdminRegisterPage() {
  return (
    <>
      <BackButton href="/admin" label="返回登录" />
      <RegisterPanel />
    </>
  );
}
