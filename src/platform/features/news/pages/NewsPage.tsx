import NewsSearch from "../components/NewsSearch";

// /news: the news archive (search). Full articles live at /news/:id (NewsArticlePage).
export default function NewsPage() {
  return (
    <div className="app-page">
      <NewsSearch />
    </div>
  );
}
