const path = require("path");
const http = require("http");
const { spawn } = require("child_process");
const mongoose = require("mongoose");

require("dotenv").config({ path: path.join(__dirname, "../.env") });
process.env.AI_TIMEOUT_MS = String(process.env.DIAGNOSTIC_AI_TIMEOUT_MS || process.env.AI_TIMEOUT_MS || 15000);

const connectDB = require("../config/db");
const app = require("../app");
const aiService = require("../services/ai/ai.service");

const TEST_PROMPT = "Reply with exactly: SYSTEM_OK";
const AUTH_EMAIL = String(process.env.DIAGNOSTIC_EMAIL || "").trim();
const AUTH_PASSWORD = String(process.env.DIAGNOSTIC_PASSWORD || "").trim();

const scriptSuite = [
    "test_exchange_services.js",
    "test_trade_flow.js",
    "test_notification_hooks.js",
    "test_global_learning_requests.js",
    "test_skill_gap_pipeline.js",
];

const providerConfigs = {
    groq: {
        enabled: Boolean(process.env.GROQ_API_KEY && !String(process.env.GROQ_API_KEY).startsWith("REPLACE_")),
        model: process.env.GROQ_MODEL || process.env.GROQ_CHAT_MODEL || process.env.GROQ_HEAVY_MODEL || "llama-3.1-8b-instant",
    },
    huggingface: {
        enabled: Boolean(
            (process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_KEY_2 || process.env.HF_TOKEN || process.env.HF_API_TOKEN)
            && !(process.env.HUGGINGFACE_API_KEY || "").startsWith("REPLACE_")
        ),
        model: process.env.HF_MODEL || process.env.HF_CHAT_MODEL || process.env.HF_HEAVY_MODEL || process.env.HF_SKILLGAP_MODEL || "",
    },
    nvidia: {
        enabled: Boolean((process.env.NVIDIA_API_KEY || process.env.NVIDIA_TOKEN) && !(process.env.NVIDIA_API_KEY || "").startsWith("REPLACE_")),
        model: process.env.NVIDIA_MODEL || process.env.NVIDIA_CHAT_MODEL || process.env.NVIDIA_HEAVY_MODEL || "meta/llama-3.1-8b-instruct",
    },
    openrouter: {
        enabled: Boolean(process.env.OPENROUTER_API_KEY && !String(process.env.OPENROUTER_API_KEY).startsWith("REPLACE_")),
        model: process.env.OPENROUTER_MODEL || process.env.OPENROUTER_CHAT_MODEL || process.env.OPENROUTER_HEAVY_MODEL || "google/gemma-4-26b-a4b-it:free",
    },
};

const results = [];

const formatError = (error) => {
    const status = error?.status ? ` status=${error.status}` : "";
    const code = error?.code ? ` code=${error.code}` : "";
    return `${error?.message || String(error)}${status}${code}`;
};

const classifyProviderError = (error) => {
    const status = Number(error?.status || 0);
    const message = String(error?.message || "");
    if (status === 429 || message.includes("429")) {
        return "RATE_LIMIT_429";
    }
    if (status === 402 || message.includes("402")) {
        return "BILLING_OR_PROVIDER_402";
    }
    return "PROVIDER_ERROR";
};

const record = (name, status, details) => {
    results.push({ name, status, details });
    const prefix = status === "PASS" ? "[PASS]" : status === "SKIP" ? "[SKIP]" : "[FAIL]";
    console.log(`${prefix} ${name}${details ? ` -> ${details}` : ""}`);
};

const runCheck = async (name, fn, options = {}) => {
    try {
        const details = await fn();
        record(name, "PASS", details || "");
        return true;
    } catch (error) {
        if (options.skipOnError) {
            record(name, "SKIP", formatError(error));
            return false;
        }
        record(name, "FAIL", formatError(error));
        return false;
    }
};

const runNodeScript = (scriptName) => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(__dirname, scriptName)], {
        cwd: path.join(__dirname, ".."),
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
        stdout += String(chunk);
    });

    child.stderr.on("data", (chunk) => {
        stderr += String(chunk);
    });

    child.on("error", reject);

    child.on("close", (code) => {
        if (code === 0) {
            resolve(stdout.trim() || `${scriptName} completed`);
            return;
        }

        reject(new Error(`${scriptName} exited with code ${code}. ${stderr.trim() || stdout.trim()}`.trim()));
    });
});

const startServer = () => new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
        const address = server.address();
        resolve({
            server,
            baseUrl: `http://127.0.0.1:${address.port}`,
        });
    });
});

const fetchJson = async (url, options = {}) => {
    const response = await fetch(url, options);
    const text = await response.text();
    let body = null;

    try {
        body = text ? JSON.parse(text) : null;
    } catch {
        body = text;
    }

    return { response, body };
};

async function main() {
    console.log("\n========================================");
    console.log(" NEXTARO SYSTEM DIAGNOSTICS");
    console.log("========================================\n");

    await runCheck("Environment basics", async () => {
        const required = ["MONGO_URI", "JWT_SECRET"];
        const missing = required.filter((key) => !process.env[key]);
        if (missing.length) {
            throw new Error(`Missing env vars: ${missing.join(", ")}`);
        }
        return `AI_PROVIDER=${process.env.AI_PROVIDER || "groq"}`;
    });

    await runCheck("Database connectivity", async () => {
        await connectDB();
        if (!connectDB.isDatabaseConnected()) {
            throw new Error("mongoose did not reach readyState 1");
        }
        return `readyState=${mongoose.connection.readyState}`;
    });

    for (const scriptName of scriptSuite) {
        await runCheck(`Pipeline script: ${scriptName}`, async () => runNodeScript(scriptName));
    }

    for (const [provider, config] of Object.entries(providerConfigs)) {
        if (!config.enabled) {
            record(`AI provider: ${provider}`, "SKIP", "not configured");
            continue;
        }

        await runCheck(`AI provider: ${provider}`, async () => {
            try {
                const result = await aiService.generate(TEST_PROMPT, {
                    provider,
                    model: config.model || undefined,
                    maxTokens: 32,
                    temperature: 0,
                });
                return `model=${config.model || "default"} response=${String(result?.text || "").trim().slice(0, 80)}`;
            } catch (error) {
                const classified = classifyProviderError(error);
                throw new Error(`${classified}: ${formatError(error)}`);
            }
        });
    }

    let startedServer = null;
    try {
        startedServer = await startServer();
        const { server, baseUrl } = startedServer;

        await runCheck("Route: GET /health", async () => {
            const { response, body } = await fetchJson(`${baseUrl}/health`);
            if (!response.ok || body?.status !== "ok") {
                throw new Error(`Expected 200 {status: ok}, got ${response.status}`);
            }
            return "health endpoint responded";
        });

        await runCheck("Route: GET /api/ai/test", async () => {
            const { response, body } = await fetchJson(`${baseUrl}/api/ai/test`);
            if (!response.ok) {
                throw new Error(`Unexpected status ${response.status}`);
            }
            if (!body?.success) {
                const error = String(body?.error || body?.message || "unknown AI failure");
                if (error.includes("429")) {
                    throw new Error(`RATE_LIMIT_429: ${error}`);
                }
                if (error.includes("402")) {
                    throw new Error(`BILLING_OR_PROVIDER_402: ${error}`);
                }
                throw new Error(error);
            }
            return `provider=${body?.provider || process.env.AI_PROVIDER || "groq"}`;
        });

        const protectedChecks = [
            { name: "Protected route: GET /api/agreements/inbox", url: `${baseUrl}/api/agreements/inbox`, method: "GET" },
            { name: "Protected route: POST /api/resume/analyze", url: `${baseUrl}/api/resume/analyze`, method: "POST", body: JSON.stringify({}) },
            { name: "Protected route: GET /api/reviews/test-user", url: `${baseUrl}/api/reviews/test-user`, method: "GET" },
            { name: "Protected route: GET /api/ai/history", url: `${baseUrl}/api/ai/history`, method: "GET" },
        ];

        for (const check of protectedChecks) {
            await runCheck(check.name, async () => {
                const { response } = await fetchJson(check.url, {
                    method: check.method,
                    headers: check.body ? { "Content-Type": "application/json" } : undefined,
                    body: check.body,
                });

                if (response.status !== 401) {
                    throw new Error(`Expected 401 unauthorised smoke response, got ${response.status}`);
                }
                return "route mounted and protected";
            });
        }

        if (AUTH_EMAIL && AUTH_PASSWORD) {
            let token = "";
            await runCheck("Auth login (optional live user)", async () => {
                const { response, body } = await fetchJson(`${baseUrl}/api/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: AUTH_EMAIL, password: AUTH_PASSWORD }),
                });

                if (!response.ok || !body?.token) {
                    throw new Error(`Login failed with status ${response.status}: ${body?.message || "no token returned"}`);
                }

                token = body.token;
                return `logged in as ${AUTH_EMAIL}`;
            });

            if (token) {
                await runCheck("Authenticated route: GET /api/ai/history", async () => {
                    const { response } = await fetchJson(`${baseUrl}/api/ai/history`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    if (response.status === 429) {
                        throw new Error("RATE_LIMIT_429: AI history endpoint throttled");
                    }

                    if (!response.ok) {
                        throw new Error(`Expected authenticated success, got ${response.status}`);
                    }

                    return "authenticated AI route reachable";
                });

                await runCheck("Authenticated review validation smoke", async () => {
                    const { response, body } = await fetchJson(`${baseUrl}/api/reviews`, {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({}),
                    });

                    if (response.status === 429) {
                        throw new Error("RATE_LIMIT_429: review endpoint throttled during validation smoke");
                    }

                    if (response.status !== 400) {
                        throw new Error(`Expected 400 validation response, got ${response.status}`);
                    }

                    return String(body?.message || "review route validation responded");
                });
            }
        } else {
            record("Authenticated diagnostics", "SKIP", "set DIAGNOSTIC_EMAIL and DIAGNOSTIC_PASSWORD in backend/.env to enable");
        }

        await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    } finally {
        if (startedServer?.server?.listening) {
            await new Promise((resolve) => startedServer.server.close(() => resolve()));
        }
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
    }

    const failed = results.filter((item) => item.status === "FAIL");
    const passed = results.filter((item) => item.status === "PASS");
    const skipped = results.filter((item) => item.status === "SKIP");

    console.log("\n========================================");
    console.log(" DIAGNOSTICS SUMMARY");
    console.log("========================================");
    console.log(`Passed : ${passed.length}`);
    console.log(`Failed : ${failed.length}`);
    console.log(`Skipped: ${skipped.length}`);

    if (failed.length) {
        console.log("\nFailing checks:");
        failed.forEach((item) => {
            console.log(`- ${item.name}: ${item.details}`);
        });
        process.exitCode = 1;
        return;
    }

    console.log("\nAll required diagnostics passed.");
}

main().catch(async (error) => {
    console.error("\nSYSTEM DIAGNOSTICS FAILED HARD");
    console.error(formatError(error));
    try {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
    } catch (_) {
        // ignore close errors
    }
    process.exit(1);
}).finally(() => {
    setTimeout(() => {
        process.exit(process.exitCode || 0);
    }, 50);
});
