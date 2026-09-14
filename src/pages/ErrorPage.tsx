// pages/ErrorPage.tsx

const ErrorPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F2EA]">
      <div className="text-center">
        <h1 className="text-7xl font-bold text-[#354536]">
          404
        </h1>

        <h2 className="mt-4 text-2xl font-semibold text-[#17231D]">
          Page Not Found
        </h2>

        <p className="mt-2 text-[#66736B]">
          The page you're looking for doesn't exist.
        </p>

        <a
          href="/"
          className="mt-6 inline-block rounded-lg bg-[#354536] px-5 py-3 text-white"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
};

export default ErrorPage;