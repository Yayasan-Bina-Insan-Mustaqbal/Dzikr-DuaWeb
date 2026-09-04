import { createServerFn } from "@tanstack/react-start"
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs"
import { join } from "path"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

function sanitizeName(name: string): string {
  // Remove parentheses
  let sanitized = name.replace(/[\(\)]/g, '');
  // Replace non-alphanumeric (except space/hyphen/underscore) with empty
  sanitized = sanitized.replace(/[^a-zA-Z0-9\s_\-]/g, '');
  // Replace spaces and consecutive underscores with a single underscore
  sanitized = sanitized.replace(/[\s\-]+/g, '_');
  sanitized = sanitized.replace(/_+/g, '_');
  return sanitized.trim().replace(/^_+|_+$/g, '');
}

// Direct upstream details
const UPSTREAM_OWNER = process.env.GITHUB_UPSTREAM_OWNER || "decaller"
const UPSTREAM_REPO = process.env.GITHUB_UPSTREAM_REPO || "Dzikr-DuaWeb"

// 1. OAuth code exchange Server Function
export const exchangeCodeServerFn = createServerFn({ method: "POST" })
  .inputValidator((code: string) => code)
  .handler(async ({ data: code }) => {
    const clientId = process.env.GITHUB_CLIENT_ID || ""
    const clientSecret = process.env.GITHUB_CLIENT_SECRET || ""
    
    if (!code) {
      throw new Error("Missing authorization code")
    }

    if (!clientSecret) {
      console.warn("GITHUB_CLIENT_SECRET is not set in server environment. OAuth will likely fail.")
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
        throw new Error(tokenData.error_description || tokenData.error)
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
      
      if (!userRes.ok) {
        const errorText = await userRes.text()
        throw new Error(`Failed to fetch user data: ${userRes.status} ${errorText}`)
      }
      
      const userData = await userRes.json()
      
      return {
        token: accessToken,
        username: userData.login,
        avatarUrl: userData.avatar_url
      }
    } catch (err: any) {
      console.error("Exchange code error:", err)
      throw new Error(err.message || "Failed to exchange OAuth code")
    }
  })

// 2. Submit Contribution Server Function
interface SubmitPayload {
  token: string
  username: string
  changes: Array<{
    invocationId: number
    arabic: string
    description?: string
    translations: Record<string, string>
    transliterations: Record<string, string>
  }>
  audioBlobs: Record<number, string>
}

export const submitContributionServerFn = createServerFn({ method: "POST" })
  .inputValidator((payload: SubmitPayload) => payload)
  .handler(async ({ data }) => {
    const { token, username, changes, audioBlobs } = data
    const timeStr = new Date().toISOString()
    
    // Dual-Mode Execution: If NO token is supplied, run in Sandbox/Local Mode
    const isSandboxMode = !token
    
    // Read the current local invocations.json file
    let currentChapters: any[] = []
    const localDataPath = join(process.cwd(), "src/data/invocations.json")
    
    if (existsSync(localDataPath)) {
      currentChapters = JSON.parse(readFileSync(localDataPath, "utf-8"))
    } else {
      throw new Error("Local database invocations.json not found.")
    }
    
    // Track updated filenames and statuses
    const updatedFiles: Record<string, string> = {}
    const savedAudioPaths: Record<number, string> = {}
    
    // A. Process and convert audio contributions using FFmpeg on the host
    if (audioBlobs && Object.keys(audioBlobs).length > 0) {
      const scratchDir = join(process.cwd(), "scratch")
      if (!existsSync(scratchDir)) {
        mkdirSync(scratchDir, { recursive: true })
      }
      
      for (const [key, base64Data] of Object.entries(audioBlobs)) {
        const invocationId = Number(key)
        
        // Find the name of the invocation to determine its decentralized folder name
        let invName = ""
        for (const chapter of currentChapters) {
          const inv = chapter.invocations.find((i: any) => i.id === invocationId)
          if (inv) {
            invName = inv.name || inv.internal_id || `Invocation ${invocationId}`
            break
          }
        }
        
        const sanitizedName = sanitizeName(invName)
        const invFolder = join(process.cwd(), "public/invocations", `${invocationId}_${sanitizedName}`)
        if (!existsSync(invFolder)) {
          mkdirSync(invFolder, { recursive: true })
        }
        
        const reciter = username || "local-developer"
        const version = "1"
        const outputMp3Filename = `${invocationId}_${sanitizedName}_${reciter}_${version}.mp3`
        const finalMp3Path = join(invFolder, outputMp3Filename)
        
        // Decode raw WebM/Wav buffer from base64
        const audioBuffer = Buffer.from(base64Data as string, "base64")
        const tempInputPath = join(scratchDir, `input-${invocationId}-${Date.now()}.webm`)
        
        // Write temporary WebM recording file
        writeFileSync(tempInputPath, audioBuffer)
        
        // Standardized MP3 conversion: 16-bit PCM / 44.1kHz standard compression
        try {
          await execAsync(`ffmpeg -y -i "${tempInputPath}" -codec:a libmp3lame -b:a 128k "${finalMp3Path}"`)
          savedAudioPaths[invocationId] = `/invocations/${invocationId}_${sanitizedName}/${outputMp3Filename}`
          
          // For GitHub commits, read back the MP3 file into Base64
          if (!isSandboxMode) {
            const mp3Buffer = readFileSync(finalMp3Path)
            updatedFiles[`public/invocations/${invocationId}_${sanitizedName}/${outputMp3Filename}`] = mp3Buffer.toString("base64")
          }
        } catch (err: any) {
          console.error(`Ffmpeg conversion error for invocation #${invocationId}:`, err)
          // Fallback directly to raw WebM if ffmpeg is unable to process
          const fallbackFilename = `${invocationId}_${sanitizedName}_${reciter}_${version}.webm`
          const fallbackPath = join(invFolder, fallbackFilename)
          writeFileSync(fallbackPath, audioBuffer)
          savedAudioPaths[invocationId] = `/invocations/${invocationId}_${sanitizedName}/${fallbackFilename}`
          
          if (!isSandboxMode) {
            updatedFiles[`public/invocations/${invocationId}_${sanitizedName}/${fallbackFilename}`] = base64Data as string
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
    
    // B. Map staged translation and transliteration corrections to both central and decentralized databases
    for (const change of changes) {
      const id = change.invocationId
      
      let invName = ""
      let chapterName = ""
      let targetInv: any = null
      
      for (const chapter of currentChapters) {
        const inv = chapter.invocations.find((i: any) => i.id === id)
        if (inv) {
          targetInv = inv
          invName = inv.name || inv.internal_id || `Invocation ${id}`
          chapterName = chapter.chapter_name
          break
        }
      }
      
      if (!targetInv) continue
      
      const sanitizedName = sanitizeName(invName)
      const invFolder = join(process.cwd(), "public/invocations", `${id}_${sanitizedName}`)
      if (!existsSync(invFolder)) {
        mkdirSync(invFolder, { recursive: true })
      }
      
      // Read existing data.json from the decentralized folder or initialize it
      const dataJsonPath = join(invFolder, "data.json")
      let dataJson: any = {
        id,
        name: invName,
        arabic: targetInv.arabic || "",
        metadata: {
          reference: targetInv.reference || "",
          chapter_name: chapterName,
          internal_id: targetInv.internal_id || ""
        },
        transliterations: {},
        translations: {},
        audio: []
      }
      
      if (existsSync(dataJsonPath)) {
        try {
          dataJson = JSON.parse(readFileSync(dataJsonPath, "utf-8"))
        } catch (e) {
          console.error("Error reading decentralized data.json file", e)
        }
      }
      
      // Apply Arabic text edits
      if (change.arabic) {
        targetInv.arabic = change.arabic
        dataJson.arabic = change.arabic
      }
      
      // Apply description edits
      if (change.description !== undefined) {
        targetInv.description = change.description
        dataJson.description = change.description
      }
      
      // Apply translation edits
      if (change.translations) {
        Object.entries(change.translations).forEach(([lang, text]) => {
          // Central JSON database mapping
          if (lang === "indonesian") targetInv.indonesian = text
          else if (lang === "english") targetInv.english = text
          else {
            if (!targetInv.additional_translations) targetInv.additional_translations = {}
            targetInv.additional_translations[lang] = text
          }
          // Decentralized data.json mapping
          if (!dataJson.translations) dataJson.translations = {}
          dataJson.translations[lang] = text
        })
      }
      
      // Apply transliteration edits
      if (change.transliterations) {
        Object.entries(change.transliterations).forEach(([lang, text]) => {
          // Central JSON database mapping
          if (lang === "latin") targetInv.latin = text
          else {
            if (!targetInv.additional_transliterations) targetInv.additional_transliterations = {}
            targetInv.additional_transliterations[lang] = text
          }
          // Decentralized data.json mapping
          if (!dataJson.transliterations) dataJson.transliterations = {}
          dataJson.transliterations[lang] = text
        })
      }
      
      // Apply audio path if recorded
      if (savedAudioPaths[id]) {
        targetInv.audio = savedAudioPaths[id]
        
        // Add or update the audio version inside data.json
        const reciter = username || "local-developer"
        const version = "1"
        const audioFilename = savedAudioPaths[id].split('/').pop() || ""
        
        if (!dataJson.audio) dataJson.audio = []
        
        const existingAudioIdx = dataJson.audio.findIndex((a: any) => a.reciter === reciter && a.version === version)
        const audioEntry = {
          reciter,
          version,
          filename: audioFilename,
          path: savedAudioPaths[id]
        }
        
        if (existingAudioIdx > -1) {
          dataJson.audio[existingAudioIdx] = audioEntry
        } else {
          dataJson.audio.push(audioEntry)
        }
      }
      
      // Append isnad tracking metadata (attribution chain)
      const attributionMetadata = {
        github_username: username || "local-developer",
        timestamp: timeStr,
        role: savedAudioPaths[id] ? "Narrator & Editor" : "Editor"
      }
      
      if (!targetInv.attribution_chain) {
        targetInv.attribution_chain = []
      }
      targetInv.attribution_chain.push(attributionMetadata)
      
      if (!dataJson.attribution_chain) {
        dataJson.attribution_chain = []
      }
      dataJson.attribution_chain.push(attributionMetadata)
      
      // Save data.json in Sandbox mode directly, or add to production updatedFiles payload
      const updatedDataJsonStr = JSON.stringify(dataJson, null, 2)
      if (isSandboxMode) {
        writeFileSync(dataJsonPath, updatedDataJsonStr)
      } else {
        updatedFiles[`public/invocations/${id}_${sanitizedName}/data.json`] = Buffer.from(updatedDataJsonStr).toString("base64")
      }
    }
    
    // Formulate updated central invocations string
    const updatedJsonString = JSON.stringify(currentChapters, null, 2)
    
    // Handle Local Sandbox Write
    if (isSandboxMode) {
      writeFileSync(localDataPath, updatedJsonString)
      
      return {
        success: true,
        mode: "sandbox",
        message: "Alhamdulillah. Staged changes successfully written directly to your local workspace files!",
        details: {
          changesCount: changes.length,
          audiosRecorded: Object.keys(savedAudioPaths)
        }
      }
    }
    
    // C. GitHub Git-less OAuth PR Submission Mode
    const userHeaders = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "DzikrDua-App"
    }
    
    try {
      // 1. Fork the upstream repository to user account
      const forkRes = await fetch(`https://api.github.com/repos/${UPSTREAM_OWNER}/${UPSTREAM_REPO}/forks`, {
        method: "POST",
        headers: userHeaders
      })
      
      if (!forkRes.ok && forkRes.status !== 202) {
        const errorText = await forkRes.text()
        throw new Error(`Failed to fork repository: ${forkRes.status} ${errorText}`)
      }
      
      const forkData = await forkRes.json()
      const userForkRepo = forkData.name || UPSTREAM_REPO
      
      // Wait briefly for fork to instantiate (Max 10 seconds check)
      let forkReady = false
      for (let attempt = 1; attempt <= 10; attempt++) {
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
      
      // 2. Get latest commit SHA of the main branch of upstream
      const refRes = await fetch(`https://api.github.com/repos/${UPSTREAM_OWNER}/${UPSTREAM_REPO}/git/ref/heads/master`, {
        headers: userHeaders
      })
      
      if (!refRes.ok) {
        const errorText = await refRes.text()
        throw new Error(`Failed to get upstream reference: ${refRes.status} ${errorText}`)
      }
      
      const refData = await refRes.json()
      const baseCommitSha = refData.object.sha
      
      // 3. Create a dynamic branch
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
      
      // 4. Commit modified invocations.json
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
      
      if (!commitJsonRes.ok) {
        const errJson = await commitJsonRes.json()
        throw new Error(`Failed committing database corrections: ${errJson.message}`)
      }
      
      // 5. Commit media files
      for (const [path, base64Content] of Object.entries(updatedFiles)) {
        const fileCheckRes = await fetch(`https://api.github.com/repos/${username}/${userForkRepo}/contents/${path}?ref=${branchName}`, {
          headers: userHeaders
        })
        let fileSha = ""
        if (fileCheckRes.status === 200) {
          const fileCheckData = await fileCheckRes.json()
          fileSha = fileCheckData.sha
        }
        
        const commitMediaRes = await fetch(`https://api.github.com/repos/${username}/${userForkRepo}/contents/${path}`, {
          method: "PUT",
          headers: userHeaders,
          body: JSON.stringify({
            message: `feat(audio): narrative audio upload for ${path}`,
            content: base64Content,
            sha: fileSha || undefined,
            branch: branchName
          })
        })

        if (!commitMediaRes.ok) {
          const errJson = await commitMediaRes.json()
          console.error(`Failed committing media file ${path}:`, errJson)
        }
      }
      
      // 6. Open a Pull Request from user branch to upstream master
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
      
      if (!prRes.ok) {
        throw new Error(`Failed to generate Pull Request: ${prData.message || "Unknown error"}`)
      }
      
      return {
        success: true,
        mode: "production",
        prUrl: prData.html_url,
        prNumber: prData.number,
        message: "Alhamdulillah! Your contribution was compiled, committed, and successfully submitted as a GitHub Pull Request!"
      }
    } catch (err: any) {
      console.error("GitHub Submission Error:", err)
      throw new Error(err.message || "Failed to submit contribution to GitHub")
    }
    
    return {
      success: true,
      mode: "production",
      prUrl: prData.html_url,
      prNumber: prData.number,
      message: "Alhamdulillah! Your contribution was compiled, committed, and successfully submitted as a GitHub Pull Request!"
    }
  })
