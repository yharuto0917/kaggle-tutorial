import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata = {
	title: "サインイン",
};

export default function SignInPage() {
	return (
		<main className="mx-auto max-w-sm px-6 py-16">
			<h1 className="text-2xl font-bold tracking-tight">サインイン</h1>
			<p className="mt-2 text-sm text-foreground/70">
				ログインすると、学習の進捗とクイズ結果がアカウントに保存され、複数端末で同期されます。
			</p>
			<SignInForm />
		</main>
	);
}
