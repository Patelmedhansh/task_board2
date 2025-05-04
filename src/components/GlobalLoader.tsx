import { useLoader } from "../context/LoaderContext";

export default function GlobalLoader() {
  const { isLoading } = useLoader();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 backdrop-blur-sm flex justify-center items-center">
      <div className="w-12 h-12 border-4 border-red border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
