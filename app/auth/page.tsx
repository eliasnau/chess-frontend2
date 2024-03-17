import React, { useState } from "react";
import { LoginForm, RegisterForm } from "@/components/auth/auth";

function Page() {
  const [authType, setAuthType] = useState("login");

  return <div>{authType === "login" ? <LoginForm /> : <RegisterForm />}</div>;
}

export default Page;
