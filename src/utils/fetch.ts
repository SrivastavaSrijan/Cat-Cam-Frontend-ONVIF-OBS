export const fetchWrapper = async (
  url: string,
  method: "GET" | "POST" = "GET",
  body?: any,
  successCallback?: (response: any) => void,
  errorCallback?: (error: any) => void
): Promise<void> => {
  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });

    const result = await response.json();

    if (response.ok) {
      if (successCallback) successCallback(result);
      console.log("Success:", result.message || "Operation successful!");
    } else {
      if (errorCallback) errorCallback(result);
      console.error("Error:", result.error || "An error occurred!");
    }
  } catch (error: any) {
    console.error("Fetch error:", error.message);
    if (errorCallback) errorCallback(error);
  }
};
