import LoginPage from "../LoginPage";

export default function LoginPageExample() {
  return <LoginPage onLogin={(user, pass) => console.log("Login:", user, pass)} />;
}
