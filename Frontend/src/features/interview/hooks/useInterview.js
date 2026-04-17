import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf } from "../services/interview.api"
import { useContext, useEffect } from "react"
import { InterviewContext } from "../interview.context"
import { useParams } from "react-router"


export const useInterview = () => {

    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports } = context

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        let response = null
        try {
            response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            setReport(response.interviewReport)
        } catch (error) {
            console.error("Error generating report:", error.response?.data?.message || error.message)
        } finally {
            setLoading(false)
        }

        return response?.interviewReport
    }

    const getReportById = async (interviewId) => {
        setLoading(true)
        let response = null
        try {
            response = await getInterviewReportById(interviewId)
            setReport(response.interviewReport)
        } catch (error) {
            console.error("Error fetching report:", error.response?.data?.message || error.message)
        } finally {
            setLoading(false)
        }
        return response?.interviewReport
    }

    const getReports = async () => {
        setLoading(true)
        let response = null
        try {
            response = await getAllInterviewReports()
            setReports(response.interviewReports)
        } catch (error) {
            console.error("Error fetching reports:", error.response?.data?.message || error.message)
        } finally {
            setLoading(false)
        }

        return response?.interviewReports
    }

    const getResumePdf = async (interviewReportId) => {
        setLoading(true)
        try {
            console.log(`[PDF] Requesting PDF for report: ${interviewReportId}`)
            const response = await generateResumePdf({ interviewReportId })
            
            // Validate the response
            if (!response || !(response instanceof Blob)) {
                throw new Error("Invalid response: Expected PDF blob")
            }
            
            if (response.type !== "application/pdf") {
                console.error(`[PDF] Wrong content type: ${response.type}, size: ${response.size}`)
                
                // If it's HTML, it's an error response
                if (response.type === "text/html" || response.type.includes("html")) {
                    const text = await response.text()
                    throw new Error(`Server error: ${text.substring(0, 200)}`)
                }
                
                // Try to read as JSON error response
                const text = await response.text()
                try {
                    const jsonError = JSON.parse(text)
                    throw new Error(jsonError.message || "Unknown error")
                } catch (e) {
                    throw new Error(`Unexpected response type: ${response.type}`)
                }
            }
            
            if (response.size === 0) {
                throw new Error("PDF is empty")
            }
            
            console.log(`[PDF] Received valid PDF blob, size: ${response.size} bytes`)
            
            const url = window.URL.createObjectURL(response)
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
            
            // Cleanup
            setTimeout(() => {
                document.body.removeChild(link)
                window.URL.revokeObjectURL(url)
                console.log("[PDF] Downloaded successfully")
            }, 100)
        }
        catch (error) {
            console.error("[PDF] Download Error:", error.message)
            alert(`Failed to download PDF: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [ interviewId ])

    return { loading, report, reports, generateReport, getReportById, getReports, getResumePdf }

}