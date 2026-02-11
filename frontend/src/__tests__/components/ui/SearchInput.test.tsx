import { act, fireEvent, screen } from "@testing-library/react";
import { useState } from "react";
import SearchInput from "../../../components/ui/SearchInput";
import { renderWithProviders } from "../../test-utils";

describe("SearchInput", () => {
  it("forwards onKeyDown to the input element", () => {
    const handleKeyDown = vi.fn();
    renderWithProviders(
      <SearchInput onKeyDown={handleKeyDown} onSearch={() => {}} />,
    );

    fireEvent.keyDown(screen.getByRole("searchbox"), { key: "ArrowDown" });

    expect(handleKeyDown).toHaveBeenCalledTimes(1);
    expect(handleKeyDown.mock.calls[0][0].key).toBe("ArrowDown");
  });

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders with a placeholder", () => {
    renderWithProviders(
      <SearchInput onSearch={() => {}} placeholder="Rechercher..." />,
    );

    expect(screen.getByPlaceholderText("Rechercher...")).toBeInTheDocument();
  });

  it("calls onSearch after debounce delay", () => {
    const handleSearch = vi.fn();
    renderWithProviders(
      <SearchInput debounceMs={300} onSearch={handleSearch} />,
    );

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "alice" },
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(handleSearch).toHaveBeenCalledWith("alice");
  });

  it("does not call onSearch before debounce delay", () => {
    const handleSearch = vi.fn();
    renderWithProviders(
      <SearchInput debounceMs={300} onSearch={handleSearch} />,
    );

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "alice" },
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(handleSearch).not.toHaveBeenCalled();
  });

  it("does not call onSearch on mount", () => {
    const handleSearch = vi.fn();
    renderWithProviders(
      <SearchInput debounceMs={300} onSearch={handleSearch} />,
    );

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(handleSearch).not.toHaveBeenCalled();
  });

  it("spreads inputProps onto the input element", () => {
    renderWithProviders(
      <SearchInput
        inputProps={{
          "aria-controls": "my-listbox",
          "aria-expanded": true,
          role: "combobox",
        }}
        onSearch={() => {}}
      />,
    );

    const input = screen.getByRole("combobox");
    expect(input).toHaveAttribute("aria-controls", "my-listbox");
    expect(input).toHaveAttribute("aria-expanded", "true");
  });

  it("clears input when clearKey changes", () => {
    function Wrapper() {
      const [clearKey, setClearKey] = useState(0);
      return (
        <>
          <SearchInput clearKey={clearKey} onSearch={() => {}} placeholder="search" />
          <button onClick={() => setClearKey((k) => k + 1)} type="button">
            Reset
          </button>
        </>
      );
    }

    renderWithProviders(<Wrapper />);

    const input = screen.getByRole("searchbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "hello" } });
    expect(input.value).toBe("hello");

    fireEvent.click(screen.getByText("Reset"));
    expect(input.value).toBe("");
  });

  it("shows clear button when input has value", () => {
    renderWithProviders(<SearchInput onSearch={() => {}} />);

    const input = screen.getByRole("searchbox");
    expect(screen.queryByRole("button", { name: /effacer/i })).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: "test" } });
    expect(screen.getByRole("button", { name: /effacer/i })).toBeInTheDocument();
  });

  it("clears the input when clear button is clicked", () => {
    const handleSearch = vi.fn();
    renderWithProviders(<SearchInput debounceMs={300} onSearch={handleSearch} />);

    const input = screen.getByRole("searchbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "test" } });

    // Let debounced value settle to "test" first
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(handleSearch).toHaveBeenCalledWith("test");
    handleSearch.mockClear();

    fireEvent.click(screen.getByRole("button", { name: /effacer/i }));
    expect(input.value).toBe("");

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(handleSearch).toHaveBeenCalledWith("");
  });
});
