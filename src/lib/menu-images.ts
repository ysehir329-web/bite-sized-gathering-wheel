import espresso from "@/assets/espresso.jpg";
import flatwhite from "@/assets/flatwhite.jpg";
import icedlatte from "@/assets/icedlatte.jpg";
import frappe from "@/assets/frappe.jpg";
export const menuImages: Record<string, string> = { espresso, flatwhite, icedlatte, frappe };
export function menuImage(value: string) { return menuImages[value] ?? value; }
