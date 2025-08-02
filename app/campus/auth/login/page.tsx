import LoginWithRoles from "../../../components/auth/LoginWithRoles";
import { LocalSessionProvider } from "../../../components/auth/LocalSessionProvider";

export default function LoginPage() {
  return (
    <LocalSessionProvider>
      <LoginWithRoles />
    </LocalSessionProvider>
  );
}
