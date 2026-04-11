import { describe, it, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import {
  ChatRuntimeProvider,
  useChatRuntime,
} from "@/providers/ChatRuntime";

// ---------------------------------------------------------------------------
// Helper: a component that reads the context and renders its values
// ---------------------------------------------------------------------------
function RuntimeDisplay() {
  const { apiUrl, assistantId, identity } = useChatRuntime();
  return (
    <div>
      <span data-testid="apiUrl">{apiUrl}</span>
      <span data-testid="assistantId">{assistantId}</span>
      <span data-testid="userId">{identity?.user_id ?? "none"}</span>
    </div>
  );
}

// A component that exercises setAssistantId
function AssistantSwitcher() {
  const { assistantId, setAssistantId } = useChatRuntime();
  return (
    <div>
      <span data-testid="assistantId">{assistantId}</span>
      <button onClick={() => setAssistantId("new-agent")}>Switch</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("ChatRuntimeProvider + useChatRuntime", () => {
  it("provides apiUrl and assistantId to consumers", () => {
    render(
      <ChatRuntimeProvider apiUrl="https://api.example.com" assistantId="agent-1">
        <RuntimeDisplay />
      </ChatRuntimeProvider>
    );

    expect(screen.getByTestId("apiUrl").textContent).toBe("https://api.example.com");
    expect(screen.getByTestId("assistantId").textContent).toBe("agent-1");
  });

  it("provides identity fields when passed", () => {
    render(
      <ChatRuntimeProvider
        apiUrl="https://api.example.com"
        assistantId="agent-1"
        identity={{ user_id: "user-42", org_id: "org-99" }}
      >
        <RuntimeDisplay />
      </ChatRuntimeProvider>
    );

    expect(screen.getByTestId("userId").textContent).toBe("user-42");
  });

  it("renders 'none' when identity is omitted", () => {
    render(
      <ChatRuntimeProvider apiUrl="https://api.example.com" assistantId="agent-1">
        <RuntimeDisplay />
      </ChatRuntimeProvider>
    );

    expect(screen.getByTestId("userId").textContent).toBe("none");
  });

  it("renders 'none' when identity is explicitly null", () => {
    render(
      <ChatRuntimeProvider
        apiUrl="https://api.example.com"
        assistantId="agent-1"
        identity={null}
      >
        <RuntimeDisplay />
      </ChatRuntimeProvider>
    );

    expect(screen.getByTestId("userId").textContent).toBe("none");
  });

  it("updates assistantId when setAssistantId is called", async () => {
    const user = userEvent.setup();
    render(
      <ChatRuntimeProvider apiUrl="https://api.example.com" assistantId="agent-1">
        <AssistantSwitcher />
      </ChatRuntimeProvider>
    );

    expect(screen.getByTestId("assistantId").textContent).toBe("agent-1");
    await user.click(screen.getByRole("button", { name: "Switch" }));
    expect(screen.getByTestId("assistantId").textContent).toBe("new-agent");
  });

  it("throws when useChatRuntime is used outside a provider", () => {
    // Suppress the expected React error boundary noise
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    function BareConsumer() {
      useChatRuntime(); // should throw
      return null;
    }

    expect(() => render(<BareConsumer />)).toThrow(
      "useChatRuntime must be used within a ChatRuntimeProvider"
    );

    consoleSpy.mockRestore();
  });

  it("passes arbitrary extra identity fields through", () => {
    function ExtraField() {
      const { identity } = useChatRuntime();
      return <span data-testid="extra">{String(identity?.quote_id)}</span>;
    }

    render(
      <ChatRuntimeProvider
        apiUrl="https://api.example.com"
        assistantId="agent-1"
        identity={{ quote_id: "q-007" }}
      >
        <ExtraField />
      </ChatRuntimeProvider>
    );

    expect(screen.getByTestId("extra").textContent).toBe("q-007");
  });

  it("multiple consumers share the same context value", () => {
    render(
      <ChatRuntimeProvider apiUrl="https://api.example.com" assistantId="shared-agent">
        <RuntimeDisplay />
        <RuntimeDisplay />
      </ChatRuntimeProvider>
    );

    const ids = screen.getAllByTestId("assistantId");
    expect(ids).toHaveLength(2);
    ids.forEach((el) => expect(el.textContent).toBe("shared-agent"));
  });

  it("nested providers: inner provider wins for its own subtree", () => {
    render(
      <ChatRuntimeProvider apiUrl="https://outer.com" assistantId="outer-agent">
        <ChatRuntimeProvider apiUrl="https://inner.com" assistantId="inner-agent">
          <RuntimeDisplay />
        </ChatRuntimeProvider>
      </ChatRuntimeProvider>
    );

    expect(screen.getByTestId("apiUrl").textContent).toBe("https://inner.com");
    expect(screen.getByTestId("assistantId").textContent).toBe("inner-agent");
  });
});
