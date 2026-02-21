import { fireEvent, screen } from "@testing-library/react";
import { OverflowMenu } from "../../../components/ui";
import { renderWithProviders } from "../../test-utils";

const items = [
  { icon: <span data-testid="icon-a">A</span>, label: "Action A", onClick: vi.fn() },
  { icon: <span data-testid="icon-b">B</span>, label: "Action B", onClick: vi.fn() },
  { icon: <span data-testid="icon-c">C</span>, label: "Action C", disabled: true, onClick: vi.fn() },
];

describe("OverflowMenu", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders a trigger button with the correct aria-label", () => {
    renderWithProviders(<OverflowMenu items={items} label="Actions" />);
    expect(screen.getByRole("button", { name: "Actions" })).toBeInTheDocument();
  });

  it("does not show menu items initially", () => {
    renderWithProviders(<OverflowMenu items={items} label="Actions" />);
    expect(screen.queryByText("Action A")).not.toBeInTheDocument();
  });

  it("shows menu items when trigger is clicked", () => {
    renderWithProviders(<OverflowMenu items={items} label="Actions" />);
    fireEvent.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.getByText("Action A")).toBeInTheDocument();
    expect(screen.getByText("Action B")).toBeInTheDocument();
    expect(screen.getByText("Action C")).toBeInTheDocument();
  });

  it("calls onClick and closes menu when an item is clicked", () => {
    renderWithProviders(<OverflowMenu items={items} label="Actions" />);
    fireEvent.click(screen.getByRole("button", { name: "Actions" }));
    fireEvent.click(screen.getByText("Action A"));
    expect(items[0].onClick).toHaveBeenCalledOnce();
    expect(screen.queryByText("Action A")).not.toBeInTheDocument();
  });

  it("does not call onClick for disabled items", () => {
    renderWithProviders(<OverflowMenu items={items} label="Actions" />);
    fireEvent.click(screen.getByRole("button", { name: "Actions" }));
    fireEvent.click(screen.getByText("Action C"));
    expect(items[2].onClick).not.toHaveBeenCalled();
  });

  it("closes menu when clicking outside", () => {
    renderWithProviders(
      <div>
        <span data-testid="outside">Outside</span>
        <OverflowMenu items={items} label="Actions" />
      </div>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.getByText("Action A")).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(screen.queryByText("Action A")).not.toBeInTheDocument();
  });

  it("renders link items with href", () => {
    const linkItems = [
      { href: "/some-page", icon: <span>L</span>, label: "Link Item" },
    ];
    renderWithProviders(<OverflowMenu items={linkItems} label="Actions" />);
    fireEvent.click(screen.getByRole("button", { name: "Actions" }));
    const link = screen.getByRole("menuitem", { name: /Link Item/ });
    expect(link).toHaveAttribute("href", "/some-page");
  });

  it("closes menu on Escape key", () => {
    renderWithProviders(<OverflowMenu items={items} label="Actions" />);
    fireEvent.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.getByText("Action A")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("Action A")).not.toBeInTheDocument();
  });

  // --- ARIA menu roles ---

  it("renders dropdown with role=menu", () => {
    renderWithProviders(<OverflowMenu items={items} label="Actions" />);
    fireEvent.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("renders button items with role=menuitem", () => {
    renderWithProviders(<OverflowMenu items={items} label="Actions" />);
    fireEvent.click(screen.getByRole("button", { name: "Actions" }));
    const menuitems = screen.getAllByRole("menuitem");
    expect(menuitems).toHaveLength(3);
  });

  it("renders link items with role=menuitem", () => {
    const linkItems = [
      { href: "/page-a", icon: <span>A</span>, label: "Link A" },
      { href: "/page-b", icon: <span>B</span>, label: "Link B" },
    ];
    renderWithProviders(<OverflowMenu items={linkItems} label="Actions" />);
    fireEvent.click(screen.getByRole("button", { name: "Actions" }));
    const menuitems = screen.getAllByRole("menuitem");
    expect(menuitems).toHaveLength(2);
  });

  it("sets aria-expanded on trigger button", () => {
    renderWithProviders(<OverflowMenu items={items} label="Actions" />);
    const trigger = screen.getByRole("button", { name: "Actions" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  // --- Keyboard navigation ---

  it("moves focus with ArrowDown key", () => {
    renderWithProviders(<OverflowMenu items={items} label="Actions" />);
    fireEvent.click(screen.getByRole("button", { name: "Actions" }));
    const menuitems = screen.getAllByRole("menuitem");

    fireEvent.keyDown(screen.getByRole("menu"), { key: "ArrowDown" });
    expect(document.activeElement).toBe(menuitems[0]);

    fireEvent.keyDown(screen.getByRole("menu"), { key: "ArrowDown" });
    expect(document.activeElement).toBe(menuitems[1]);
  });

  it("moves focus with ArrowUp key, skipping disabled items", () => {
    renderWithProviders(<OverflowMenu items={items} label="Actions" />);
    fireEvent.click(screen.getByRole("button", { name: "Actions" }));
    const menuitems = screen.getAllByRole("menuitem");

    // ArrowUp from start should wrap to last non-disabled item (Action B, not disabled Action C)
    fireEvent.keyDown(screen.getByRole("menu"), { key: "ArrowUp" });
    expect(document.activeElement).toBe(menuitems[1]);
  });

  it("wraps focus around with ArrowDown, skipping disabled items", () => {
    renderWithProviders(<OverflowMenu items={items} label="Actions" />);
    fireEvent.click(screen.getByRole("button", { name: "Actions" }));
    const menuitems = screen.getAllByRole("menuitem");

    // 1st ArrowDown → item[0] (Action A)
    fireEvent.keyDown(screen.getByRole("menu"), { key: "ArrowDown" });
    expect(document.activeElement).toBe(menuitems[0]);
    // 2nd ArrowDown → item[1] (Action B)
    fireEvent.keyDown(screen.getByRole("menu"), { key: "ArrowDown" });
    expect(document.activeElement).toBe(menuitems[1]);
    // 3rd ArrowDown → skips disabled item[2], wraps to item[0]
    fireEvent.keyDown(screen.getByRole("menu"), { key: "ArrowDown" });
    expect(document.activeElement).toBe(menuitems[0]);
  });
});
