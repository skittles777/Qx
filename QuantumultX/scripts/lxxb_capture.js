/**
 * 灵犀晓伴 App 抓包脚本 (QuantumultX)
 * 
 * 一个脚本处理三种 QX 调用场景：
 *   script-request-header  → $request 有 url/method/headers，$response 无
 *   script-request-body    → $request 有 url/body，$response 无
 *   script-response-body   → $response 有 url/status/headers/body，$request 可能无
 *
 * QX 调用时，根据 $request / $response 是否存在来判断当前场景。
 */

// ============ 配置 ============
const PRINT_FULL_HEADERS = true;
const PRINT_REQUEST_BODY = true;
const PRINT_RESPONSE_BODY = true;
const MAX_BODY_LENGTH = 5000;
const IGNORE_KEYWORDS = [
    ".js", ".css", ".png", ".jpg", ".jpeg", ".gif",
    ".ico", ".woff", ".ttf", ".svg", ".webp",
    "favicon", "static/", "cdn-",
    "google-analytics", "umeng", "tracking",
    "log.", "monitor", "stats"
];
// ============================

function shouldIgnore(url) {
    if (!url) return true;
    var lower = url.toLowerCase();
    for (var i = 0; i < IGNORE_KEYWORDS.length; i++) {
        if (lower.indexOf(IGNORE_KEYWORDS[i]) !== -1) return true;
    }
    return false;
}

function tryFormatJson(str) {
    try {
        return JSON.stringify(JSON.parse(str), null, 2);
    } catch (e) {
        return str;
    }
}

function truncate(str, maxLen) {
    if (!str) return "(空)";
    if (str.length <= maxLen) return str;
    return str.substring(0, maxLen) + "\n... [截断 总长度" + str.length + "]";
}

function sep(char, n) {
    var s = "";
    for (var i = 0; i < n; i++) s += char;
    return s;
}

// ============ 请求头场景 ============
function handleRequestHeader(req) {
    var url = req.url || "(unknown)";
    if (shouldIgnore(url)) { $done({}); return; }

    var method = req.method || "(unknown)";
    var headers = req.headers || {};

    console.log("\n" + sep("=", 70));
    console.log(">> [REQ-H] " + method + " " + url);
    console.log(sep("-", 70));

    // 关键认证字段
    var auth = headers["Authorization"] || headers["authorization"] || "";
    var cookie = headers["Cookie"] || headers["cookie"] || "";
    var token = headers["token"] || headers["Token"] || headers["x-token"] || headers["X-Token"] || "";
    var ua = headers["User-Agent"] || headers["user-agent"] || "";
    var ct = headers["Content-Type"] || headers["content-type"] || "";

    if (auth)   console.log("  Authorization: " + auth);
    if (cookie) console.log("  Cookie: " + cookie);
    if (token)  console.log("  Token: " + token);
    if (ua)     console.log("  UA: " + ua);
    if (ct)     console.log("  CT: " + ct);

    if (PRINT_FULL_HEADERS) {
        console.log("  -- Headers --");
        var keys = Object.keys(headers);
        for (var i = 0; i < keys.length; i++) {
            console.log("  " + keys[i] + ": " + headers[keys[i]]);
        }
    }

    if (PRINT_REQUEST_BODY && req.body) {
        console.log("  -- Body --");
        console.log(truncate(tryFormatJson(req.body), MAX_BODY_LENGTH));
    }

    console.log(sep("=", 70));
    $done({});
}

// ============ 请求体场景 ============
function handleRequestBody(req) {
    var url = req.url || "(unknown)";
    if (shouldIgnore(url)) { $done({}); return; }

    if (req.body) {
        console.log("\n" + sep("=", 70));
        console.log(">> [REQ-B] " + url);
        console.log(sep("-", 70));
        console.log(truncate(tryFormatJson(req.body), MAX_BODY_LENGTH));
        console.log(sep("=", 70));
    }
    $done({});
}

// ============ 响应体场景 ============
function handleResponse(resp) {
    var url = resp.url || "(unknown)";
    if (shouldIgnore(url)) { $done({}); return; }

    var status = resp.status || "(unknown)";
    var headers = resp.headers || {};

    console.log("\n" + sep("~", 70));
    console.log("<< [RESP] " + status + " " + url);
    console.log(sep("-", 70));

    var setCookie = headers["Set-Cookie"] || headers["set-cookie"] || "";
    var ct = headers["Content-Type"] || headers["content-type"] || "";
    if (setCookie) console.log("  Set-Cookie: " + setCookie);
    if (ct) console.log("  CT: " + ct);

    if (PRINT_RESPONSE_BODY && resp.body) {
        console.log("  -- Body --");
        console.log(truncate(tryFormatJson(resp.body), MAX_BODY_LENGTH));
    }

    console.log(sep("~", 70));
    $done({});
}

// ============ 入口：判断当前场景 ============
// QX 在 script-response-body 场景下会设置 $response
// QX 在 script-request-header / script-request-body 场景下会设置 $request
// 两者可能同时存在（response场景时 $request 也可能有值），所以先判断 $response

var hasResponse = (typeof $response !== "undefined") && $response !== null;
var hasRequest  = (typeof $request  !== "undefined") && $request  !== null;

if (hasResponse) {
    // script-response-body 场景
    handleResponse($response);
} else if (hasRequest) {
    // 区分 request-header 还是 request-body
    // request-header 时 $request 有 headers/method，body 通常为空
    // request-body 时 $request 有 body
    if ($request.body && PRINT_REQUEST_BODY) {
        handleRequestBody($request);
    } else {
        handleRequestHeader($request);
    }
} else {
    $done({});
}
