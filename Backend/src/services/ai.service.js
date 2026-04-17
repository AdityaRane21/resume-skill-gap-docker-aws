const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})


const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum([ "low", "medium", "high" ]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {


    const prompt = `Generate an interview report for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}
`

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(interviewReportSchema),
        }
    })

    return JSON.parse(response.text)


}



async function renderPdfAttempt(htmlContent) {
    const isProduction = process.env.NODE_ENV === "production"
    const launchOptions = {
        headless: true,
        args: isProduction
            ? [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage"
            ]
            : []
    }

    let browser = null
    try {
        browser = await puppeteer.launch(launchOptions)
        const page = await browser.newPage()

        await page.setViewport({ width: 1280, height: 1800 })
        await page.setDefaultTimeout(60000)
        await page.setDefaultNavigationTimeout(60000)

        await page.setContent(htmlContent, { waitUntil: "load" })
        await page.emulateMediaType("screen")

        // Wait for web fonts if any, but do not fail rendering if fonts are unavailable.
        await page.evaluate(async () => {
            if (document.fonts && document.fonts.ready) {
                await document.fonts.ready
            }
        })

        const pdfBuffer = await page.pdf({
            format: "A4",
            margin: {
                top: "20mm",
                bottom: "20mm",
                left: "15mm",
                right: "15mm"
            },
            printBackground: true,
            preferCSSPageSize: true
        })

        return pdfBuffer
    } finally {
        if (browser) {
            try {
                await browser.close()
            } catch (closeErr) {
                console.error("Error closing browser:", closeErr)
            }
        }
    }
}

async function generatePdfFromHtml(htmlContent) {
    try {
        return await renderPdfAttempt(htmlContent)
    } catch (firstErr) {
        console.error("[PDF] First render attempt failed:", firstErr.message)

        // Retry once because Chromium can occasionally crash on first boot.
        try {
            return await renderPdfAttempt(htmlContent)
        } catch (secondErr) {
            throw new Error(`PDF generation failed: ${secondErr.message}`)
        }
    }
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
    try {
        const safeSelfDescription = (selfDescription || "").trim() || "Candidate did not provide a self-description."
        const resumePdfSchema = z.object({
            html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
        })

        const prompt = `Generate resume for a candidate with the following details:
                            Resume: ${resume}
                            Self Description: ${safeSelfDescription}
                            Job Description: ${jobDescription}

                            the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                            The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                            The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                            you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                            The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                            The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                        `

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: zodToJsonSchema(resumePdfSchema),
            }
        })

        const jsonContent = JSON.parse(response.text)
        
        if (!jsonContent.html) {
            throw new Error("AI did not generate HTML content")
        }

        const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

        return pdfBuffer
    } catch (err) {
        throw new Error(`Resume PDF generation failed: ${err.message}`)
    }
}

module.exports = { generateInterviewReport, generateResumePdf }