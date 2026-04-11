import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TodoList from "@/components/TodoList";
import type { TodoItem } from "@/providers/Stream";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeTodo(
  id: string,
  content: string,
  status: TodoItem["status"]
): TodoItem {
  return { id, content, status };
}

/**
 * The badge renders `{completed}/{todos.length} done` as separate React
 * text nodes, so getByText("2/3 done") won't find it. This matcher checks
 * the element's collapsed textContent instead.
 */
function byBadge(text: string) {
  return (_: string, el: Element | null) =>
    (el?.textContent?.replace(/\s+/g, "") ?? "") === text.replace(/\s+/g, "");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("TodoList component", () => {
  it("renders nothing when the todos array is empty", () => {
    const { container } = render(<TodoList todos={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a list item for each todo", () => {
    const todos = [
      makeTodo("1", "Fetch data", "completed"),
      makeTodo("2", "Process results", "in_progress"),
      makeTodo("3", "Send report", "pending"),
    ];
    render(<TodoList todos={todos} />);

    expect(screen.getByText("Fetch data")).toBeTruthy();
    expect(screen.getByText("Process results")).toBeTruthy();
    expect(screen.getByText("Send report")).toBeTruthy();
  });

  it("shows correct completed count in the badge", () => {
    const todos = [
      makeTodo("1", "A", "completed"),
      makeTodo("2", "B", "completed"),
      makeTodo("3", "C", "pending"),
    ];
    render(<TodoList todos={todos} />);
    expect(screen.getByText(byBadge("2/3 done"))).toBeTruthy();
  });

  it("shows 'Now: <content>' when there is an in-progress task", () => {
    const todos = [
      makeTodo("1", "Step one", "completed"),
      makeTodo("2", "Step two", "in_progress"),
    ];
    render(<TodoList todos={todos} />);
    expect(screen.getByText("Now: Step two")).toBeTruthy();
  });

  it("shows 'Wrapping up remaining steps' when nothing is in_progress", () => {
    const todos = [
      makeTodo("1", "A", "completed"),
      makeTodo("2", "B", "pending"),
    ];
    render(<TodoList todos={todos} />);
    expect(screen.getByText("Wrapping up remaining steps")).toBeTruthy();
  });

  it("shows 'Wrapping up remaining steps' when all todos are completed", () => {
    const todos = [
      makeTodo("1", "A", "completed"),
      makeTodo("2", "B", "completed"),
    ];
    render(<TodoList todos={todos} />);
    expect(screen.getByText("Wrapping up remaining steps")).toBeTruthy();
  });

  it("progress bar width is 0% when nothing is completed", () => {
    const todos = [
      makeTodo("1", "A", "pending"),
      makeTodo("2", "B", "in_progress"),
    ];
    const { container } = render(<TodoList todos={todos} />);
    const bar = container.querySelector<HTMLElement>("[style]");
    expect(bar?.style.width).toBe("0%");
  });

  it("progress bar width is 50% when half the todos are completed", () => {
    const todos = [
      makeTodo("1", "A", "completed"),
      makeTodo("2", "B", "pending"),
    ];
    const { container } = render(<TodoList todos={todos} />);
    const bar = container.querySelector<HTMLElement>("[style]");
    expect(bar?.style.width).toBe("50%");
  });

  it("progress bar width is 100% when all todos are completed", () => {
    const todos = [
      makeTodo("1", "A", "completed"),
      makeTodo("2", "B", "completed"),
      makeTodo("3", "C", "completed"),
    ];
    const { container } = render(<TodoList todos={todos} />);
    const bar = container.querySelector<HTMLElement>("[style]");
    expect(bar?.style.width).toBe("100%");
  });

  it("rounds percentage to nearest integer (33% for 1/3 completed)", () => {
    const todos = [
      makeTodo("1", "A", "completed"),
      makeTodo("2", "B", "pending"),
      makeTodo("3", "C", "pending"),
    ];
    const { container } = render(<TodoList todos={todos} />);
    const bar = container.querySelector<HTMLElement>("[style]");
    expect(bar?.style.width).toBe("33%");
  });

  it("renders the 'Agent Plan' heading", () => {
    const todos = [makeTodo("1", "Something", "pending")];
    render(<TodoList todos={todos} />);
    expect(screen.getByText("Agent Plan")).toBeTruthy();
  });

  it("badge shows 0 completed when the single todo is in_progress", () => {
    const todos = [makeTodo("1", "Running task", "in_progress")];
    render(<TodoList todos={todos} />);
    expect(screen.getByText(byBadge("0/1 done"))).toBeTruthy();
    expect(screen.getByText("Now: Running task")).toBeTruthy();
  });

  it("badge shows all completed when all todos are done", () => {
    const todos = [
      makeTodo("1", "A", "completed"),
      makeTodo("2", "B", "completed"),
    ];
    render(<TodoList todos={todos} />);
    expect(screen.getByText(byBadge("2/2 done"))).toBeTruthy();
  });

  it("renders many todos without crashing", () => {
    const todos = Array.from({ length: 20 }, (_, i) =>
      makeTodo(String(i), `Task ${i}`, i % 3 === 0 ? "completed" : "pending")
    );
    const { container } = render(<TodoList todos={todos} />);
    expect(container.querySelectorAll("li")).toHaveLength(20);
  });
});
