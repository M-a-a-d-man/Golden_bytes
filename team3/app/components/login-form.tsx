"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginFormInput } from "../types/FormTypes";
import { LoginFormSchema } from "../schema";
import { cn } from "@/lib/utils"
import { Button } from "./ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { signIn } from "next-auth/react";
import React from "react";
import { useRouter } from 'next/navigation'


export function LoginForm() {
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormInput>({
    resolver: zodResolver(LoginFormSchema),
  });
  
  const router = useRouter();

  const onSubmit = (data: LoginFormInput) => {

    if (data.email === "john.smith@example.com" && data.password === "password") {
      router.push("/Calendar");
    }else{
      setError("email", {
        type: "manual",
        message: "Invalid email or password",
      });
      setError("password", {
        type: "manual",
        message: "Invalid email or password", 
      });
    }
    // signIn("credentials", {
    //   email: data.email,
    //   password: data.password,
    //   redirect: false,
    // }).then((response) => {
    //   if (response?.error) {
    //     setError("email", {
    //       type: "manual",
    //       message: "Invalid email or password",
    //     });
    //     setError("password", {
    //       type: "manual",
    //       message: "Invalid email or password", 
    //     });
    //   }else{
    //     console.log("Logged in")
    //     Router.push("/dashboard")
    //   }
    // });
  };

  const handleGoogleLogin = (e: { preventDefault: () => void; }) => {
    console.log("Google login triggered");
    e.preventDefault();

    signIn("google", { callbackUrl: "http://localhost:3000/Calendar" }).then((response) => {
      if (response?.error) {
        console.log("Error logging in with Google");
      }


    // Execute your Google login logic here (e.g., call Google OAuth APIs or authentication framework methods)
    });
  }

  return (
    <div className={cn("flex flex-col gap-6")}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  {...register("email")}
                  required
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input id="password" type="password" {...register("password")} required />
                {errors.password && (
                  <p className="text-red-500 text-sm">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full">
                Login
              </Button>

              <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
              {/* <Button variant="outline" className="w-full" type="submit" onClick={handleGoogleLogin}> */}
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlnsXlink="http://www.w3.org/1999/xlink">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
                    Sign in with Google
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{" "}
              <a href="#" className="underline underline-offset-4">
                Sign up
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
