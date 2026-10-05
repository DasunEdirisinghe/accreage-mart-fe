import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/actions/listings", () => ({
  uploadListingImage: vi.fn(),
  discardListingImage: vi.fn(async () => ({ ok: true })),
}));

import { discardListingImage, uploadListingImage } from "@/app/actions/listings";
import { ImageUploader } from "@/components/pages/listings/image-uploader";
import type { ListingImageValue } from "@/types/listing.type";

const mockUpload = vi.mocked(uploadListingImage);
const mockDiscard = vi.mocked(discardListingImage);

beforeEach(() => vi.clearAllMocks());

const png = (name = "a.png") => new File(["img"], name, { type: "image/png" });

function setup(initial: ListingImageValue[] = []) {
  let images = initial;
  const onChange = vi.fn((next: ListingImageValue[]) => {
    images = next;
    view.rerender(<ImageUploader images={images} onChange={onChange} />);
  });
  const view = render(<ImageUploader images={images} onChange={onChange} />);
  return { onChange, get images() { return images; } };
}

describe("ImageUploader", () => {
  it("uploads a photo and makes the first one the cover", async () => {
    const user = userEvent.setup();
    mockUpload.mockResolvedValueOnce({ ok: true, url: "/files/lst-1.png" });
    const state = setup();
    await user.upload(screen.getByLabelText("Add photos"), png());
    await waitFor(() => expect(state.images).toEqual([{ image: "/files/lst-1.png", is_cover: true }]));
    expect(screen.getByText("Cover")).toBeInTheDocument();
  });

  it("keeps the existing cover when more photos are added", async () => {
    const user = userEvent.setup();
    mockUpload.mockResolvedValueOnce({ ok: true, url: "/files/lst-2.png" });
    const state = setup([{ image: "/files/lst-1.png", is_cover: true }]);
    await user.upload(screen.getByLabelText("Add photos"), png("b.png"));
    await waitFor(() => expect(state.images).toHaveLength(2));
    expect(state.images.map((i) => i.is_cover)).toEqual([true, false]);
  });

  it("lets the seller choose another cover", async () => {
    const user = userEvent.setup();
    const state = setup([
      { image: "/files/a.png", is_cover: true },
      { image: "/files/b.png", is_cover: false },
    ]);
    await user.click(screen.getByRole("button", { name: "Make cover" }));
    expect(state.images.map((i) => i.is_cover)).toEqual([false, true]);
  });

  it("promotes the next photo when the cover is removed", async () => {
    const user = userEvent.setup();
    const state = setup([
      { image: "/files/a.png", is_cover: true },
      { image: "/files/b.png", is_cover: false },
    ]);
    await user.click(screen.getAllByRole("button", { name: "Remove photo" })[0]);
    expect(state.images).toEqual([{ image: "/files/b.png", is_cover: true }]);
  });

  it("discards a removed photo only if it was uploaded in this session", async () => {
    const user = userEvent.setup();
    mockUpload.mockResolvedValueOnce({ ok: true, url: "/files/lst-new.png" });
    const state = setup([{ image: "/files/old.png", is_cover: true }]);
    await user.upload(screen.getByLabelText("Add photos"), png());
    await waitFor(() => expect(state.images).toHaveLength(2));

    await user.click(screen.getAllByRole("button", { name: "Remove photo" })[0]); // old.png
    expect(mockDiscard).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Remove photo" })); // lst-new.png
    expect(mockDiscard).toHaveBeenCalledWith("/files/lst-new.png");
  });

  it("refuses the wrong type and oversize photos before uploading", async () => {
    const user = userEvent.setup({ applyAccept: false });
    setup();
    const huge = new File(["x"], "big.png", { type: "image/png" });
    Object.defineProperty(huge, "size", { value: 6 * 1024 * 1024 });
    await user.upload(screen.getByLabelText("Add photos"), [new File(["x"], "doc.pdf", { type: "application/pdf" }), huge]);
    expect(await screen.findByText(/doc.pdf: only JPG, PNG and WebP/)).toBeInTheDocument();
    expect(screen.getByText(/big.png: photos can be at most 5 MB/)).toBeInTheDocument();
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("shows the server's reason when an upload is rejected", async () => {
    const user = userEvent.setup();
    mockUpload.mockResolvedValueOnce({ ok: false, error: "This file is not a valid image." });
    const state = setup();
    await user.upload(screen.getByLabelText("Add photos"), png("fake.png"));
    expect(await screen.findByText(/fake.png: This file is not a valid image./)).toBeInTheDocument();
    expect(state.images).toEqual([]);
  });

  it("stops at five photos", async () => {
    const full = Array.from({ length: 5 }, (_, i) => ({ image: `/files/${i}.png`, is_cover: i === 0 }));
    setup(full);
    expect(screen.getByLabelText("Add photos")).toBeDisabled();
    expect(screen.getByRole("button", { name: /Add more photos/ })).toBeDisabled();
  });
});
