/**
 * Font loading utility for the widget
 */

export interface FontConfig {
  family: string;
  weights?: string[];
  display?: "swap" | "block" | "fallback" | "optional";
}

/**
 * Load a Google Font dynamically
 */
export async function loadGoogleFont(config: FontConfig): Promise<void> {
  const { family, weights = ["400"], display = "swap" } = config;

  // Check if font is already loaded
  if (document.fonts && document.fonts.check(`16px "${family}"`)) {
    return;
  }

  // Create Google Fonts URL
  const weightsParam = weights.join(";");
  const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weightsParam}&display=${display}`;

  try {
    // Load the font CSS
    const response = await fetch(fontUrl);
    if (!response.ok) {
      console.warn(`Failed to load font: ${family}`);
      return;
    }

    const cssText = await response.text();

    // Create and inject the font CSS
    const style = document.createElement("style");
    style.textContent = cssText;
    document.head.appendChild(style);

    // Wait for font to be loaded
    if (document.fonts) {
      await document.fonts.load(`16px "${family}"`);
    }
  } catch (error) {
    console.warn(`Error loading font ${family}:`, error);
  }
}

/**
 * Load a custom font from a URL
 */
export async function loadCustomFont(
  family: string,
  url: string
): Promise<void> {
  // Check if font is already loaded
  if (document.fonts && document.fonts.check(`16px "${family}"`)) {
    return;
  }

  try {
    // Create @font-face rule
    const fontFace = new FontFace(family, `url(${url})`);
    await fontFace.load();
    document.fonts.add(fontFace);
  } catch (error) {
    console.warn(`Error loading custom font ${family}:`, error);
  }
}

/**
 * Load font based on family name
 */
export async function loadFont(family: string): Promise<void> {
  if (!family || family === "system" || family === "default") {
    return;
  }

  // Common Google Fonts that don't need loading
  const systemFonts = [
    "Arial",
    "Helvetica",
    "Times New Roman",
    "Courier New",
    "Verdana",
    "Georgia",
    "Palatino",
    "Garamond",
    "Bookman",
    "Comic Sans MS",
    "Trebuchet MS",
    "Arial Black",
    "Impact",
    "Tahoma",
    "Geneva",
    "Lucida Console",
    "Monaco",
    "Lucida Sans Unicode",
  ];

  if (systemFonts.includes(family)) {
    return;
  }

  // Try to load as Google Font
  try {
    await loadGoogleFont({ family });
  } catch (error) {
    console.warn(`Failed to load Google Font: ${family}`, error);
  }
}
