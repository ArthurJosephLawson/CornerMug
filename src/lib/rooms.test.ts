import { describe, expect, it } from "vitest";
import {
  ROOM_IDS,
  loadRoomConfig,
  validateRoomConfig,
} from "./rooms";
import type { RoomConfig } from "@/types/room";

const validConfig: RoomConfig = {
  id: "interior_1",
  name: "Cafe Interior 1",
  backgroundKey: "interior_1",
  backgroundSize: { width: 640, height: 360 },
  spawn: { x: 320, y: 180 },
  colliders: [{ x: 0, y: 0, width: 640, height: 16 }],
  props: [{ key: "desk", x: 200, y: 200, width: 96, height: 64, solid: true }],
  snapSeats: [{ id: "seat-1", x: 100, y: 100, facing: "left", tableId: "table-1" }],
};

describe("validateRoomConfig", () => {
  it("accepts a valid config", () => {
    expect(validateRoomConfig(validConfig)).toEqual([]);
  });

  it("rejects missing backgroundKey", () => {
    const bad = { ...validConfig, backgroundKey: "" };
    expect(validateRoomConfig(bad).length).toBeGreaterThan(0);
  });

  it("rejects wrong backgroundSize", () => {
    const bad = { ...validConfig, backgroundSize: { width: 320, height: 180 } };
    expect(validateRoomConfig(bad).length).toBeGreaterThan(0);
  });

  it("rejects missing spawn", () => {
    const { spawn: _spawn, ...bad } = validConfig;
    expect(validateRoomConfig(bad).length).toBeGreaterThan(0);
  });

  it("rejects a seat without tableId", () => {
    const bad = {
      ...validConfig,
      snapSeats: [{ id: "seat-1", x: 1, y: 2, facing: "left" as const, tableId: "" }],
    };
    expect(validateRoomConfig(bad).length).toBeGreaterThan(0);
  });

  it("rejects a seat with bad facing", () => {
    const bad = {
      ...validConfig,
      snapSeats: [{ id: "seat-1", x: 1, y: 2, facing: "up" as never, tableId: "t" }],
    };
    expect(validateRoomConfig(bad).length).toBeGreaterThan(0);
  });

  it("rejects a prop with non-positive size", () => {
    const bad = {
      ...validConfig,
      props: [{ key: "desk", x: 1, y: 1, width: 0, height: 10, solid: false }],
    };
    expect(validateRoomConfig(bad).length).toBeGreaterThan(0);
  });

  it("rejects a collider with negative size", () => {
    const bad = {
      ...validConfig,
      colliders: [{ x: 0, y: 0, width: -5, height: 10 }],
    };
    expect(validateRoomConfig(bad).length).toBeGreaterThan(0);
  });
});

describe("ROOM_IDS + loadRoomConfig", () => {
  it("exposes the three interiors", () => {
    expect(ROOM_IDS).toEqual(["interior_1", "interior_2", "interior_3"]);
  });

  it("loads and validates each starter template", () => {
    for (const id of ROOM_IDS) {
      const config = loadRoomConfig(id);
      expect(config.backgroundKey).toBe(id);
      expect(validateRoomConfig(config)).toEqual([]);
    }
  });

  it("throws for an unknown room id", () => {
    expect(() => loadRoomConfig("interior_4")).toThrowError("Unknown room: interior_4");
  });
});
