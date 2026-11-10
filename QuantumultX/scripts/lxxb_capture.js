/**
 * 灵犀晓伴 App 抓包脚本
 * 
 * 功能：拦截晓伴App所有HTTP请求和响应，打印完整信息到QX日志
 * 用途：逆向分析晓伴App的API接口，为后续开发Web管理端做准备
 *
 * 使用方法：
 * 1. 将此脚本放入QX的scripts目录
 * 2. 在QX配置中添加对应的hostname和rewrite规则
 * 3. 打开QX日志窗口
 * 4. 打开晓伴App进行操作
 * 5. 所有请求和响应会自动打印到日志
 */

// ============ 配置区 ============
// 是否打印完整请求头（包含Token等敏感信息）
const PRINT_FULL_HEADERS = true;
// 是否打印请求体
const PRINT_REQUEST_BODY = true;
// 是否打印响应体
const PRINT_RESPONSE_BODY = true;
// 响应体最大打印长度（防止超长响应刷屏）
const MAX_BODY_LENGTH = 5000;
// 只关注这些路径关键词（留空=全部打印）
const FILTER_KEYWORDS = [];
// 忽略这些路径（静态资源等噪音）
const IGNORE_KEYWORDS = [".js", ".css", ".png", ".jpg", ".jpeg", ".gif", ".ico", ".woff", ".ttf", ".svg", ".webp", "favicon", "static/", "cdn-", "google-analytics", "umeng", "tracking", "log.", "monitor", "stats"];
// ================================

/**
 * 检查URL是否需要忽略
 */
function shouldIgnore(url) {
    const lowerUrl = url.toLowerCase();
    for (const kw of IGNORE_KEYWORDS) {
        if (lowerUrl.includes(kw)) return true;
    }
    return false;
}

/**
 * 检查URL是否匹配过滤关键词
 */
function shouldCapture(url) {
    if (FILTER_KEYWORDS.length === 0) return true;
    const lowerUrl = url.toLowerCase();
    for (const kw of FILTER_KEYWORDS) {
        if (lowerUrl.includes(kw.toLowerCase())) return true;
    }
    return false;
}

/**
 * 格式化JSON（如果是JSON字符串）
 */
function tryFormatJson(str) {
    try {
        const obj = JSON.parse(str);
        return JSON.stringify(obj, null, 2);
    } catch (e) {
        return str;
    }
}

/**
 * 截断超长字符串
 */
function truncate(str, maxLen) {
    if (!str) return "(空)";
    if (str.length <= maxLen) return str;
    return str.substring(0, maxLen) + `\n... [截断，总长度${str.length}字符]`;
}

// =============================================
// 请求头拦截 — 抓URL、方法、请求头、请求体
// =============================================
function captureRequestHeaders(data) {
    const url = data.url || "(unknown)";
    
    if (shouldIgnore(url) || !shouldCapture(url)) {
        return {};
    }

    const method = data.method || "(unknown)";
    const headers = data.headers || {};
    
    // 提取关键认证信息
    const authToken = headers["Authorization"] || headers["authorization"] || "";
    const cookie = headers["Cookie"] || headers["cookie"] || "";
    const token = headers["token"] || headers["Token"] || headers["x-token"] || headers["X-Token"] || "";
    const userAgent = headers["User-Agent"] || headers["user-agent"] || "";
    const contentType = headers["Content-Type"] || headers["content-type"] || "";

    console.log("\n" + "=".repeat(80));
    console.log("📤 [请求] " + method + " " + url);
    console.log("-".repeat(80));
    
    // 关键认证信息（高亮）
    if (authToken) console.log("🔑 Authorization: " + authToken);
    if (cookie) console.log("🍪 Cookie: " + cookie);
    if (token) console.log("🎫 Token: " + token);
    if (userAgent) console.log("📱 User-Agent: " + userAgent);
    if (contentType) console.log("📦 Content-Type: " + contentType);

    // 打印完整请求头
    if (PRINT_FULL_HEADERS) {
        console.log("\n--- 完整请求头 ---");
        for (const [key, value] of Object.entries(headers)) {
            console.log("  " + key + ": " + value);
        }
    }

    // 打印请求体
    if (PRINT_REQUEST_BODY && data.body) {
        console.log("\n--- 请求体 ---");
        console.log(truncate(tryFormatJson(data.body), MAX_BODY_LENGTH));
    }

    console.log("=".repeat(80) + "\n");

    return {};
}

// =============================================
// 请求体拦截 — 单独抓请求体（POST等）
// =============================================
function captureRequestBody(data) {
    const url = data.url || "(unknown)";
    
    if (shouldIgnore(url) || !shouldCapture(url)) {
        return {};
    }

    if (data.body) {
        console.log("\n📥 [请求体] " + url);
        console.log(truncate(tryFormatJson(data.body), MAX_BODY_LENGTH));
    }

    return {};
}

// =============================================
// 响应体拦截 — 抓服务器返回的数据
// =============================================
function captureResponseBody(data) {
    const url = data.url || "(unknown)";
    
    if (shouldIgnore(url) || !shouldCapture(url)) {
        return {};
    }

    const status = data.status || "(unknown)";
    const headers = data.headers || {};

    console.log("\n" + "~".repeat(80));
    console.log("📩 [响应] " + status + " " + url);
    console.log("-".repeat(80));

    // 打印响应头中的关键信息
    const setCookie = headers["Set-Cookie"] || headers["set-cookie"] || "";
    const contentType = headers["Content-Type"] || headers["content-type"] || "";
    if (setCookie) console.log("🍪 Set-Cookie: " + setCookie);
    if (contentType) console.log("📦 Content-Type: " + contentType);

    // 打印响应体
    if (PRINT_RESPONSE_BODY && data.body) {
        console.log("\n--- 响应体 ---");
        console.log(truncate(tryFormatJson(data.body), MAX_BODY_LENGTH));
    }

    console.log("~".repeat(80) + "\n");

    return {};
}

// =============================================
// QX 脚本入口
// =============================================
// script-request-header
const headerName = "lxxb_capture";
const headerExec = `$argument`;

// 通过不同的入口函数名区分调用类型
// QX会根据rewrite规则中的 script-request-header / script-request-body / script-response-body 自动调用

// 导出函数（QX兼容格式）
if (typeof $request !== "undefined") {
    // request-header / request-body 场景
    const result = captureRequestHeaders($request);
    if (result) {
        $done(result);
    } else {
        $done({});
    }
}

if (typeof $response !== "undefined") {
    // response-body 场景
    const result = captureResponseBody($response);
    if (result) {
        $done(result);
    } else {
        $done({});
    }
}

// 如果两者都没有（可能是测试环境）
if (typeof $request === "undefined" && typeof $response === "undefined") {
    console.log("[晓伴抓包] 脚本已加载，等待请求...");
    $done({});
}
