export interface ScrapedPage {
  url: string;
  title?: string;
  content: string;
  links: string[];
  error?: string;
}

export interface ScrapedWebsite {
  mainUrl: string;
  pages: ScrapedPage[];
  totalPages: number;
  errors: string[];
}

export class WebsiteScraper {
  private maxPages: number;
  private maxDepth: number;
  private visitedUrls: Set<string>;
  private baseDomain!: string;

  constructor(maxPages: number = 10, maxDepth: number = 2) {
    this.maxPages = maxPages;
    this.maxDepth = maxDepth;
    this.visitedUrls = new Set();
  }

  async scrapeWebsite(url: string): Promise<ScrapedWebsite> {
    this.visitedUrls.clear();
    this.baseDomain = new URL(url).hostname;

    const result: ScrapedWebsite = {
      mainUrl: url,
      pages: [],
      totalPages: 0,
      errors: [],
    };

    try {
      await this.scrapePage(url, 0, result);
      result.totalPages = result.pages.length;
    } catch (error) {
      result.errors.push(
        `Failed to scrape website: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    return result;
  }

  private async scrapePage(
    url: string,
    depth: number,
    result: ScrapedWebsite
  ): Promise<void> {
    // Check limits
    if (
      depth > this.maxDepth ||
      result.pages.length >= this.maxPages ||
      this.visitedUrls.has(url)
    ) {
      return;
    }

    this.visitedUrls.add(url);

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();

      // Try to use jsdom, but fallback to simple parsing if it fails (e.g., in serverless)
      let document: Document;
      try {
        // Dynamic import to avoid ES module issues in serverless environments
        const { JSDOM } = await import("jsdom");
        const dom = new JSDOM(html);
        document = dom.window.document;
      } catch (jsdomError) {
        // Fallback: Use a simple HTML parser or regex-based extraction
        // This is a basic fallback that works without jsdom
        console.warn("jsdom failed, using fallback parser:", jsdomError);
        document = this.createFallbackDocument(html);
      }

      // Extract title
      const title =
        document.querySelector("title")?.textContent?.trim() ||
        document.querySelector("h1")?.textContent?.trim() ||
        "Untitled";

      // Extract main content
      const content = this.extractContent(document);

      // Extract links
      const links = this.extractLinks(document, url);

      const scrapedPage: ScrapedPage = {
        url,
        title,
        content,
        links,
      };

      result.pages.push(scrapedPage);

      // Recursively scrape found links (same domain only)
      if (depth < this.maxDepth) {
        const sameDomainLinks = links.filter((link) => {
          try {
            return new URL(link).hostname === this.baseDomain;
          } catch {
            return false;
          }
        });

        // Limit concurrent requests
        const linksToScrape = sameDomainLinks.slice(0, 5); // Max 5 concurrent
        await Promise.allSettled(
          linksToScrape.map((link) => this.scrapePage(link, depth + 1, result))
        );
      }
    } catch (error) {
      const errorMessage = `Failed to scrape ${url}: ${error instanceof Error ? error.message : "Unknown error"}`;
      result.errors.push(errorMessage);

      result.pages.push({
        url,
        content: "",
        links: [],
        error: errorMessage,
      });
    }
  }

  private extractContent(document: any): string {
    // For fallback document, use the body textContent directly
    if (document.body && typeof document.body.textContent === "string") {
      return document.body.textContent;
    }

    // For real DOM documents, use the original logic
    // Remove script and style elements
    const scripts = document.querySelectorAll(
      "script, style, nav, header, footer, aside"
    );
    if (scripts.forEach) {
      scripts.forEach((el: any) => {
        if (el.remove) el.remove();
      });
    }

    // Try to find main content areas
    const contentSelectors = [
      "main",
      "article",
      '[role="main"]',
      ".content",
      ".main-content",
      "#content",
      "#main",
      ".post-content",
      ".entry-content",
    ];

    let contentElement: any = null;
    for (const selector of contentSelectors) {
      contentElement = document.querySelector(selector);
      if (contentElement) break;
    }

    // Fallback to body if no main content found
    if (!contentElement) {
      contentElement = document.body;
    }

    if (!contentElement) {
      return "";
    }

    // Extract text content
    let text = contentElement.textContent || "";

    // Clean up the text
    text = text
      .replace(/\s+/g, " ") // Replace multiple whitespace with single space
      .replace(/\n\s*\n/g, "\n") // Remove empty lines
      .trim();

    return text;
  }

  private extractLinks(document: any, baseUrl: string): string[] {
    const links: string[] = [];
    const linkElements = document.querySelectorAll("a[href]");

    // Handle both real DOM NodeList and our fallback array
    const linksArray = Array.isArray(linkElements)
      ? linkElements
      : Array.from(linkElements);

    linksArray.forEach((link: any) => {
      const href = link.getAttribute ? link.getAttribute("href") : link.href;
      if (!href) return;

      try {
        // Convert relative URLs to absolute
        const absoluteUrl = new URL(href, baseUrl).href;
        links.push(absoluteUrl);
      } catch {
        // Skip invalid URLs
      }
    });

    // Remove duplicates
    return [...new Set(links)];
  }

  // Utility method to clean and normalize text content
  static cleanText(text: string): string {
    return text
      .replace(/\s+/g, " ")
      .replace(/\n\s*\n/g, "\n")
      .trim();
  }

  // Fallback document parser when jsdom is not available (e.g., in serverless)
  private createFallbackDocument(html: string): any {
    // Create a minimal document-like object with basic querySelector functionality
    return {
      querySelector: (selector: string) => {
        // Simple regex-based extraction for common selectors
        if (selector === "title") {
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          return titleMatch ? { textContent: titleMatch[1].trim() } : null;
        }
        if (selector === "h1") {
          const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
          return h1Match ? { textContent: h1Match[1].trim() } : null;
        }
        // For other selectors, return null (will use body fallback)
        return null;
      },
      querySelectorAll: (selector: string) => {
        if (selector === "a[href]") {
          const linkMatches = html.matchAll(
            /<a[^>]+href=["']([^"']+)["'][^>]*>/gi
          );
          const links: any[] = [];
          for (const match of linkMatches) {
            links.push({
              getAttribute: (attr: string) =>
                attr === "href" ? match[1] : null,
            });
          }
          return links;
        }
        // For script/style removal, return empty array
        if (
          selector.includes("script") ||
          selector.includes("style") ||
          selector.includes("nav") ||
          selector.includes("header") ||
          selector.includes("footer") ||
          selector.includes("aside")
        ) {
          return [];
        }
        // For content selectors, return empty (will use body fallback)
        return [];
      },
      body: {
        textContent: this.extractTextFromHTML(html),
      },
    };
  }

  // Extract text content from HTML using regex (fallback when jsdom fails)
  private extractTextFromHTML(html: string): string {
    // Remove script and style tags
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "");

    // Try to extract main content areas first
    const mainContentMatch =
      text.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
      text.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
      text.match(
        /<div[^>]*class=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
      );

    if (mainContentMatch) {
      text = mainContentMatch[1];
    }

    // Remove all HTML tags
    text = text.replace(/<[^>]+>/g, " ");

    // Decode HTML entities (basic)
    text = text
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    // Clean up whitespace
    text = text
      .replace(/\s+/g, " ")
      .replace(/\n\s*\n/g, "\n")
      .trim();

    return text;
  }

  // Utility method to extract domain from URL
  static getDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return "";
    }
  }
}
