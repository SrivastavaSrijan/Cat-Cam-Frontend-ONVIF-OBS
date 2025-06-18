export interface FetchOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export const fetchWrapper = async (
  url: string,
  method: "GET" | "POST" = "GET",
  body?: any,
  successCallback?: (response: any) => void,
  errorCallback?: (error: any) => void,
  options: FetchOptions = {}
): Promise<void> => {
  const { timeout = 10000, retries = 1, retryDelay = 1000 } = options;

  const executeRequest = async (attempt: number): Promise<void> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (successCallback) {
        successCallback(result);
      }
      console.log(
        "Success:",
        result.message || result.success || "Operation successful!"
      );
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (attempt < retries) {
        console.warn(
          `Request failed (attempt ${attempt}/${retries}), retrying...`
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        return executeRequest(attempt + 1);
      }

      console.error("Fetch error:", error.message);
      if (errorCallback) {
        errorCallback(error);
      }
    }
  };

  return executeRequest(1);
};
