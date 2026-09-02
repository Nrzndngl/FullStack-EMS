import sendEmail from "../config/nodemailer.js";

const enabled = () =>
    Boolean(process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SENDER_EMAIL);

const safe = async (fn) => {
    if (!enabled()) return;
    try {
        await fn();
    } catch (error) {
        console.error("Notification email error:", error);
    }
};

export const sendLeaveDecisionEmail = async ({ to, employeeName, type, status, startDate, endDate, reason }) => {
    await safe(() =>
        sendEmail({
            to,
            subject: `Leave ${status.toLowerCase()}`,
            body: `
                <p>Dear ${employeeName},</p>
                <p>Your <strong>${type}</strong> leave request (${startDate} to ${endDate}) has been <strong>${status}</strong>.</p>
                ${reason ? `<p>Reason: ${reason}</p>` : ""}
                <p>Regards,<br/>FullStack EMS</p>
            `,
        })
    );
};

export const sendPayslipEmail = async ({ to, employeeName, period, netSalary }) => {
    await safe(() =>
        sendEmail({
            to,
            subject: `Your payslip for ${period} is ready`,
            body: `
                <p>Dear ${employeeName},</p>
                <p>Your payslip for <strong>${period}</strong> has been generated.</p>
                <p>Net salary: <strong>${netSalary}</strong></p>
                <p>Regards,<br/>FullStack EMS</p>
            `,
        })
    );
};