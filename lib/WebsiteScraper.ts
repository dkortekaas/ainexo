import { JSDOM } from "jsdom";

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
      const dom = new JSDOM(html);
      const document = dom.window.document;

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

  private extractContent(document: Document): string {
    // Remove script and style elements
    const scripts = document.querySelectorAll(
      "script, style, nav, header, footer, aside"
    );
    scripts.forEach((el) => el.remove());

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

    let contentElement: Element | null = null;
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

  private extractLinks(document: Document, baseUrl: string): string[] {
    const links: string[] = [];
    const linkElements = document.querySelectorAll("a[href]");

    linkElements.forEach((link) => {
      const href = link.getAttribute("href");
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

  // Utility method to extract domain from URL
  static getDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return "";
    }
  }
}
