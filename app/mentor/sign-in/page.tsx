import { mentorSignInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <form className="w-full max-w-md space-y-8 p-8 rounded-2xl border shadow-lg bg-card">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Welcome Back!</h1>
          <p className="text-muted-foreground">
            Don't have an account?{" "}
            <Link
              className="font-semibold text-primary hover:text-primary/80 transition-colors"
              href="/sign-up"
            >
              Sign up
            </Link>
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-medium"
            >
              Email
            </Label>
            <Input
              name="email"
              id="email"
              type="email"
              placeholder="you@example.com"
              required
              className="w-full h-12 text-base rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label
                htmlFor="password"
                className="text-sm font-medium"
              >
                Password
              </Label>
            </div>
            <Input
              type="password"
              name="password"
              id="password"
              placeholder="Your password"
              required
              className="w-full h-12 text-base rounded-xl"
            />
          </div>

          <SubmitButton
            pendingText="Signing In..."
            formAction={mentorSignInAction}
            className="w-full h-12 text-base font-semibold rounded-xl"
          >
            Sign in
          </SubmitButton>

          <FormMessage message={searchParams} />
        </div>
      </form>
    </div>
  );
}
