import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShareQrCodeModal from "../../components/ShareQrCodeModal";
import { renderWithProviders } from "../test-utils";

vi.mock("qrcode.react", () => ({
  QRCodeSVG: (props: { size: number; value: string }) => (
    <div data-testid="qr-code" data-value={props.value} />
  ),
}));

describe("ShareQrCodeModal", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when closed", () => {
    renderWithProviders(
      <ShareQrCodeModal onClose={vi.fn()} open={false} sessionId={42} />,
    );

    expect(screen.queryByText("Partager la session")).not.toBeInTheDocument();
  });

  it("renders QR code with correct session URL when open", () => {
    renderWithProviders(
      <ShareQrCodeModal onClose={vi.fn()} open={true} sessionId={42} />,
    );

    expect(screen.getByText("Partager la session")).toBeInTheDocument();
    const qr = screen.getByTestId("qr-code");
    expect(qr.dataset.value).toBe("http://localhost:3000/sessions/42");
  });

  it("displays the session URL as text", () => {
    renderWithProviders(
      <ShareQrCodeModal onClose={vi.fn()} open={true} sessionId={42} />,
    );

    expect(screen.getByText(/\/sessions\/42/)).toBeInTheDocument();
  });

  it("enters fullscreen mode when button is clicked", async () => {
    renderWithProviders(
      <ShareQrCodeModal onClose={vi.fn()} open={true} sessionId={42} />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Plein écran" }),
    );

    // In fullscreen, two QR codes exist (modal + fullscreen overlay)
    const qrCodes = screen.getAllByTestId("qr-code");
    expect(qrCodes.length).toBe(2);
  });

  it("exits fullscreen mode when overlay is clicked", async () => {
    renderWithProviders(
      <ShareQrCodeModal onClose={vi.fn()} open={true} sessionId={42} />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Plein écran" }),
    );

    // Click the close button in fullscreen
    await userEvent.click(
      screen.getByRole("button", { name: "Fermer le plein écran" }),
    );

    const qrCodes = screen.getAllByTestId("qr-code");
    expect(qrCodes.length).toBe(1);
  });

  it("calls onClose when modal is closed", async () => {
    const onClose = vi.fn();
    renderWithProviders(
      <ShareQrCodeModal onClose={onClose} open={true} sessionId={42} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Fermer" }));

    expect(onClose).toHaveBeenCalled();
  });
});
