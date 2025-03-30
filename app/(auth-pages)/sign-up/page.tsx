import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  if ("message" in searchParams) {
    return (
      <div className="w-full flex-1 flex items-center h-[100dvh] sm:max-w-md justify-center gap-2 p-4">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  return (
    <>
      <form className="flex flex-col w-full max-w-md p-6 rounded-lg bg-white/80 backdrop-blur-sm shadow-lg">
        <h1 className="text-3xl font-bold text-black mb-2">Sign up</h1>
        <p className="text-foreground mb-6">
          Already have an account?{" "}
          <Link className="text-grass font-medium hover:underline transition-all" href="/sign-in">
            Sign in
          </Link>
        </p>
        <div className="flex flex-col gap-3 [&>input]:mb-3">
          <Label htmlFor="email" className="text-black font-medium">Email</Label>
          <Input
            name="email"
            placeholder="you@example.com"
            required
            className="border-gold/50 focus:border-gold focus:ring-gold/30"
          />
          <Label htmlFor="password" className="text-black font-medium">Password</Label>
          <Input
            type="password"
            name="password"
            placeholder="Your password"
            minLength={6}
            required
            className="border-gold/50 focus:border-gold focus:ring-gold/30"
          />
          <SubmitButton
            formAction={signUpAction}
            pendingText="Signing up..."
            className="bg-grass hover:bg-grass/90 text-white font-medium py-2 mt-2"
          >
            Sign up
          </SubmitButton>
          <FormMessage message={searchParams} />
        </div>
      </form>
    </>
  );
}
