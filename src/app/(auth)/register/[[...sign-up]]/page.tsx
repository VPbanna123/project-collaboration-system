import { SignUp } from "@clerk/nextjs";

export default function SignupPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <SignUp routing="path" path="/register" signInUrl="/login" />
        </div>
    );
}
