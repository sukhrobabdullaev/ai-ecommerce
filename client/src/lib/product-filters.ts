import { Product, SearchFilters } from "@/types";

/**
 * AI-optimized product filtering utilities
 * Designed to work efficiently with LLM-based search and traditional filters
 */

/**
 * Main filtering function that combines all filter criteria
 */
export function filterProducts(
  products: Product[],
  filters: SearchFilters
): Product[] {
  let filtered = [...products];

  // Text search (query) - AI-friendly keyword matching
  if (filters.query && filters.query.trim()) {
    filtered = filterByQuery(filtered, filters.query);
  }

  // Category filter
  if (filters.category) {
    filtered = filtered.filter(
      (p) => p.category.toLowerCase() === filters.category?.toLowerCase()
    );
  }

  // Brand filter
  if (filters.brand) {
    filtered = filtered.filter(
      (p) => p.brand?.toLowerCase() === filters.brand?.toLowerCase()
    );
  }

  // Price range filter
  if (filters.priceRange) {
    filtered = filtered.filter(
      (p) =>
        p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
    );
  }

  // Tags filter (any tag match)
  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter((p) =>
      p.tags.some((tag) =>
        filters.tags?.some(
          (filterTag) => filterTag.toLowerCase() === tag.toLowerCase()
        )
      )
    );
  }

  // Stock filter
  if (filters.inStock) {
    filtered = filtered.filter((p) => (p.stock ?? 0) > 0);
  }

  // Rating filter (placeholder - you can add rating to Product model)
  if (filters.rating) {
    // TODO: Implement when rating is added to Product model
    // filtered = filtered.filter(p => (p.rating ?? 0) >= filters.rating!);
  }

  // Sort results
  filtered = sortProducts(filtered, filters.sortBy);

  return filtered;
}

/**
 * AI-optimized text search across multiple product fields
 * Searches: name, description, brand, category, tags
 */
export function filterByQuery(products: Product[], query: string): Product[] {
  const normalizedQuery = query.toLowerCase().trim();
  const queryTokens = normalizedQuery.split(/\s+/);

  return products.filter((product) => {
    // Create searchable text combining all relevant fields
    const searchableText = [
      product.name,
      product.description,
      product.brand,
      product.category,
      ...product.tags,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    // Match if ANY query token is found in searchable text
    // This makes it more AI-friendly for natural language queries
    return queryTokens.some((token) => searchableText.includes(token));
  });
}

/**
 * Sort products based on selected criteria
 */
export function sortProducts(
  products: Product[],
  sortBy: SearchFilters["sortBy"]
): Product[] {
  const sorted = [...products];

  switch (sortBy) {
    case "price-low":
      return sorted.sort((a, b) => a.price - b.price);

    case "price-high":
      return sorted.sort((a, b) => b.price - a.price);

    case "newest":
      return sorted.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );

    case "rating":
      // TODO: Implement when rating is added to Product model
      // return sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      return sorted;

    case "relevance":
    default:
      // Keep original order for relevance (can be enhanced with AI scoring)
      return sorted;
  }
}

/**
 * Get filter suggestions based on current products
 * Useful for AI to suggest relevant filters
 */
export function getFilterSuggestions(products: Product[]) {
  const categories = Array.from(new Set(products.map((p) => p.category)));
  const brands = Array.from(
    new Set(products.map((p) => p.brand).filter(Boolean))
  );
  const tags = Array.from(new Set(products.flatMap((p) => p.tags)));

  const prices = products.map((p) => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return {
    categories,
    brands,
    tags,
    priceRange: [minPrice, maxPrice] as [number, number],
  };
}

/**
 * Calculate relevance score for AI-powered ranking
 * Higher score = more relevant to query
 */
export function calculateRelevanceScore(
  product: Product,
  query: string
): number {
  if (!query.trim()) return 0;

  const normalizedQuery = query.toLowerCase();
  let score = 0;

  // Exact name match: +50 points
  if (product.name.toLowerCase() === normalizedQuery) {
    score += 50;
  }
  // Name contains query: +30 points
  else if (product.name.toLowerCase().includes(normalizedQuery)) {
    score += 30;
  }

  // Category match: +20 points
  if (product.category.toLowerCase().includes(normalizedQuery)) {
    score += 20;
  }

  // Brand match: +15 points
  if (product.brand?.toLowerCase().includes(normalizedQuery)) {
    score += 15;
  }

  // Tag matches: +10 points each
  product.tags.forEach((tag) => {
    if (tag.toLowerCase().includes(normalizedQuery)) {
      score += 10;
    }
  });

  // Description match: +5 points
  if (product.description.toLowerCase().includes(normalizedQuery)) {
    score += 5;
  }

  return score;
}

/**
 * AI-friendly function to rank products by multiple criteria
 */
export function rankProducts(
  products: Product[],
  query?: string,
  userPreferences?: {
    preferredBrands?: string[];
    preferredCategories?: string[];
    priceRange?: [number, number];
  }
): Product[] {
  return products
    .map((product) => {
      let score = 0;

      // Query relevance
      if (query) {
        score += calculateRelevanceScore(product, query);
      }

      // User preference: brand
      if (userPreferences?.preferredBrands?.includes(product.brand || "")) {
        score += 25;
      }

      // User preference: category
      if (userPreferences?.preferredCategories?.includes(product.category)) {
        score += 20;
      }

      // Price preference (closer to preferred range = higher score)
      if (userPreferences?.priceRange) {
        const [minPref, maxPref] = userPreferences.priceRange;
        if (product.price >= minPref && product.price <= maxPref) {
          score += 15;
        }
      }

      // Stock availability bonus
      if ((product.stock ?? 0) > 0) {
        score += 5;
      }

      return { product, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.product);
}
