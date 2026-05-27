import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface RequestContext {
  buildId: string;
  cookies: string;
}

// Step 1: Extract Build ID & Cookies Dynamically from target exam page HTML
async function getLatestContext(
  examId: string,
  userAgent: string,
  acceptLanguage: string,
  secChUa: string
): Promise<RequestContext> {
  const defaultBuildId = 'QiDTbVSEG1GkJmPgSMTIr';
  try {
    const landingUrl = `https://www.examprepper.co/exam/${examId}/1`;
    console.log(`[Exam Proxy] getLatestContext: Fetching ${landingUrl} to establish session...`);
    
    const res = await fetch(landingUrl, {
      method: "GET",
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': acceptLanguage,
        'Sec-Ch-Ua': secChUa,
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none'
      },
      redirect: "follow",
      cache: "no-store"
    });

    const html = await res.text();
    let buildId = defaultBuildId;

    // Use a regex to extract the buildId inside <script id="__NEXT_DATA__"> or page source
    const buildIdMatch = html.match(/"buildId"\s*:\s*"([^"]+)"/);
    if (buildIdMatch && buildIdMatch[1]) {
      buildId = buildIdMatch[1];
      console.log("[Exam Proxy] getLatestContext: Extracted Build ID dynamically:", buildId);
    } else {
      console.log("[Exam Proxy] getLatestContext: Could not extract Build ID, using fallback:", buildId);
    }

    // Capture set-cookie headers
    const setCookieHeaders = typeof res.headers.getSetCookie === 'function'
      ? res.headers.getSetCookie()
      : [];

    let extractedCookies = '';
    if (setCookieHeaders.length > 0) {
      extractedCookies = setCookieHeaders.map(c => c.split(';')[0]).join('; ');
      console.log("[Exam Proxy] getLatestContext: Extracted cookies:", extractedCookies);
    } else {
      const legacySetCookie = res.headers.get('set-cookie');
      if (legacySetCookie) {
        extractedCookies = legacySetCookie.split(';')[0];
        console.log("[Exam Proxy] getLatestContext: Extracted legacy cookies:", extractedCookies);
      }
    }

    return { buildId, cookies: extractedCookies };
  } catch (error) {
    console.error("[Exam Proxy] getLatestContext: Error encountered during context extraction:", error);
    return { buildId: defaultBuildId, cookies: '' };
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ examId: string; page: string }> }
) {
  let examId = '';
  let page = '';

  try {
    const resolvedParams = await params;
    examId = resolvedParams.examId;
    page = resolvedParams.page;

    if (!examId || !page) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Obtain browser headers
    const h = await headers();
    const rawCookie =
      h.get("cookie") ||
      request.headers.get("cookie") ||
      "";

    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
    const acceptLanguage = 'en-US,en;q=0.9';
    const secChUa = '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"';

    // Step 1: Get dynamic session contexts
    const context = await getLatestContext(examId, userAgent, acceptLanguage, secChUa);

    // Step 2: Merge client request cookies, env cookie, and dynamically extracted cookies
    const envCookie = process.env.EXAM_COOKIE || "";
    let combinedCookie = envCookie || rawCookie;
    
    if (context.cookies) {
      combinedCookie = combinedCookie ? `${combinedCookie}; ${context.cookies}` : context.cookies;
    }

    const forwardedHeaders: Record<string, string> = {
      'User-Agent': userAgent,
      'Accept': '*/*',
      'Accept-Language': acceptLanguage,
      'Referer': 'https://www.examprepper.co/',
      'X-Nextjs-Data': '1',
      'Sec-Ch-Ua': secChUa,
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'Priority': 'u=1, i'
    };

    if (combinedCookie) {
      forwardedHeaders['cookie'] = combinedCookie;
    }

    const remoteUrl = `https://www.examprepper.co/_next/data/${context.buildId}/exam/${examId}/${page}.json?id=${examId}&page=${page}`;
    console.log("[Exam Proxy] Target URL:", remoteUrl);
    console.log("[Exam Proxy] Combined Cookie length:", combinedCookie.length);
    console.log("[Exam Proxy] Using Environment Cookie:", !!envCookie);

    const maxRetries = 2;
    let attempt = 0;
    let res: Response | null = null;
    let success = false;

    while (attempt <= maxRetries && !success) {
      if (attempt > 0) {
        console.log(`[Exam Proxy] Retry ${attempt} (429 backoff) for exam ${examId} page ${page}...`);
      }

      try {
        res = await fetch(remoteUrl, {
          method: "GET",
          headers: forwardedHeaders,
          redirect: "follow",
          cache: "no-store"
        });

        console.log("[Exam Proxy] Status:", res.status);

        if (res.ok) {
          success = true;
        } else if (res.status === 429 && attempt < maxRetries) {
          const backoffTime = 500 * Math.pow(2, attempt);
          await delay(backoffTime);
        } else {
          break;
        }
      } catch (err) {
        console.log(`[Exam Proxy] Fetch error on attempt ${attempt + 1}:`, err);
        if (attempt >= maxRetries) {
          throw err;
        }
      }

      if (!success) {
        attempt++;
      }
    }

    if (res) {
      const contentType = res.headers.get('content-type') || '';
      console.log("[Exam Proxy] Content-Type:", contentType);

      const text = await res.text();
      
      if (!res.ok) {
        console.error("[Exam Proxy] Failed Response Body:", text);
      } else {
        console.log("[Exam Proxy] Body (first 300 chars):", text.slice(0, 300));
      }

      if (contentType.includes('text/html')) {
        return NextResponse.json({
          error: "Source blocked request or security checkpoint",
          status: res.status,
          preview: text.slice(0, 300)
        }, { status: res.status });
      }

      if (success) {
        console.log(`[Exam Proxy] Success for exam ${examId} page ${page}`);
        const data = JSON.parse(text);
        return NextResponse.json(data);
      }

      return NextResponse.json({
        error: "Remote fetch failed",
        status: res.status,
        body: text.slice(0, 300)
      }, { status: res.status });
    }

    return NextResponse.json({ error: "Remote fetch failed" }, { status: 500 });
  } catch (error: any) {
    console.log(`[Exam Proxy] Failed with fatal exception for exam ${examId} page ${page}:`, error);
    return NextResponse.json(
      { error: "Remote fetch failed", message: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
