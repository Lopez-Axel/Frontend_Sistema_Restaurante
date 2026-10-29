"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mail, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/http";
import { verifyOtpSchema, type VerifyOtpValues } from "@/lib/schemas/auth";

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromRegister = searchParams.get("email") ?? "";

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<VerifyOtpValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { email: emailFromRegister, code: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: VerifyOtpValues) => authApi.verifyOtp(values),
    onSuccess: () => {
      toast.success("Cuenta activada. Ya puedes iniciar sesión");
      router.replace("/login");
    },
    onError: (error) => {
      if (error instanceof ApiError && error.fieldErrors) {
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          setError(field as keyof VerifyOtpValues, { message });
        }
      }
      toast.error(error instanceof ApiError ? error.message : "Error al verificar el número");
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-title text-2xl text-foreground">Número de verificación</CardTitle>
        <CardDescription>
          {emailFromRegister
            ? `Enviamos un número de verificación a ${emailFromRegister}`
            : "Ingresa el número de verificación que enviamos a tu correo"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Ej. juan.perez@correo.com"
                autoComplete="email"
                readOnly={!!emailFromRegister}
                className="pl-10 read-only:cursor-default read-only:text-muted-foreground"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Número de verificación</Label>
            <div className="relative">
              <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="code"
                placeholder="Ej. 123456"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className="pl-10 tracking-[0.4em]"
                aria-invalid={!!errors.code}
                {...register("code")}
              />
            </div>
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code.message}</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending}
          >
            <Send className="size-4" />
            {mutation.isPending ? "Enviando..." : "Enviar número de verificación"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/register" className="font-medium text-primary hover:underline">
            ¿No recibiste el número de verificación? Regístrate de nuevo
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={null}>
      <VerifyOtpForm />
    </Suspense>
  );
}
