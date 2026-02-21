import { fireEvent, screen } from "@testing-library/react";
import Select from "../../../components/ui/Select";
import { renderWithProviders } from "../../test-utils";

const options = [
  { label: "Option A", value: "a" },
  { label: "Option B", value: "b" },
  { label: "Option C", value: "c" },
];

describe("Select", () => {
  it("renders with selected value label", () => {
    renderWithProviders(
      <Select onChange={() => {}} options={options} value="b" />,
    );

    expect(screen.getByRole("button")).toHaveTextContent("Option B");
  });

  it("opens dropdown when button is clicked", () => {
    renderWithProviders(
      <Select onChange={() => {}} options={options} value="a" />,
    );

    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("calls onChange with new value when option is clicked", () => {
    const handleChange = vi.fn();
    renderWithProviders(
      <Select onChange={handleChange} options={options} value="a" />,
    );

    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("option", { name: "Option C" }));
    expect(handleChange).toHaveBeenCalledWith("c");
  });

  it("marks the selected option", () => {
    renderWithProviders(
      <Select onChange={() => {}} options={options} value="b" />,
    );

    fireEvent.click(screen.getByRole("button"));
    const selected = screen.getByRole("option", { name: /Option B/ });
    expect(selected).toHaveAttribute("aria-selected", "true");
  });

  it("renders compact variant with different styling", () => {
    renderWithProviders(
      <Select onChange={() => {}} options={options} value="a" variant="compact" />,
    );

    const button = screen.getByRole("button");
    expect(button.className).toContain("border");
  });

  it("renders default variant styling", () => {
    renderWithProviders(
      <Select onChange={() => {}} options={options} value="a" />,
    );

    const button = screen.getByRole("button");
    expect(button.className).toContain("rounded-xl");
  });
});
