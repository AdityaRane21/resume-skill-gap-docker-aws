const pdfParse = require("pdf-parse")
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")




/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "Resume file is required"
            })
        }

        const { selfDescription, jobDescription } = req.body

        // Validate required fields
        if (!selfDescription || !jobDescription) {
            return res.status(400).json({
                message: "Job description and self description are required"
            })
        }

        let resumeContent = ""
        try {
            resumeContent = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText()
            resumeContent = resumeContent.text || ""
        } catch (pdfErr) {
            console.error("[PDF Parse] Error parsing resume:", pdfErr.message)
            return res.status(400).json({
                message: "Failed to parse resume PDF. Please ensure it's a valid PDF file.",
                error: pdfErr.message
            })
        }

        if (!resumeContent || resumeContent.trim().length === 0) {
            return res.status(400).json({
                message: "Resume PDF is empty or could not be read"
            })
        }

        console.log(`[Report] Generating AI report for user: ${req.user.id}`)

        const interViewReportByAi = await generateInterviewReport({
            resume: resumeContent,
            selfDescription,
            jobDescription
        })

        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeContent,
            selfDescription,
            jobDescription,
            ...interViewReportByAi
        })

        console.log(`[Report] Successfully created report: ${interviewReport._id}`)

        res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport
        })
    } catch (err) {
        console.error("[Report] Generation Error:", err.message, err.stack)
        res.status(500).json({
            message: "Failed to generate interview report",
            error: err.message
        })
    }

}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}


/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params

        if (!interviewReportId) {
            return res.status(400).json({
                success: false,
                message: "Interview Report ID is required."
            })
        }

        console.log(`[PDF] Fetching report: ${interviewReportId}`)

        const interviewReport = await interviewReportModel.findById(interviewReportId)

        if (!interviewReport) {
            return res.status(404).json({
                success: false,
                message: "Interview report not found."
            })
        }

        // Verify ownership
        if (interviewReport.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized: You don't have access to this report."
            })
        }

        const { resume, jobDescription, selfDescription } = interviewReport

        // Detailed validation
        const missingFields = []
        if (!resume) missingFields.push("resume")
        if (!jobDescription) missingFields.push("jobDescription")
        // Allow historical records without selfDescription by using a fallback.
        const normalizedSelfDescription = (selfDescription || "").trim()

        if (missingFields.length > 0) {
            console.error(`[PDF] Missing fields: ${missingFields.join(", ")}`)
            return res.status(400).json({
                success: false,
                message: `Missing required data for PDF generation: ${missingFields.join(", ")}`
            })
        }

        console.log(`[PDF] Generating resume PDF for report: ${interviewReportId}`)
        
        const pdfBuffer = await generateResumePdf({
            resume,
            jobDescription,
            selfDescription: normalizedSelfDescription || "Candidate did not provide a self-description. Build the resume primarily from resume and job description."
        })

        if (!pdfBuffer || pdfBuffer.length === 0) {
            return res.status(500).json({
                success: false,
                message: "PDF generation produced empty buffer."
            })
        }

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`,
            "Cache-Control": "no-cache, no-store, must-revalidate"
        })

        console.log(`[PDF] Successfully generated PDF for report: ${interviewReportId}, size: ${pdfBuffer.length} bytes`)
        res.send(pdfBuffer)
    } catch (err) {
        console.error("[PDF] Generation Error:", err.message, err.stack)
        
        // Ensure we always return JSON for errors
        res.status(500).json({
            success: false,
            message: "Failed to generate PDF",
            error: err.message,
            timestamp: new Date().toISOString()
        })
    }
}

module.exports = { generateInterViewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController }