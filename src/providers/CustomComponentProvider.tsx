import React, { createContext, useCallback, useContext, useState } from "react";

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

/**
 * Hook to access and manage custom component registry.
 * Use this to register, unregister, or access custom components.
 * 
 * @throws {Error} If used outside of CustomComponentProvider
 * 
 * @example
 * ```tsx
 * const { components, registerComponent } = useCustomComponents();
 * registerComponent('MyComponent', MyComponent);
 * ```
 */
export function useCustomComponents() {
  const context = useContext(CustomComponentContext);
  if (!context) {
    throw new Error(
      "useCustomComponents must be used within a CustomComponentProvider"
    );
  }
  return context;
}
