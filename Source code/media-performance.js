// ═══════════════════════════════════════════════════════════════
// SIRIUS — Image delivery and cache planning
//
// These functions describe the browser-side decisions without performing a
// request. The production image migration/compression pipeline stays private;
// this public module exposes only safe, reusable planning logic.
// ═══════════════════════════════════════════════════════════════
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.MediaPerformance = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const DEFAULT_WIDTHS = [320, 640, 960, 1280, 1440];

  function positive(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : fallback;
  }

  function normalizeAsset(asset) {
    const source = String(asset?.src ?? asset?.imageUrl ?? "").trim();
    if (!source) return null;
    return {
      src: source,
      alt: String(asset?.alt ?? asset?.altText ?? "").trim(),
      width: positive(asset?.width),
      height: positive(asset?.height),
      variants: Array.isArray(asset?.variants) ? asset.variants : [],
    };
  }

  function chooseVariant(asset, displayWidth, devicePixelRatio = 1) {
    const normalized = normalizeAsset(asset);
    if (!normalized) return null;
    const target = positive(displayWidth, normalized.width || 1) * Math.max(1, positive(devicePixelRatio, 1));
    const variants = normalized.variants
      .map((variant) => ({
        src: String(variant?.src || "").trim(),
        width: positive(variant?.width),
        height: positive(variant?.height),
      }))
      .filter((variant) => variant.src && variant.width)
      .sort((left, right) => left.width - right.width);
    return variants.find((variant) => variant.width >= target)
      || variants[variants.length - 1]
      || { src: normalized.src, width: normalized.width, height: normalized.height };
  }

  function buildSrcSet(asset) {
    const normalized = normalizeAsset(asset);
    if (!normalized) return "";
    return normalized.variants
      .map((variant) => ({ src: String(variant?.src || "").trim(), width: positive(variant?.width) }))
      .filter((variant) => variant.src && variant.width)
      .sort((left, right) => left.width - right.width)
      .map((variant) => `${variant.src} ${variant.width}w`)
      .join(", ");
  }

  // Returns safe <img>-style properties. The caller still decides whether to
  // set them on the DOM; this module never creates an element or fetches a URL.
  function imageProps(asset, options = {}) {
    const normalized = normalizeAsset(asset);
    if (!normalized) return null;
    const displayWidth = positive(options.displayWidth, normalized.width || 320);
    const selected = chooseVariant(normalized, displayWidth, options.devicePixelRatio);
    return {
      src: selected.src,
      srcset: buildSrcSet(normalized),
      sizes: options.sizes || `${Math.ceil(displayWidth)}px`,
      width: selected.width || normalized.width || undefined,
      height: selected.height || normalized.height || undefined,
      alt: normalized.alt,
      loading: options.priority ? "eager" : "lazy",
      decoding: "async",
      fetchPriority: options.priority ? "high" : "low",
      referrerPolicy: "no-referrer",
    };
  }

  // Compression is planned before storage, not repeatedly in the browser for
  // every student. The server can choose the best supported encoder and fall
  // back to the original only when conversion would be unsafe or too costly.
  function compressionProfile(kind = "question") {
    if (kind === "screenshot") return { format: "webp", quality: 78, maxDimension: 1600 };
    if (kind === "illustration") return { format: "webp", quality: 84, maxDimension: 1440 };
    return { format: "webp", quality: 82, maxDimension: 1440 };
  }

  function uniqueUpcomingImages(images, currentIndex = 0, ahead = 5) {
    const list = Array.isArray(images) ? images : [];
    const result = [];
    const seen = new Set();
    const add = (value) => {
      const url = String(value || "").trim();
      if (!url || seen.has(url)) return;
      seen.add(url);
      result.push(url);
    };
    add(list[currentIndex]);
    for (let index = currentIndex + 1; index < list.length && result.length < ahead + 1; index += 1) add(list[index]);
    return result;
  }

  function cachePolicy({ contentHashed = false, offline = false, userSpecific = false } = {}) {
    if (userSpecific) return { mode: "no-store", reason: "user-specific data must not enter the static asset cache" };
    if (offline) return { mode: "offline-cache", reason: "explicitly downloaded local image package" };
    if (contentHashed) return { mode: "cache-first", reason: "immutable asset name can be cached safely" };
    return { mode: "stale-while-revalidate", reason: "refreshable aggregate or versioned metadata" };
  }

  return {
    DEFAULT_WIDTHS,
    normalizeAsset,
    chooseVariant,
    buildSrcSet,
    imageProps,
    compressionProfile,
    uniqueUpcomingImages,
    cachePolicy,
  };
});
