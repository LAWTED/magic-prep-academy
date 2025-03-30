import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;

  // Check if there's an error message to display
  const hasError = searchParams && "error" in searchParams;

  return (
    <form className="flex flex-col w-full max-w-md p-6 rounded-lg bg-white/80 backdrop-blur-sm shadow-lg">
      <h1 className="text-3xl font-bold text-black mb-2">Sign in</h1>
      <p className="text-foreground mb-6">
        Don't have an account?{" "}
        <Link className="text-grass font-medium hover:underline transition-all" href="/sign-up">
          Sign up
        </Link>
      </p>

      {/* Show error message prominently if exists */}
      {hasError && (
        <div className="mb-4 p-3 bg-tomato/20 border border-tomato/30 rounded-md text-tomato">
          <FormMessage message={searchParams} />
        </div>
      )}

      <div className="flex flex-col gap-3 [&>input]:mb-3">
        <Label htmlFor="email" className="text-black font-medium">Email</Label>
        <Input
          name="email"
          placeholder="you@example.com"
          required
          className={`border-gold/50 focus:border-gold focus:ring-gold/30 ${hasError ? 'border-tomato/50' : ''}`}
        />
        <div className="flex justify-between items-center">
          <Label htmlFor="password" className="text-black font-medium">Password</Label>
          {/* <Link
            className="text-xs text-skyblue hover:text-grass transition-colors"
            href="/forgot-password"
          >
            Forgot Password?
          </Link> */}
        </div>
        <Input
          type="password"
          name="password"
          placeholder="Your password"
          required
          className={`border-gold/50 focus:border-gold focus:ring-gold/30 ${hasError ? 'border-tomato/50' : ''}`}
        />
        <SubmitButton
          pendingText="Signing In..."
          formAction={signInAction}
          className="bg-grass hover:bg-grass/90 text-white font-medium py-2 mt-2"
        >
          Sign in
        </SubmitButton>

        {/* Only show message at bottom if it's not an error */}
        {!hasError && <FormMessage message={searchParams} />}
      </div>
    </form>
  );
}
