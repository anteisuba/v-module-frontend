// lib/api/index.ts

export { apiClient, ApiClient } from "./client";
export { ApiError, NetworkError, parseApiError } from "./errors";
export * from "./types";
export { userApi, pageApi, newsApi, newsArticleApi } from "./endpoints";

