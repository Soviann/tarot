import { fireEvent, render, screen } from "@testing-library/react";
import DateRangeFilter from "../../components/DateRangeFilter";

describe("DateRangeFilter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-21"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("renders all preset buttons and date inputs", () => {
    const onChange = vi.fn();
    render(<DateRangeFilter from={null} onChange={onChange} to={null} />);

    expect(screen.getByRole("button", { name: "30j" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3 mois" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "6 mois" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1 an" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tout" })).toBeInTheDocument();

    expect(screen.getByLabelText("De")).toBeInTheDocument();
    expect(screen.getByLabelText("À")).toBeInTheDocument();
  });

  it("calls onChange with correct dates when clicking '30j' preset", () => {
    const onChange = vi.fn();
    render(<DateRangeFilter from={null} onChange={onChange} to={null} />);

    fireEvent.click(screen.getByRole("button", { name: "30j" }));

    expect(onChange).toHaveBeenCalledWith("2026-01-22", "2026-02-21");
  });

  it("calls onChange with correct dates when clicking '3 mois' preset", () => {
    const onChange = vi.fn();
    render(<DateRangeFilter from={null} onChange={onChange} to={null} />);

    fireEvent.click(screen.getByRole("button", { name: "3 mois" }));

    expect(onChange).toHaveBeenCalledWith("2025-11-21", "2026-02-21");
  });

  it("calls onChange with correct dates when clicking '6 mois' preset", () => {
    const onChange = vi.fn();
    render(<DateRangeFilter from={null} onChange={onChange} to={null} />);

    fireEvent.click(screen.getByRole("button", { name: "6 mois" }));

    expect(onChange).toHaveBeenCalledWith("2025-08-21", "2026-02-21");
  });

  it("calls onChange with correct dates when clicking '1 an' preset", () => {
    const onChange = vi.fn();
    render(<DateRangeFilter from={null} onChange={onChange} to={null} />);

    fireEvent.click(screen.getByRole("button", { name: "1 an" }));

    expect(onChange).toHaveBeenCalledWith("2025-02-21", "2026-02-21");
  });

  it("calls onChange with (null, null) when clicking 'Tout' preset", () => {
    const onChange = vi.fn();
    render(<DateRangeFilter from="2026-01-01" onChange={onChange} to="2026-02-21" />);

    fireEvent.click(screen.getByRole("button", { name: "Tout" }));

    expect(onChange).toHaveBeenCalledWith(null, null);
  });

  it("calls onChange when 'De' date input changes", () => {
    const onChange = vi.fn();
    render(<DateRangeFilter from={null} onChange={onChange} to="2026-02-21" />);

    fireEvent.change(screen.getByLabelText("De"), { target: { value: "2026-01-15" } });

    expect(onChange).toHaveBeenCalledWith("2026-01-15", "2026-02-21");
  });

  it("calls onChange when 'À' date input changes", () => {
    const onChange = vi.fn();
    render(<DateRangeFilter from="2026-01-01" onChange={onChange} to={null} />);

    fireEvent.change(screen.getByLabelText("À"), { target: { value: "2026-02-15" } });

    expect(onChange).toHaveBeenCalledWith("2026-01-01", "2026-02-15");
  });

  it("calls onChange with null when date input is cleared", () => {
    const onChange = vi.fn();
    render(<DateRangeFilter from="2026-01-01" onChange={onChange} to="2026-02-21" />);

    fireEvent.change(screen.getByLabelText("De"), { target: { value: "" } });

    expect(onChange).toHaveBeenCalledWith(null, "2026-02-21");
  });

  it("highlights 'Tout' preset when from and to are null", () => {
    const onChange = vi.fn();
    render(<DateRangeFilter from={null} onChange={onChange} to={null} />);

    const toutButton = screen.getByRole("button", { name: "Tout" });
    expect(toutButton.className).toContain("bg-accent-500");
  });

  it("highlights '30j' preset when from/to match 30 days range", () => {
    const onChange = vi.fn();
    render(<DateRangeFilter from="2026-01-22" onChange={onChange} to="2026-02-21" />);

    const button30j = screen.getByRole("button", { name: "30j" });
    expect(button30j.className).toContain("bg-accent-500");

    const toutButton = screen.getByRole("button", { name: "Tout" });
    expect(toutButton.className).not.toContain("bg-accent-500");
  });

  it("highlights no preset when dates do not match any preset", () => {
    const onChange = vi.fn();
    render(<DateRangeFilter from="2026-01-05" onChange={onChange} to="2026-02-10" />);

    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => {
      expect(button.className).not.toContain("bg-accent-500");
    });
  });
});
