import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:3000",
    withCredentials: true,
})


/**
 * @description Service to generate interview report based on user self description, resume and job description.
 */
export const generateInterviewReport = async ({ jobDescription, selfDescription, resumeFile }) => {
    try {
        const formData = new FormData()
        formData.append("jobDescription", jobDescription)
        formData.append("selfDescription", selfDescription)
        formData.append("resume", resumeFile)

        const response = await api.post("/api/interview/", formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        })

        return response.data
    } catch (err) {
        console.error("Generate interview report error:", err.response?.data || err.message)
        throw err
    }
}


/**
 * @description Service to get interview report by interviewId.
 */
export const getInterviewReportById = async (interviewId) => {
    try {
        const response = await api.get(`/api/interview/report/${interviewId}`)
        return response.data
    } catch (err) {
        console.error("Get interview report error:", err.response?.data || err.message)
        throw err
    }
}


/**
 * @description Service to get all interview reports of logged in user.
 */
export const getAllInterviewReports = async () => {
    try {
        const response = await api.get("/api/interview/")
        return response.data
    } catch (err) {
        console.error("Get all interview reports error:", err.response?.data || err.message)
        throw err
    }
}


/**
 * @description Service to generate resume pdf based on user self description, resume content and job description.
 */
export const generateResumePdf = async ({ interviewReportId }) => {
    try {
        console.log(`[API] Requesting PDF generation for: ${interviewReportId}`)
        
        const response = await api.post(`/api/interview/resume/pdf/${interviewReportId}`, null, {
            responseType: "blob"
        })

        console.log(`[API] Received response, status: ${response.status}, type: ${response.headers['content-type']}`)
        
        // Check if response has error status in headers or data
        if (response.status >= 400) {
            throw new Error(`Server returned status ${response.status}`)
        }

        return response.data
    } catch (err) {
        console.error("[API] PDF generation error:", err.message)
        
        // If axios error, provide more details
        if (err.response) {
            console.error("[API] Error response status:", err.response.status)
            console.error("[API] Error response type:", err.response.headers['content-type'])
            
            // Try to read error response
            if (err.response.data instanceof Blob) {
                try {
                    const text = await err.response.data.text()
                    console.error("[API] Error response body:", text)

                    // Bubble up backend message so UI can display it.
                    const parsed = JSON.parse(text)
                    if (parsed?.message) {
                        throw new Error(parsed.message)
                    }
                } catch (e) {
                    if (!(e instanceof SyntaxError)) {
                        throw e
                    }
                    console.error("[API] Could not parse error response")
                }
            }
        }
        
        throw err
    }
}