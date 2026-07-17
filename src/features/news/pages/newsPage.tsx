import { useEffect, type JSX } from "react";
import { useNews } from "../hooks/useNews";
import NewsComponent from "../components/newsComponents";
import NewsSearch from "../components/newsSearch";
import { useParams } from "react-router-dom";

export default function NewsPage(): JSX.Element {
  const news = useNews();
  const { id } = useParams();

  useEffect(() => {
    if (!id) {
      news.setSelectedNews(null);
      return;
    }

    const selected = news.newsList.find((item) => item.id === Number(id));

    if (selected) {
      news.setSelectedNews(selected);
    }
  }, [id, news.newsList]);

  useEffect(() => {
    if (news.newsListData) {
      news.setNewsList(news.newsListData);
    }
  }, [news.newsListData]);

  return (
    <div>
      {news.selectedNews ? (
        <NewsComponent {...news} />
      ) : (
        <NewsSearch {...news} />
      )}
    </div>
  );
}
