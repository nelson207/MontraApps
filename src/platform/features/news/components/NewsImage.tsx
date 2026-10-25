import { useEffect, useRef, useState } from "react";
import { useGetNewsImageQuery } from "../api/newsApi";
import { cachedNewsImage } from "../api/newsImageCache";
import { categoryIcon, type NewsItem } from "../newsModel";

type Props = {
  item: Pick<NewsItem, "id" | "image" | "category">;
  className?: string;
};

/** Becomes true once `ref` is on screen (always true where IntersectionObserver doesn't exist) */
function useSeen<T extends Element>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === "undefined");
  useEffect(() => {
    const element = ref.current;
    if (seen || !element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setSeen(true);
      },
      { rootMargin: "200px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [seen]);
  return [ref, seen] as const;
}

// News picture, or a placeholder in the theme colors with the category icon when the news has
// none (404) or it can't be shown. Fills its container (object-fit: cover).
// API pictures need the bearer token: they're loaded (once on screen) through the API client
// into the session cache, and shown through an object URL this component creates and revokes
// (on unmount or when it shows another news). Sample news link their picture directly.
function NewsImage({ item, className = "" }: Props) {
  const [placeholderRef, seen] = useSeen<HTMLDivElement>();
  const direct = item.image;
  // Cached for the session: no refetch on mount, so a 404 is never asked again
  // currentData: only this news's answer (data would keep the previous news' while loading)
  const { currentData: hasImage } = useGetNewsImageQuery(item.id, {
    skip: !!direct || !seen,
    refetchOnMountOrArgChange: false,
  });
  const imgRef = useRef<HTMLImageElement>(null);
  // Remember which picture failed to display, so moving to another news retries
  const [failed, setFailed] = useState<string | number | null>(null);
  const key = direct ?? item.id;

  useEffect(() => {
    if (direct || !hasImage) return;
    const blob = cachedNewsImage(item.id);
    const img = imgRef.current;
    if (!blob || !img) return;
    const url = URL.createObjectURL(blob);
    img.src = url;
    return () => {
      img.removeAttribute("src");
      URL.revokeObjectURL(url);
    };
  }, [item.id, direct, hasImage]);

  if ((!direct && !hasImage) || failed === key) {
    return (
      <div ref={placeholderRef} className={`app-news-image app-news-image-fallback ${className}`} aria-hidden="true">
        <i className={`bi ${categoryIcon(item.category)}`} />
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={direct ?? undefined}
      alt=""
      loading="lazy"
      className={`app-news-image ${className}`}
      onError={() => setFailed(key)}
    />
  );
}

export default NewsImage;
