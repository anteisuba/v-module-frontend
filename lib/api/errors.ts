// lib/api/errors.ts

/**
 * API 错误类
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * 网络错误类
 */
export class NetworkError extends Error {
  constructor(message: string = "网络错误，请稍后再试") {
    super(message);
    this.name = "NetworkError";
  }
}

/**
 * 解析 API 错误响应
 */
export function parseApiError(
  response: Response,
  data: unknown
): ApiError {
  const errorData = data as {
    error?: string;
    message?: string;
    code?: string;
    details?: unknown;
  };

  const message =
    errorData.error || errorData.message || `请求失败 (${response.status})`;
  const status = response.status;

  // 根据状态码返回不同的错误消息
  if (status === 401) {
    return new ApiError("未授权，请先登录", status, "UNAUTHORIZED", errorData.details);
  } else if (status === 403) {
    return new ApiError("无权限访问", status, "FORBIDDEN", errorData.details);
  } else if (status === 404) {
    return new ApiError("资源未找到", status, "NOT_FOUND", errorData.details);
  } else if (status === 400) {
    return new ApiError(message, status, "BAD_REQUEST", errorData.details);
  } else if (status >= 500) {
    return new ApiError("服务器错误，请稍后再试", status, "SERVER_ERROR", errorData.details);
  }

  return new ApiError(message, status, errorData.code, errorData.details);
}

