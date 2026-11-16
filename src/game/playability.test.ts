import { describe, expect, it } from "vitest";
import { seatHasLaptop } from "./playability";
import type { PropPlacement, SnapSeat } from "@/types/room";

const seat: SnapSeat = { id: "t1", x: 200, y: 300, facing: "right", tableId: "table_a" };

const prop = (key: string, x: number, y: number, width = 24, height = 18): PropPlacement => ({
  key,
  x,
  y,
  width,
  height,
  solid: false,
});

describe("seatHasLaptop", () => {
  it("is false when there are no props", () => {
    expect(seatHasLaptop(seat, [])).toBe(false);
  });

  it("is false when no prop is a laptop", () => {
    expect(seatHasLaptop(seat, [prop("table", 200, 300)])).toBe(false);
  });

  it("is false when the laptop is out of seat range", () => {
    expect(seatHasLaptop(seat, [prop("laptop", 480, 200)])).toBe(false);
  });

  it("is true when a laptop prop sits near the seat", () => {
    expect(seatHasLaptop(seat, [prop("laptop", 205, 295)])).toBe(true);
  });

  it("is true when a laptop prop sits directly under the seat", () => {
    expect(seatHasLaptop(seat, [prop("laptop", 200, 300)])).toBe(true);
  });
});
