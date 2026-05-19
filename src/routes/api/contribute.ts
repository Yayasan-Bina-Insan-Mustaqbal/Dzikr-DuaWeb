import { createAPIFileRoute } from "@tanstack/react-start/api"
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs"
import { join } from "path"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

// Direct upstream details
const UPSTREAM_OWNER = "decaller"
const UPSTREAM_REPO = "Dzikr-DuaWeb"

export const Route = createAPIFileRoute("/api/contribute")({
  GET: async ({ request }) => {
    const url = new URL(request.url)
    const action = url.searchParams.get("action")
    
    if (action === "exchange") {
      const code = url.searchParams.get("code")
      const clientId = process.env.GITHUB_CLIENT_ID || ""
      const clientSecret = process.env.GITHUB_CLIENT_SECRET || ""
      
      if (!code) {
        return new Response(JSON.stringify({ error: "Missing authorization code" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        })
      }
      
      try {
        // Exchange code for GitHub Access Token
        const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code
          })
        })
        
        const tokenData = await tokenRes.json()
        if (tokenData.error) {
          return new Response(JSON.stringify({ error: tokenData.error_description || tokenData.error }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          })
        }
        
        const accessToken = tokenData.access_token
        
        // Fetch User Info
        const userRes = await fetch("https://api.github.com/user", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "DzikrDua-App"
          }
        })
        
        const userData = await userRes.json()
        
        return new Response(JSON.stringify({
          token: accessToken,
          username: userData.login,
          avatarUrl: userData.avatar_url
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        })
      }
    }
    
    return new Response(JSON.stringify({ status: "active", message: "Bismillah. Contribution API is fully functional." }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  },
  
  POST: async ({ request }) => {
    try {
      const body = await request.json()
      const { action, token, username, changes, audioBlobs } = body
      
      if (action !== "submit") {
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        })
      }
      
      const timeStr = new Date().toISOString()
      
      // Dual-Mode Execution: If NO token is supplied, run in Sandbox/Local Mode
      const isSandboxMode = !token
      
      // Let's first read the current local or remote invocations.json file
      let currentChapters: any[] = []
      const localDataPath = join(process.cwd(), "src/data/invocations.json")
      
      if (existsSync(localDataPath)) {
        currentChapters = JSON.parse(readFileSync(localDataPath, "utf-8"))
      } else {
        return new Response(JSON.stringify({ error: "Local database invocations.json not found." }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        })
      }
      
      // Track updated filenames and statuses
      const updatedFiles: Record<string, string> = {}
      const savedAudioPaths: Record<number, string> = {}
      
      // 1. Process and convert audio contributions using FFmpeg on the host!
      if (audioBlobs && Object.keys(audioBlobs).length > 0) {
        const scratchDir = join(process.cwd(), "scratch")
        if (!existsSync(scratchDir)) {
          mkdirSync(scratchDir, { recursive: true })
        }
        
        const contributionsDir = join(process.cwd(), "public/audios/contributions")
        if (!existsSync(contributionsDir)) {
          mkdirSync(contributionsDir, { recursive: true })
        }
        
        for (const [key, base64Data] of Object.entries(audioBlobs)) {
          const invocationId = Number(key)
          
          // Decode raw WebM/Wav buffer from base64
          const audioBuffer = Buffer.from(base64Data as string, "base64")
          const tempInputPath = join(scratchDir, `input-${invocationId}-${Date.now()}.webm`)
          const outputMp3Filename = `${invocationId}_contrib.mp3`
          const finalMp3Path = join(contributionsDir, outputMp3Filename)
          
          // Write temporary WebM recording file
          writeFileSync(tempInputPath, audioBuffer)
          
          // Standardized MP3 conversion: 16-bit PCM / 44.1kHz standard compression
          try {
            await execAsync(`ffmpeg -y -i "${tempInputPath}" -codec:a libmp3lame -b:a 128k "${finalMp3Path}"`)
            savedAudioPaths[invocationId] = `/audios/contributions/${outputMp3Filename}`
            
            // For GitHub commits, read back the MP3 file into Base64
            if (!isSandboxMode) {
              const mp3Buffer = readFileSync(finalMp3Path)
              updatedFiles[`public/audios/contributions/${outputMp3Filename}`] = mp3Buffer.toString("base64")
            }
          } catch (err: any) {
            console.error(`Ffmpeg conversion error for invocation #${invocationId}:`, err)
            // Fallback directly to raw WebM if ffmpeg is unable to process
            const fallbackFilename = `${invocationId}_contrib.webm`
            const fallbackPath = join(contributionsDir, fallbackFilename)
            writeFileSync(fallbackPath, audioBuffer)
            savedAudioPaths[invocationId] = `/audios/contributions/${fallbackFilename}`
            
            if (!isSandboxMode) {
              updatedFiles[`public/audios/contributions/${fallbackFilename}`] = base64Data as string
            }
          } finally {
            // Clean up temporary workspace input file
            try {
              if (existsSync(tempInputPath)) {
                const fs = require("fs")
                fs.unlinkSync(tempInputPath)
              }
            } catch (e) {}
          }
        }
      }
      
      // 2. Map staged translation and transliteration corrections to the invocations JSON database
      for (const change of changes) {
        const id = change.invocationId
        
        // Traverse chapters to find the corresponding invocation
        for (const chapter of currentChapters) {
          const inv = chapter.invocations.find((i: any) => i.id === id)
          if (inv) {
            // Apply text edits
            if (change.arabic) inv.arabic = change.arabic
            
            if (change.translations) {
              Object.entries(change.translations).forEach(([lang, text]) => {
                if (lang === "indonesian") inv.indonesian = text
                else if (lang === "english") inv.english = text
                else {
                  if (!inv.additional_translations) inv.additional_translations = {}
                  inv.additional_translations[lang] = text
                }
              })
            }
            
            if (change.transliterations) {
              Object.entries(change.transliterations).forEach(([lang, text]) => {
                if (lang === "latin") inv.latin = text
                else {
                  if (!inv.additional_transliterations) inv.additional_transliterations = {}
                  inv.additional_transliterations[lang] = text
                }
              })
            }
            
            // Apply audio path if recorded
            if (savedAudioPaths[id]) {
              inv.audio = savedAudioPaths[id]
            }
            
            // Append isnaad tracking (attribution metadata)
            const metadata = {
              github_username: username || "local-developer",
              timestamp: timeStr,
              role: savedAudioPaths[id] ? "Narrator & Editor" : "Editor"
            }
            
            if (!inv.attribution_chain) {
              inv.attribution_chain = []
            }
            inv.attribution_chain.push(metadata)
            break
          }
        }
      }
      
      // Formulate updated invocations string
      const updatedJsonString = JSON.stringify(currentChapters, null, 2)
      
      // Handle Local Sandbox Write
      if (isSandboxMode) {
        writeFileSync(localDataPath, updatedJsonString)
        
        return new Response(JSON.stringify({
          success: true,
          mode: "sandbox",
          message: "Alhamdulillah. Staged changes successfully written directly to your local workspace files!",
          details: {
            changesCount: changes.length,
            audiosRecorded: Object.keys(savedAudioPaths)
          }
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
      }
      
      // 3. GitHub Git-less OAuth PR Submission Mode
      const userHeaders = {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "DzikrDua-App"
      }
      
      // A. Fork the upstream repository to user account
      const forkRes = await fetch(`https://api.github.com/repos/${UPSTREAM_OWNER}/${UPSTREAM_REPO}/forks`, {
        method: "POST",
        headers: userHeaders
      })
      
      const forkData = await forkRes.json()
      const userForkRepo = forkData.name || UPSTREAM_REPO
      
      // Wait briefly for fork to instantiate (Max 3 seconds check)
      let forkReady = false
      for (let attempt = 1; attempt <= 3; attempt++) {
        const checkRes = await fetch(`https://api.github.com/repos/${username}/${userForkRepo}`, {
          headers: userHeaders
        })
        if (checkRes.status === 200) {
          forkReady = true
          break
        }
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      if (!forkReady) {
        throw new Error("GitHub took too long to provision the fork. Please try again in a few seconds.")
      }
      
      // B. Get latest commit SHA of the main branch of upstream
      const refRes = await fetch(`https://api.github.com/repos/${UPSTREAM_OWNER}/${UPSTREAM_REPO}/git/ref/heads/master`, {
        headers: userHeaders
      })
      const refData = await refRes.json()
      const baseCommitSha = refData.object.sha
      
      // C. Create a dynamic branch
      const branchName = `contrib-dhikr-${Date.now()}`
      const createBranchRes = await fetch(`https://api.github.com/repos/${username}/${userForkRepo}/git/refs`, {
        method: "POST",
        headers: userHeaders,
        body: JSON.stringify({
          ref: `refs/heads/${branchName}`,
          sha: baseCommitSha
        })
      })
      
      if (createBranchRes.status !== 201) {
        const errJson = await createBranchRes.json()
        throw new Error(`Failed to create git branch: ${errJson.message}`)
      }
      
      // D. Commit modified invocations.json
      const jsonFileRes = await fetch(`https://api.github.com/repos/${username}/${userForkRepo}/contents/src/data/invocations.json?ref=${branchName}`, {
        headers: userHeaders
      })
      let jsonSha = ""
      if (jsonFileRes.status === 200) {
        const jsonFileData = await jsonFileRes.json()
        jsonSha = jsonFileData.sha
      }
      
      const commitJsonRes = await fetch(`https://api.github.com/repos/${username}/${userForkRepo}/contents/src/data/invocations.json`, {
        method: "PUT",
        headers: userHeaders,
        body: JSON.stringify({
          message: `feat(database): staged corrections for ${changes.length} invocations`,
          content: Buffer.from(updatedJsonString).toString("base64"),
          sha: jsonSha || undefined,
          branch: branchName
        })
      })
      
      if (commitJsonRes.status !== 200 && commitJsonRes.status !== 201) {
        const errJson = await commitJsonRes.json()
        throw new Error(`Failed committing database corrections: ${errJson.message}`)
      }
      
      // E. Commit media files
      for (const [path, base64Content] of Object.entries(updatedFiles)) {
        const fileCheckRes = await fetch(`https://api.github.com/repos/${username}/${userForkRepo}/contents/${path}?ref=${branchName}`, {
          headers: userHeaders
        })
        let fileSha = ""
        if (fileCheckRes.status === 200) {
          const fileCheckData = await fileCheckRes.json()
          fileSha = fileCheckData.sha
        }
        
        await fetch(`https://api.github.com/repos/${username}/${userForkRepo}/contents/${path}`, {
          method: "PUT",
          headers: userHeaders,
          body: JSON.stringify({
            message: `feat(audio): narrative audio upload for ${path}`,
            content: base64Content,
            sha: fileSha || undefined,
            branch: branchName
          })
        })
      }
      
      // F. Open a Pull Request from user branch to upstream master
      const prRes = await fetch(`https://api.github.com/repos/${UPSTREAM_OWNER}/${UPSTREAM_REPO}/pulls`, {
        method: "POST",
        headers: userHeaders,
        body: JSON.stringify({
          title: `Contribution: Staged improvements and narration audio from @${username}`,
          head: `${username}:${branchName}`,
          base: "master",
          body: `### Bismillahir Rahmanir Rahim.
          
Staged changes submitted directly from the web **Contribution Hub** by @${username}.

#### Staged Changes Summary:
*   **Total modified entries**: ${changes.length} Invocations corrected
*   **New recitations recorded**: ${Object.keys(savedAudioPaths).length} audio tracks staged

All translation, transliteration, and Arabic matan changes have been successfully mapped to \`src/data/invocations.json\` and attributed cleanly to preserve the narrated Isnad chain of scholarship.

Please review, verify authenticity, and merge! Jazakumullahu Khayran.`
        })
      })
      
      const prData = await prRes.json()
      
      if (prRes.status !== 201) {
        throw new Error(`Failed to generate Pull Request: ${prData.message || "Unknown error"}`)
      }
      
      return new Response(JSON.stringify({
        success: true,
        mode: "production",
        prUrl: prData.html_url,
        prNumber: prData.number,
        message: "Alhamdulillah! Your contribution was compiled, committed, and successfully submitted as a GitHub Pull Request!"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
      
    } catch (err: any) {
      console.error("API submit error:", err)
      return new Response(JSON.stringify({ error: err.message || "Failed submitting contribution" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      })
    }
  }
})
