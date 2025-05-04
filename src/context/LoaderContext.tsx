import { createContext, useState, useContext } from "react";

interface LoaderContextType {
  isLoading: boolean;
  setLoading: (val: boolean) => void;
}

const LoaderContext = createContext<LoaderContextType>({
  isLoading: false,
  setLoading: () => {},
});

export const LoaderProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  return (
    <LoaderContext.Provider value={{ isLoading, setLoading: setIsLoading }}>
      {children}
    </LoaderContext.Provider>
  );
};

export const useLoader = () => useContext(LoaderContext);
