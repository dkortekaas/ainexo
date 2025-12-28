import Link from "next/link";
import {
  MessageSquare,
  Twitter,
  Linkedin,
  Github,
  Facebook,
  Instagram,
  Youtube,
} from "lucide-react";
import {
  getSocialMedia,
  getFooterProductMenu,
  getFooterCompanyMenu,
  getFooterResourcesMenu,
  getFooterLegalMenu,
  getSiteSettings,
  type MainMenu,
  type SocialMedia,
} from "@/sanity/lib/fetch";
import Image from "next/image";
import Logo from "@/public/ainexo-logo.png";

// Helper function to ensure href has locale prefix
function getLocalizedHref(href: string, locale: string): string {
  // If href is external (starts with http:// or https://), return as is
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return href;
  }

  // If href already starts with a locale, return as is
  if (/^\/(nl|en|de|fr|es)(\/|$)/.test(href)) {
    return href;
  }

  // If href is just "/", return "/{locale}"
  if (href === "/") {
    return `/${locale}`;
  }

  // Otherwise, prefix with locale
  return `/${locale}${href.startsWith("/") ? href : `/${href}`}`;
}

// Icon mapping for social media
const socialIconMap = {
  twitter: Twitter,
  linkedin: Linkedin,
  github: Github,
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
};

// Default fallback links
const defaultFooterLinks = {
  product: [
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "Integrations", href: "#" },
    { name: "Changelog", href: "#" },
  ],
  company: [
    { name: "About", href: "#" },
    { name: "Blog", href: "#" },
    { name: "Careers", href: "#" },
    { name: "Contact", href: "#" },
  ],
  resources: [
    { name: "Documentation", href: "#" },
    { name: "Help Center", href: "#" },
    { name: "API Reference", href: "#" },
    { name: "Status", href: "#" },
  ],
  legal: [
    { name: "Privacy Policy", href: "#" },
    { name: "Terms of Service", href: "#" },
    { name: "Cookie Policy", href: "#" },
    { name: "GDPR", href: "#" },
  ],
};

const defaultSocialMedia = [
  { platform: "twitter", url: "#" },
  { platform: "linkedin", url: "#" },
  { platform: "github", url: "#" },
];

export const Footer = async ({ locale }: { locale: string }) => {
  let footerLinks = defaultFooterLinks;
  let socialMedia: Array<{ platform: string; url: string }> =
    defaultSocialMedia;
  let siteDescription =
    "Build AI chatbots that deliver the most accurate answers. Set up in 5 minutes, no coding required.";
  let footerTagline = "Made with ♥ for better customer experiences";

  try {
    const [
      productMenu,
      companyMenu,
      resourcesMenu,
      legalMenu,
      socialData,
      settings,
    ] = await Promise.all([
      getFooterProductMenu(locale),
      getFooterCompanyMenu(locale),
      getFooterResourcesMenu(locale),
      getFooterLegalMenu(locale),
      getSocialMedia(),
      getSiteSettings(locale),
    ]);

    if (productMenu && productMenu.length > 0) {
      footerLinks.product = productMenu.map((item: MainMenu) => ({
        name: item.name,
        href: item.href,
      }));
    }

    if (companyMenu && companyMenu.length > 0) {
      footerLinks.company = companyMenu.map((item: MainMenu) => ({
        name: item.name,
        href: item.href,
      }));
    }

    if (resourcesMenu && resourcesMenu.length > 0) {
      footerLinks.resources = resourcesMenu.map((item: MainMenu) => ({
        name: item.name,
        href: item.href,
      }));
    }

    if (legalMenu && legalMenu.length > 0) {
      footerLinks.legal = legalMenu.map((item: MainMenu) => ({
        name: item.name,
        href: item.href,
      }));
    }

    if (socialData && socialData.length > 0) {
      socialMedia = socialData.map((item: SocialMedia) => ({
        platform: item.platform,
        url: item.url,
      }));
    }

    if (settings) {
      if (settings.description) siteDescription = settings.description;
      if (settings.footerTagline) footerTagline = settings.footerTagline;
    }
  } catch (error) {
    console.error("Error fetching footer data from Sanity:", error);
    // Fall back to default data
  }

  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link
              href={getLocalizedHref("/", locale)}
              className="flex items-center gap-2 mb-4"
            >
              <Image src={Logo} alt="Ainexo" width={36} height={36} />
              <span className="font-display text-xl font-bold text-foreground">
                Ainexo
              </span>
            </Link>
            <p className="text-muted-foreground max-w-xs mb-6">
              {siteDescription}
            </p>
            <div className="flex gap-4">
              {socialMedia.map((social, index) => {
                const Icon =
                  socialIconMap[
                    social.platform as keyof typeof socialIconMap
                  ] || MessageSquare;
                return (
                  <Link
                    key={index}
                    href={social.url}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon className="w-5 h-5" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={getLocalizedHref(link.href, locale)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={getLocalizedHref(link.href, locale)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    href={getLocalizedHref(link.href, locale)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={getLocalizedHref(link.href, locale)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Ainexo. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">{footerTagline}</p>
        </div>
      </div>
    </footer>

    // <footer className="border-t bg-background">
    //   <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
    //     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
    //       <div className="space-y-3 sm:space-y-4 sm:col-span-2 lg:col-span-1">
    //         <Image
    //           src={config.appLogo}
    //           alt={config.appTitle}
    //           className="h-20 sm:h-28 w-auto object-contain"
    //           width={100}
    //           height={100}
    //           sizes="(max-width: 640px) 80px, 112px"
    //           loading="lazy"
    //         />
    //         <p className="text-sm text-muted-foreground max-w-xs">
    //           {t("description")}
    //         </p>
    //       </div>

    //       <div>
    //         <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base text-foreground">
    //           {t("product")}
    //         </h4>
    //         <ul className="space-y-2 text-sm">
    //           <li>
    //             <Link
    //               href={`/${locale}/features`}
    //               className="text-muted-foreground hover:text-primary transition-colors"
    //             >
    //               {t("features")}
    //             </Link>
    //           </li>
    //           <li>
    //             <Link
    //               href={`/${locale}/pricing`}
    //               className="text-muted-foreground hover:text-primary transition-colors"
    //             >
    //               {t("pricing")}
    //             </Link>
    //           </li>
    //           {/* <li>
    //             <Link
    //               href={`/${locale}/documentation`}
    //               className="text-muted-foreground hover:text-primary transition-colors"
    //             >
    //               {t("documentation")}
    //             </Link>
    //           </li> */}
    //         </ul>
    //       </div>

    //       <div>
    //         <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base text-foreground">
    //           {t("company")}
    //         </h4>
    //         <ul className="space-y-2 text-sm">
    //           <li>
    //             <Link
    //               href={`/${locale}/about-us`}
    //               className="text-muted-foreground hover:text-primary transition-colors"
    //             >
    //               {t("aboutUs")}
    //             </Link>
    //           </li>
    //           {/* <li>
    //             <Link
    //               href={`/${locale}/blog`}
    //               className="text-muted-foreground hover:text-primary transition-colors"
    //             >
    //               {t("blog")}
    //             </Link>
    //           </li> */}
    //           <li>
    //             <Link
    //               href={`/${locale}/contact`}
    //               className="text-muted-foreground hover:text-primary transition-colors"
    //             >
    //               {t("contact")}
    //             </Link>
    //           </li>
    //         </ul>
    //       </div>

    //       <div>
    //         <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base text-foreground">
    //           {t("legal")}
    //         </h4>
    //         <ul className="space-y-2 text-sm">
    //           <li>
    //             <Link
    //               href={`/${locale}/privacy-policy`}
    //               className="text-muted-foreground hover:text-primary transition-colors"
    //             >
    //               {t("privacyPolicy")}
    //             </Link>
    //           </li>
    //           <li>
    //             <Link
    //               href={`/${locale}/terms-of-service`}
    //               className="text-muted-foreground hover:text-primary transition-colors"
    //             >
    //               {t("termsOfService")}
    //             </Link>
    //           </li>
    //         </ul>
    //       </div>
    //     </div>

    //     <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t text-center text-xs sm:text-sm text-muted-foreground">
    //       <p>
    //         © {currentYear} {config.appTitle}. {t("allRightsReserved")}
    //       </p>
    //     </div>
    //   </div>
    // </footer>
  );
};

export default Footer;
