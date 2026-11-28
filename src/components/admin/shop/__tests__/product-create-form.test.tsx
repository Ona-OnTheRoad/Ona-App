// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProductCreateForm } from "../product-create-form";
import { EMPTY_CREATE_FORM } from "../catalog-types";

afterEach(() => cleanup());

const categories = [
  {
    id: "cat-1",
    trade_key: "mechanic",
    slug: "brakes",
    name: "Brakes",
    depth: 0,
  },
];

describe("ProductCreateForm", () => {
  it("keeps Create disabled until required fields are set, then submits", () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn();

    const { rerender } = render(
      <ProductCreateForm
        form={EMPTY_CREATE_FORM}
        onChange={onChange}
        tradeOptions={["mechanic"]}
        categoriesForTrade={categories}
        busy={false}
        onSubmit={onSubmit}
      />,
    );

    const disabledBtn = screen.getByRole("button", {
      name: "Create product",
    }) as HTMLButtonElement;
    expect(disabledBtn.disabled).toBe(true);

    const filled = {
      ...EMPTY_CREATE_FORM,
      name: "Brake pad",
      tradeKey: "mechanic",
      categoryId: "cat-1",
      sku: "BP-9",
      priceMajor: "12000",
    };

    rerender(
      <ProductCreateForm
        form={filled}
        onChange={onChange}
        tradeOptions={["mechanic"]}
        categoriesForTrade={categories}
        busy={false}
        onSubmit={onSubmit}
      />,
    );

    const btn = screen.getByRole("button", {
      name: "Create product",
    }) as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
    fireEvent.click(btn);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
