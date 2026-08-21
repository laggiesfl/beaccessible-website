export function createFetchHandler(legacyHandler) {
  return async function fetchHandler(request) {
    const url = new URL(request.url);
    const result = await legacyHandler({
      httpMethod: request.method,
      rawUrl: request.url,
      headers: Object.fromEntries(request.headers),
      queryStringParameters: Object.fromEntries(url.searchParams),
      body: request.method === 'GET' || request.method === 'HEAD' ? '' : await request.text()
    });
    return new Response(result.body, {
      status: result.statusCode,
      headers: result.headers
    });
  };
}
