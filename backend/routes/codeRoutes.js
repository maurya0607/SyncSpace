const express = require("express");
const router = express.Router();
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

// Judge0 Language IDs
const JUDGE0_LANG_MAP = {
    cpp: 54,        // C++ (GCC 9.2.0) / 105 (GCC 14.1.0)
    c: 50,          // C (GCC 9.2.0) / 103 (GCC 14.1.0)
    python: 71,     // Python 3 (3.8.1) / 92 (3.12.5)
    javascript: 63, // JavaScript (Node.js 12.14.0)
    typescript: 74, // TypeScript (3.7.4)
    java: 62,       // Java (OpenJDK 13.0.1)
    rust: 73,       // Rust (1.40.0)
    go: 60,         // Go (1.13.5)
};

// Glot Language slugs
const GLOT_LANG_MAP = {
    cpp: "cpp",
    c: "c",
    python: "python",
    javascript: "javascript",
    typescript: "typescript",
    java: "java",
    rust: "rust",
    go: "go",
};

// Local runner helper
const runLocally = (language, code) => {
    return new Promise((resolve, reject) => {
        const tempDir = os.tmpdir();
        const rand = Date.now() + "_" + Math.floor(Math.random() * 10000);

        if (language === "cpp" || language === "c") {
            const ext = language === "cpp" ? ".cpp" : ".c";
            const compiler = language === "cpp" ? "g++" : "gcc";
            const srcFile = path.join(tempDir, `syncspace_${rand}${ext}`);
            const exeFile = path.join(tempDir, `syncspace_${rand}.exe`);

            fs.writeFile(srcFile, code, (err) => {
                if (err) return reject(err);

                exec(`${compiler} "${srcFile}" -o "${exeFile}"`, { timeout: 10000 }, (cErr, cStdout, cStderr) => {
                    if (cErr || cStderr) {
                        try { fs.unlinkSync(srcFile); } catch (e) {}
                        return resolve({
                            compileError: cStderr || cErr.message,
                            output: "",
                            stderr: "",
                            exitCode: 1,
                        });
                    }

                    exec(`"${exeFile}"`, { timeout: 5000 }, (rErr, rStdout, rStderr) => {
                        try { fs.unlinkSync(srcFile); } catch (e) {}
                        try { fs.unlinkSync(exeFile); } catch (e) {}
                        resolve({
                            output: rStdout || "",
                            stderr: rStderr || (rErr ? rErr.message : ""),
                            compileError: "",
                            exitCode: rErr ? (rErr.code || 1) : 0,
                        });
                    });
                });
            });
        } else if (language === "python") {
            const srcFile = path.join(tempDir, `syncspace_${rand}.py`);
            fs.writeFile(srcFile, code, (err) => {
                if (err) return reject(err);
                exec(`python "${srcFile}"`, { timeout: 8000 }, (rErr, rStdout, rStderr) => {
                    try { fs.unlinkSync(srcFile); } catch (e) {}
                    resolve({
                        output: rStdout || "",
                        stderr: rStderr || (rErr ? rErr.message : ""),
                        compileError: "",
                        exitCode: rErr ? (rErr.code || 1) : 0,
                    });
                });
            });
        } else {
            reject(new Error("Local execution not supported for language: " + language));
        }
    });
};

router.post("/execute", async (req, res) => {
    const { language, code, fileName = "main" } = req.body;

    if (!code || !language) {
        return res.status(400).json({ error: "Language and code are required." });
    }

    const langKey = language.toLowerCase();

    // ── Tier 1: Judge0 CE Public API ──────────────────────────────────
    if (JUDGE0_LANG_MAP[langKey]) {
        try {
            const langId = JUDGE0_LANG_MAP[langKey];
            const response = await fetch("https://ce.judge0.com/submissions?base64_encoded=false&wait=true", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    source_code: code,
                    language_id: langId,
                    stdin: "",
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const stdout = data.stdout || "";
                const stderr = data.stderr || "";
                const compileError = data.compile_output || "";
                const status = data.status || {};
                const isSuccess = status.id === 3; // 3 = Accepted

                return res.json({
                    success: isSuccess,
                    engine: "Judge0 CE",
                    output: stdout || (isSuccess && !compileError && !stderr ? "Program executed successfully with no output." : ""),
                    stderr,
                    compileError,
                    exitCode: isSuccess ? 0 : 1,
                });
            }
        } catch (err) {
            console.warn("Judge0 CE API attempt failed:", err.message);
        }
    }

    // ── Tier 2: Glot.io Public Engine ─────────────────────────────────
    if (GLOT_LANG_MAP[langKey]) {
        try {
            const glotSlug = GLOT_LANG_MAP[langKey];
            const fileExt = langKey === "cpp" ? "cpp" : langKey === "c" ? "c" : langKey === "python" ? "py" : "txt";
            const response = await fetch(`https://glot.io/api/run/${glotSlug}/latest`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    files: [{ name: `main.${fileExt}`, content: code }],
                }),
            });

            if (response.ok) {
                const data = await response.json();
                return res.json({
                    success: !data.error && !data.stderr,
                    engine: "Glot.io",
                    output: data.stdout || (!data.stderr && !data.error ? "Program executed successfully." : ""),
                    stderr: data.stderr || "",
                    compileError: data.error || "",
                    exitCode: data.stderr || data.error ? 1 : 0,
                });
            }
        } catch (err) {
            console.warn("Glot.io API attempt failed:", err.message);
        }
    }

    // ── Tier 3: Local Execution Fallback (g++, gcc, python) ───────────
    try {
        const localResult = await runLocally(langKey, code);
        return res.json({
            success: !localResult.compileError && localResult.exitCode === 0,
            engine: "Local Compiler",
            ...localResult,
        });
    } catch (localErr) {
        console.warn("Local execution fallback unavailable:", localErr.message);
    }

    return res.status(502).json({
        error: "All code execution engines are currently unreachable. Please check your internet connection.",
    });
});

module.exports = router;
