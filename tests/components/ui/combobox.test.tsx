import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Combobox } from "@/components/ui/combobox";

const options = [
  { value: "carrot", label: "Carrot", hint: "Vegetables" },
  { value: "cabbage", label: "Cabbage", hint: "Vegetables" },
  { value: "rice", label: "Nadu Rice", hint: "Rice" },
];

function setup(props: Partial<React.ComponentProps<typeof Combobox>> = {}) {
  const onValueChange = vi.fn();
  const view = render(
    <form>
      <Combobox name="category" value="" onValueChange={onValueChange} options={options} placeholder="Pick one" {...props} />
    </form>,
  );
  return { onValueChange, ...view };
}

describe("Combobox", () => {
  it("shows the placeholder, or the selected label", () => {
    setup();
    expect(screen.getByRole("combobox")).toHaveTextContent("Pick one");
  });

  it("shows the selected option's label and submits its value", () => {
    const { container } = setup({ value: "rice" });
    expect(screen.getByRole("combobox")).toHaveTextContent("Nadu Rice");
    expect(container.querySelector('input[name="category"]')).toHaveValue("rice");
  });

  it("opens, lists every option, and picks one with a click", async () => {
    const user = userEvent.setup();
    const { onValueChange } = setup();
    await user.click(screen.getByRole("combobox"));
    expect(screen.getAllByRole("option")).toHaveLength(3);

    await user.click(screen.getByRole("option", { name: /Cabbage/ }));
    expect(onValueChange).toHaveBeenCalledWith("cabbage");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("filters as you type, matching the label and the hint", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("combobox"));
    await user.type(screen.getByPlaceholderText("Search…"), "cab");
    expect(screen.getAllByRole("option")).toHaveLength(1);

    await user.clear(screen.getByPlaceholderText("Search…"));
    await user.type(screen.getByPlaceholderText("Search…"), "vegetables");
    expect(screen.getAllByRole("option")).toHaveLength(2);
  });

  it("says when nothing matches", async () => {
    const user = userEvent.setup();
    setup({ emptyText: "No category matches." });
    await user.click(screen.getByRole("combobox"));
    await user.type(screen.getByPlaceholderText("Search…"), "zzz");
    expect(screen.getByText("No category matches.")).toBeInTheDocument();
  });

  it("supports the keyboard: arrows move, Enter picks, Escape closes", async () => {
    const user = userEvent.setup();
    const { onValueChange } = setup();
    await user.click(screen.getByRole("combobox"));
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("cabbage");

    await user.click(screen.getByRole("combobox"));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes when you click elsewhere", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("combobox"));
    await user.click(document.body);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("does not open when disabled", async () => {
    const user = userEvent.setup();
    setup({ disabled: true });
    await user.click(screen.getByRole("combobox"));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
