import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import {
  CustomComponentProvider,
  useCustomComponents,
} from "@/providers/CustomComponentProvider";
import type { InterruptComponentProps } from "@/providers/CustomComponentProvider";

// ---------------------------------------------------------------------------
// Helper components
// ---------------------------------------------------------------------------
function ComponentList() {
  const { components } = useCustomComponents();
  const names = Object.keys(components);
  return (
    <ul>
      {names.map((n) => (
        <li key={n} data-testid="comp-name">{n}</li>
      ))}
    </ul>
  );
}

function InterruptList() {
  const { interruptComponents } = useCustomComponents();
  const names = Object.keys(interruptComponents);
  return (
    <ul>
      {names.map((n) => (
        <li key={n} data-testid="interrupt-name">{n}</li>
      ))}
    </ul>
  );
}

// Dummy component factories
const DummyA: React.FC = () => <div>A</div>;
const DummyB: React.FC = () => <div>B</div>;
const DummyInterrupt: React.FC<InterruptComponentProps> = () => <div>Interrupt</div>;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("CustomComponentProvider + useCustomComponents", () => {
  it("starts with an empty component registry", () => {
    render(
      <CustomComponentProvider>
        <ComponentList />
      </CustomComponentProvider>
    );

    expect(screen.queryAllByTestId("comp-name")).toHaveLength(0);
  });

  it("accepts initialComponents and exposes them immediately", () => {
    render(
      <CustomComponentProvider initialComponents={{ DummyA }}>
        <ComponentList />
      </CustomComponentProvider>
    );

    expect(screen.getByTestId("comp-name").textContent).toBe("DummyA");
  });

  it("registerComponent adds a component to the registry", async () => {
    const user = userEvent.setup();

    function Registrar() {
      const { registerComponent } = useCustomComponents();
      return (
        <button onClick={() => registerComponent("MyComp", DummyA)}>Register</button>
      );
    }

    render(
      <CustomComponentProvider>
        <Registrar />
        <ComponentList />
      </CustomComponentProvider>
    );

    expect(screen.queryAllByTestId("comp-name")).toHaveLength(0);
    await user.click(screen.getByRole("button", { name: "Register" }));
    expect(screen.getByTestId("comp-name").textContent).toBe("MyComp");
  });

  it("registerComponents adds multiple components at once", async () => {
    const user = userEvent.setup();

    function BatchRegistrar() {
      const { registerComponents } = useCustomComponents();
      return (
        <button
          onClick={() => registerComponents({ DummyA, DummyB })}
        >
          Register All
        </button>
      );
    }

    render(
      <CustomComponentProvider>
        <BatchRegistrar />
        <ComponentList />
      </CustomComponentProvider>
    );

    await user.click(screen.getByRole("button", { name: "Register All" }));
    const names = screen.getAllByTestId("comp-name").map((el) => el.textContent);
    expect(names).toContain("DummyA");
    expect(names).toContain("DummyB");
  });

  it("unregisterComponent removes a component from the registry", async () => {
    const user = userEvent.setup();

    function Controls() {
      const { registerComponent, unregisterComponent } = useCustomComponents();
      return (
        <>
          <button onClick={() => registerComponent("TempComp", DummyA)}>Add</button>
          <button onClick={() => unregisterComponent("TempComp")}>Remove</button>
        </>
      );
    }

    render(
      <CustomComponentProvider>
        <Controls />
        <ComponentList />
      </CustomComponentProvider>
    );

    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByTestId("comp-name").textContent).toBe("TempComp");

    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(screen.queryAllByTestId("comp-name")).toHaveLength(0);
  });

  it("unregisterComponent is a no-op for an unknown name", async () => {
    const user = userEvent.setup();

    function Unregistrar() {
      const { unregisterComponent } = useCustomComponents();
      return (
        <button onClick={() => unregisterComponent("ghost")}>Remove Ghost</button>
      );
    }

    render(
      <CustomComponentProvider initialComponents={{ DummyA }}>
        <Unregistrar />
        <ComponentList />
      </CustomComponentProvider>
    );

    await user.click(screen.getByRole("button", { name: "Remove Ghost" }));
    // DummyA should still be present
    expect(screen.getByTestId("comp-name").textContent).toBe("DummyA");
  });

  it("registerComponent overwrites an existing component with the same name", async () => {
    const user = userEvent.setup();

    function Overwriter() {
      const { registerComponent } = useCustomComponents();
      return (
        <button onClick={() => registerComponent("DummyA", DummyB)}>Overwrite</button>
      );
    }

    function InspectValue() {
      const { components } = useCustomComponents();
      return (
        <span data-testid="is-b">
          {String(components["DummyA"] === DummyB)}
        </span>
      );
    }

    render(
      <CustomComponentProvider initialComponents={{ DummyA }}>
        <Overwriter />
        <InspectValue />
      </CustomComponentProvider>
    );

    expect(screen.getByTestId("is-b").textContent).toBe("false");
    await user.click(screen.getByRole("button", { name: "Overwrite" }));
    expect(screen.getByTestId("is-b").textContent).toBe("true");
  });

  // --- interrupt components ---

  it("starts with an empty interrupt component registry", () => {
    render(
      <CustomComponentProvider>
        <InterruptList />
      </CustomComponentProvider>
    );

    expect(screen.queryAllByTestId("interrupt-name")).toHaveLength(0);
  });

  it("registerInterruptComponent adds to the interrupt registry", async () => {
    const user = userEvent.setup();

    function InterruptRegistrar() {
      const { registerInterruptComponent } = useCustomComponents();
      return (
        <button
          onClick={() => registerInterruptComponent("approve_tool", DummyInterrupt)}
        >
          Register Interrupt
        </button>
      );
    }

    render(
      <CustomComponentProvider>
        <InterruptRegistrar />
        <InterruptList />
      </CustomComponentProvider>
    );

    await user.click(screen.getByRole("button", { name: "Register Interrupt" }));
    expect(screen.getByTestId("interrupt-name").textContent).toBe("approve_tool");
  });

  it("unregisterInterruptComponent removes from the interrupt registry", async () => {
    const user = userEvent.setup();

    function InterruptControls() {
      const { registerInterruptComponent, unregisterInterruptComponent } =
        useCustomComponents();
      return (
        <>
          <button
            onClick={() =>
              registerInterruptComponent("approve_tool", DummyInterrupt)
            }
          >
            Add Interrupt
          </button>
          <button onClick={() => unregisterInterruptComponent("approve_tool")}>
            Remove Interrupt
          </button>
        </>
      );
    }

    render(
      <CustomComponentProvider>
        <InterruptControls />
        <InterruptList />
      </CustomComponentProvider>
    );

    await user.click(screen.getByRole("button", { name: "Add Interrupt" }));
    expect(screen.getByTestId("interrupt-name").textContent).toBe("approve_tool");

    await user.click(screen.getByRole("button", { name: "Remove Interrupt" }));
    expect(screen.queryAllByTestId("interrupt-name")).toHaveLength(0);
  });

  it("throws when useCustomComponents is used outside a provider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    function Bare() {
      useCustomComponents();
      return null;
    }

    expect(() => render(<Bare />)).toThrow(
      "useCustomComponents must be used within a CustomComponentProvider"
    );

    consoleSpy.mockRestore();
  });
});
