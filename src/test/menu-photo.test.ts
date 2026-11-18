import { describe, expect, it } from "vitest";
import { isMenuPhotoName, menuPhotoUrl } from "@/lib/menu-photo";

describe("menu photo names", () => {
  it("accepts only generated photo names", () => {
    expect(isMenuPhotoName("3f2b8c1e-1a2b-4c3d-8e9f-0a1b2c3d4e5f.jpg")).toBe(true);
    expect(isMenuPhotoName("../secret.jpg")).toBe(false);
    expect(isMenuPhotoName("photo.png")).toBe(false);
  });
  it("points uploaded photos at the public photo address", () => {
    expect(menuPhotoUrl("a.jpg")).toBe("/api/public/menu-photo/a.jpg");
  });
});
