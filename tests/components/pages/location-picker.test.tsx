import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LocationPicker } from "@/components/pages/listings/location-picker";

afterEach(() => vi.unstubAllGlobals());

function setup(latitude = "", longitude = "") {
  const onChange = vi.fn();
  render(<LocationPicker latitude={latitude} longitude={longitude} onChange={onChange} />);
  return onChange;
}

describe("LocationPicker", () => {
  it("sets the pin from a pasted Google Maps link", async () => {
    const user = userEvent.setup();
    const onChange = setup();
    await user.type(
      screen.getByLabelText("Google Maps link or coordinates"),
      "https://www.google.com/maps/@7.2906,80.6337,15z",
    );
    await user.click(screen.getByRole("button", { name: "Set pin" }));
    expect(onChange).toHaveBeenCalledWith("7.2906", "80.6337");
  });

  it("sets the pin from typed coordinates with Enter", async () => {
    const user = userEvent.setup();
    const onChange = setup();
    await user.type(screen.getByLabelText("Google Maps link or coordinates"), "6.9271, 79.8612{Enter}");
    expect(onChange).toHaveBeenCalledWith("6.9271", "79.8612");
  });

  it("explains when it can't find a location in the text", async () => {
    const user = userEvent.setup();
    const onChange = setup();
    await user.type(screen.getByLabelText("Google Maps link or coordinates"), "Kandy market");
    await user.click(screen.getByRole("button", { name: "Set pin" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(/Couldn't find a location/)).toBeInTheDocument();
  });

  it("uses the browser's location when allowed", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: (ok: PositionCallback) =>
          ok({ coords: { latitude: 7.123456789, longitude: 80.5 } } as GeolocationPosition),
      },
    });
    const onChange = setup();
    await user.click(screen.getByRole("button", { name: /Use my current location/ }));
    expect(onChange).toHaveBeenCalledWith("7.123457", "80.5");
  });

  it("explains when location access is refused", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("navigator", {
      geolocation: { getCurrentPosition: (_ok: PositionCallback, fail: PositionErrorCallback) => fail({} as GeolocationPositionError) },
    });
    setup();
    await user.click(screen.getByRole("button", { name: /Use my current location/ }));
    expect(screen.getByText(/Couldn't get your location/)).toBeInTheDocument();
  });

  it("shows a preview and a Google Maps link once there is a pin, and can clear it", async () => {
    const user = userEvent.setup();
    const onChange = setup("7.29", "80.63");
    expect(screen.getByTitle("Pin preview")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open in Google Maps/ })).toHaveAttribute(
      "href",
      "https://www.google.com/maps?q=7.29,80.63",
    );
    await user.click(screen.getByRole("button", { name: /Clear pin/ }));
    expect(onChange).toHaveBeenCalledWith("", "");
  });

  it("has no preview without a pin, and warns about a pin outside Sri Lanka", () => {
    const { unmount } = render(<LocationPicker latitude="" longitude="" onChange={() => {}} />);
    expect(screen.queryByTitle("Pin preview")).not.toBeInTheDocument();
    unmount();
    render(<LocationPicker latitude="51.5" longitude="-0.12" onChange={() => {}} />);
    expect(screen.getByText(/outside Sri Lanka/)).toBeInTheDocument();
  });

  it("lets the seller edit each coordinate by hand", async () => {
    const user = userEvent.setup();
    const onChange = setup("7.29", "80.63");
    await user.type(screen.getByLabelText("Latitude"), "1");
    expect(onChange).toHaveBeenLastCalledWith("7.291", "80.63");
  });
});
