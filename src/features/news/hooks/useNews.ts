import { useState } from "react";
import {
  useGetApiEntitiesGetNewsQuery,
  type AplCompanyNewsDto,
} from "../../../services/api/generated/MontraPOSApi";

export function useNews() {
  const [selectedNews, setSelectedNews] = useState<AplCompanyNewsDto | null>(
    null,
  );
  const [newsList, setNewsList] = useState<AplCompanyNewsDto[]>([]);

  const {
    data: newsListData,
    isLoading: newsListLoading,
    error: newsListError,
  } = useGetApiEntitiesGetNewsQuery();

  return {
    selectedNews,
    setSelectedNews,
    newsList,
    setNewsList,
    newsListData,
    newsListLoading,
    newsListError,
  };
}
