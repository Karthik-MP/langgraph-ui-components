import React, { createContext, useContext, useState, useCallback } from "react";

interface CustomComponentContextValue {
  components: Record<string, React.FunctionComponent | React.ComponentClass>;
  registerComponent: (
    name: string,
    component: React.FunctionComponent | React.ComponentClass
  ) => void;
  registerComponents: (
    components: Record<string, React.FunctionComponent | React.ComponentClass>
  ) => void;
  unregisterComponent: (name: string) => void;
}

const CustomComponentContext = createContext<
  CustomComponentContextValue | undefined
>(undefined);

interface CustomComponentProviderProps {
  children: React.ReactNode;
  initialComponents?: Record<
    string,
    React.FunctionComponent | React.ComponentClass
  >;
}

export function CustomComponentProvider({
  children,
  initialComponents = {},
}: CustomComponentProviderProps) {
  const [components, setComponents] =
    useState<Record<string, React.FunctionComponent | React.ComponentClass>>(
      initialComponents
    );
    // console.log("CustomComponentProvider - initialComponents:", initialComponents);
  const registerComponent = useCallback(
    (
      name: string,
      component: React.FunctionComponent | React.ComponentClass
    ) => {
      setComponents((prev) => ({
        ...prev,
        [name]: component,
      }));
    },
    []
  );

  const registerComponents = useCallback(
    (
      newComponents: Record<
        string,
        React.FunctionComponent | React.ComponentClass
      >
    ) => {
      setComponents((prev) => ({
        ...prev,
        ...newComponents,
      }));
    },
    []
  );

  const unregisterComponent = useCallback((name: string) => {
    setComponents((prev) => {
      const { [name]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  return (
    <CustomComponentContext.Provider
      value={{
        components,
        registerComponent,
        registerComponents,
        unregisterComponent,
      }}
    >
      {children}
    </CustomComponentContext.Provider>
  );
}

export function useCustomComponents() {
  const context = useContext(CustomComponentContext);
  if (!context) {
    throw new Error(
      "useCustomComponents must be used within a CustomComponentProvider"
    );
  }
  return context;
}
