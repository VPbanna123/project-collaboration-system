import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <SignIn
                routing="path"
                path="/login"
                signUpUrl="/register"
            />
        </div>
    );
}
