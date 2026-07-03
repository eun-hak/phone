import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <p className="text-sm font-semibold text-accent">404</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">
        페이지를 찾을 수 없습니다
      </h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-sub">
        주소가 바뀌었거나 아직 수록되지 않은 기종일 수 있습니다. 기종 목록에서
        찾아보세요.
      </p>
      <Link
        href="/phones"
        className="mt-6 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-strong"
      >
        기종 목록으로
      </Link>
    </div>
  );
}
