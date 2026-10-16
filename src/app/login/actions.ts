"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { loginSchema, fieldErrors } from "@/lib/validation";

export type LoginState = {
  message?: string;
  errors?: Record<string, string>;
} | undefined;

export async function authenticate(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error) };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { message: "Invalid email or password." };
    }
    throw err; // let error boundaries handle the rest
  }

  redirect("/dashboard");
}
