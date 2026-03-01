import { SignUp } from "@clerk/nextjs";

export default function SignupPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-purple-950 dark:to-pink-950 p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 mb-4 shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Join TeamManager
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Create your account and start collaborating
                    </p>
                </div>

                {/* Clerk Sign Up Component */}
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">
                    <SignUp 
                        routing="path" 
                        path="/register" 
                        signInUrl="/login"
                        appearance={{
                            elements: {
                                rootBox: "mx-auto",
                                card: "bg-white dark:bg-gray-800 shadow-2xl rounded-2xl border border-gray-200 dark:border-gray-700",
                                headerTitle: "hidden",
                                headerSubtitle: "hidden",
                                socialButtonsBlockButton: "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200",
                                formButtonPrimary: "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-sm normal-case shadow-lg",
                                formFieldInput: "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white",
                                footerActionLink: "text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300",
                                identityPreviewText: "text-gray-700 dark:text-gray-300",
                                formFieldLabel: "text-gray-700 dark:text-gray-300",
                            }
                        }}
                    />
                </div>

                {/* Footer */}
                <div className="text-center mt-8 animate-in fade-in duration-1000 delay-300">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Already have an account?{" "}
                        <a href="/login" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold">
                            Sign in
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
