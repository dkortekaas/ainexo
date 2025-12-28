import { getMainMenu, type MenuItem } from "@/sanity/lib/fetch";
import { HeaderClient } from "./HeaderClient";

export const Header = async ({ locale }: { locale: string }) => {
  let navLinks: MenuItem[] = [];

  try {
    // Try to fetch menu for current locale
    const mainMenu = await getMainMenu(locale);
    if (mainMenu && mainMenu.length > 0) {
      navLinks = mainMenu;
    } else {
      // Fallback to Dutch (nl) if no menu items found for current locale
      if (locale !== "nl") {
        console.warn(
          `No main menu items found for locale "${locale}", falling back to "nl"`
        );
      }
      const fallbackMenu = await getMainMenu("nl");
      if (fallbackMenu && fallbackMenu.length > 0) {
        navLinks = fallbackMenu;
      }
    }
  } catch (error) {
    console.error("Error fetching main menu from Sanity:", error);
    // Fall back to default links in HeaderClient
  }

  return <HeaderClient navLinks={navLinks} />;
};
