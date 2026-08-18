import { CalendarIcon, FileTextIcon } from "lucide-react";
const EmployeeDashboard = ({ data }) => {
    const emp = data.employee;

    const cards = [
        {
            icon: CalenderIcon,
            value: data.currentMonthAttendance,
            title: "Days Present",
            Subtitle: "This Month"
        },
        {
            icon: FileTextIcon,
            value: data.pendingLeaves,
            title: "Pending Leaves",
            Subtitle: "Awaiting approval"
        },
    ]


    return (
        
    )
}
