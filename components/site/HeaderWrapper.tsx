import { getMainMenu, type MenuItem } from "@/sanity/lib/fetch";
import { HeaderClient } from "./HeaderClient";

export const Header = async () => {
  let navLinks: MenuItem[] = [];

  try {
    const mainMenu = await getMainMenu();
    if (mainMenu && mainMenu.length > 0) {
      navLinks = mainMenu;
    }
  } catch (error) {
    console.error("Error fetching main menu from Sanity:", error);
    // Fall back to default links in HeaderClient
  }

  return <HeaderClient navLinks={navLinks} />;
};
