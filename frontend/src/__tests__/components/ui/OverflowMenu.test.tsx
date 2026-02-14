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
    const link = screen.getByRole("link", { name: /Link Item/ });
    expect(link).toHaveAttribute("href", "/some-page");
  });
});
