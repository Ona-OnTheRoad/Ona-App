import { describe, expect, it } from "vitest";
import {
  EMPTY_CREATE_FORM,
  canSubmitCreateProduct,
  type CreateProductForm,
} from "../catalog-types";

function form(partial: Partial<CreateProductForm>): CreateProductForm {
  return { ...EMPTY_CREATE_FORM, ...partial };
}

describe("canSubmitCreateProduct", () => {
  it("allows a complete create payload", () => {
    expect(
      canSubmitCreateProduct(
        form({
          name: "Oil filter",
          tradeKey: "mechanic",
          categoryId: "cat-1",
          sku: "OF-1",
          priceMajor: "4500",
        }),
      ),
    ).toBe(true);
  });

  it("blocks empty name, sku, category, or price", () => {
    expect(
      canSubmitCreateProduct(
        form({
          name: " ",
          categoryId: "c",
          sku: "s",
          priceMajor: "1",
        }),
      ),
    ).toBe(false);
    expect(
      canSubmitCreateProduct(
        form({
          name: "Pad",
          categoryId: "",
          sku: "s",
          priceMajor: "1",
        }),
      ),
    ).toBe(false);
    expect(
      canSubmitCreateProduct(
        form({
          name: "Pad",
          categoryId: "c",
          sku: " ",
          priceMajor: "1",
        }),
      ),
    ).toBe(false);
    expect(
      canSubmitCreateProduct(
        form({
          name: "Pad",
          categoryId: "c",
          sku: "s",
          priceMajor: "",
        }),
      ),
    ).toBe(false);
  });

  it("blocks negative or non-numeric price", () => {
    expect(
      canSubmitCreateProduct(
        form({
          name: "Pad",
          categoryId: "c",
          sku: "s",
          priceMajor: "-5",
        }),
      ),
    ).toBe(false);
    expect(
      canSubmitCreateProduct(
        form({
          name: "Pad",
          categoryId: "c",
          sku: "s",
          priceMajor: "abc",
        }),
      ),
    ).toBe(false);
  });

  it("allows zero price", () => {
    expect(
      canSubmitCreateProduct(
        form({
          name: "Pad",
          categoryId: "c",
          sku: "s",
          priceMajor: "0",
        }),
      ),
    ).toBe(true);
  });
});
